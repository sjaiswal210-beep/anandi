import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import * as path from 'path';
import { PrismaService } from '../../common/prisma/prisma.service';

export interface ScrapedLead {
  name: string;
  phone?: string;
  email?: string;
  source: string;
  platform: string;
  location?: string;
  intent?: string;
  rawData?: Record<string, unknown>;
}

export interface ScrapeJob {
  id: string;
  platform: string;
  targetArea: string;
  keywords: string[];
  status: 'running' | 'completed' | 'failed';
  leadsFound: number;
  startedAt: Date;
  completedAt?: Date;
  error?: string;
}

@Injectable()
export class LeadScraperService {
  private readonly logger = new Logger(LeadScraperService.name);
  private jobs: ScrapeJob[] = [];

  constructor(private prisma: PrismaService) {}

  // Receives leads from n8n webhook or any external scraper
  async ingestScrapedLeads(workspaceId: string, leads: ScrapedLead[]) {
    const results = { ingested: 0, duplicates: 0, errors: 0 };

    for (const lead of leads) {
      try {
        if (!lead.phone && !lead.email) { results.errors++; continue; }

        // Deduplicate
        const existing = await this.prisma.lead.findFirst({
          where: {
            workspaceId,
            OR: [
              ...(lead.phone ? [{ phone: lead.phone }] : []),
              ...(lead.email ? [{ email: lead.email }] : []),
            ],
          },
        });

        if (existing) { results.duplicates++; continue; }

        const admin = await this.prisma.user.findFirst({
          where: { workspaces: { some: { workspaceId } }, role: { in: ['SUPER_ADMIN', 'BUILDER', 'SALES_MANAGER'] } },
        });

        await this.prisma.lead.create({
          data: {
            workspaceId,
            createdById: admin?.id || '',
            name: lead.name || 'Scraped Lead',
            phone: lead.phone || '',
            email: lead.email,
            source: 'OTHER',
            status: 'NEW',
            tags: ['scraped', lead.platform, lead.location || ''].filter(Boolean),
            customFields: {
              scrapedFrom: lead.platform,
              targetArea: lead.location,
              intent: lead.intent,
              rawData: JSON.stringify(lead.rawData || {}),
            } as any,
          },
        });
        results.ingested++;
      } catch (e) {
        results.errors++;
      }
    }

    this.logger.log(`Scraped leads ingested: ${results.ingested} new, ${results.duplicates} dupes, ${results.errors} errors`);
    return results;
  }

  // Start a scrape job (triggers real scraper on VPS or returns mock for demo)
  async startScrapeJob(workspaceId: string, dto: {
    platform: string;
    targetArea: string;
    keywords: string[];
    n8nWebhookUrl?: string;
  }) {
    const job: ScrapeJob = {
      id: 'job-' + Date.now().toString(36),
      platform: dto.platform,
      targetArea: dto.targetArea,
      keywords: dto.keywords,
      status: 'running',
      leadsFound: 0,
      startedAt: new Date(),
    };
    this.jobs.push(job);

    // If n8n webhook URL is provided, trigger it
    if (dto.n8nWebhookUrl) {
      try {
        const axios = (await import('axios')).default;
        await axios.post(dto.n8nWebhookUrl, {
          jobId: job.id,
          platform: dto.platform,
          targetArea: dto.targetArea,
          keywords: dto.keywords,
          callbackUrl: `http://localhost:4000/api/v1/lead-scraper/webhook/${workspaceId}`,
        });
        this.logger.log(`Triggered n8n workflow for ${dto.platform} scrape`);
      } catch (e: any) {
        this.logger.warn(`n8n trigger failed: ${e.message}`);
      }
    }

    // Run the real scraper. There is deliberately no synthetic fallback —
    // fabricated leads are worse than none, because they pollute the CRM with
    // numbers nobody can call.
    const { exec } = await import('child_process');
    const appRoot = process.cwd().includes(`apps${path.sep}api`)
      ? process.cwd().replace(/[/\\]apps[/\\]api.*/, '')
      : process.cwd().replace(/[/\\]dist.*/, '');

    const scriptPath = dto.platform === 'google_maps'
      ? path.join(appRoot, 'scripts', 'real-scraper.js')
      : path.join(appRoot, 'scripts', 'scrape-listings.js');

    const fs = await import('fs');
    if (!fs.existsSync(scriptPath)) {
      job.status = 'failed';
      job.completedAt = new Date();
      job.error = `Scraper script not found at ${scriptPath}`;
      this.logger.error(job.error);
      throw new BadRequestException(
        `Scraper script is missing on this host (${scriptPath}). ` +
          'Scraping only runs on the VPS where Chromium is installed.',
      );
    }

    this.logger.log(`Running real scraper: ${scriptPath}`);
    exec(`node ${scriptPath}`, { cwd: appRoot, timeout: 180000 }, async (err, stdout) => {
      job.completedAt = new Date();

      if (err) {
        job.status = 'failed';
        job.error = err.message;
        this.logger.error(`Scraper failed: ${err.message}`);
        return;
      }

      job.status = 'completed';
      // The script posts its findings to the ingest webhook, so count what
      // actually landed rather than trusting stdout.
      const found = stdout.match(/Total leads scraped:\s*(\d+)/);
      job.leadsFound = found ? Number(found[1]) : 0;
      this.logger.log(`Scraper finished, ${job.leadsFound} leads reported`);
    });

    return {
      jobId: job.id,
      status: 'running',
      message: `Scraping ${dto.platform} for "${dto.targetArea}" with keywords: ${dto.keywords.join(', ')}`,
    };
  }

  async getJobs() {
    return this.jobs.sort((a, b) => b.startedAt.getTime() - a.startedAt.getTime());
  }

  async getScrapedLeads(workspaceId: string) {
    return this.prisma.lead.findMany({
      where: { workspaceId, tags: { has: 'scraped' } },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
  }

}
