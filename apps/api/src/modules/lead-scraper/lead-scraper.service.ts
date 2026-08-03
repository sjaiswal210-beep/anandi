import { Injectable, Logger } from '@nestjs/common';
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

  // Start a scrape job (returns mock data for demo — in production, triggers n8n workflow)
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

    // Simulate scrape with realistic demo data
    setTimeout(async () => {
      const mockLeads = this.generateMockLeads(dto.platform, dto.targetArea, dto.keywords);
      const result = await this.ingestScrapedLeads(workspaceId, mockLeads);
      job.status = 'completed';
      job.leadsFound = result.ingested;
      job.completedAt = new Date();
    }, 3000);

    return { jobId: job.id, status: 'running', message: `Scraping ${dto.platform} for "${dto.targetArea}" with keywords: ${dto.keywords.join(', ')}` };
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

  private generateMockLeads(platform: string, area: string, keywords: string[]): ScrapedLead[] {
    const names = [
      'Rahul Sharma', 'Priya Verma', 'Amit Deshmukh', 'Sneha Patil', 'Vikram Joshi',
      'Neha Kulkarni', 'Suresh Yadav', 'Kavita Nair', 'Manoj Tiwari', 'Anjali Gupta',
      'Deepak Chauhan', 'Ritu Agarwal', 'Sanjay Mishra', 'Pooja Reddy', 'Kiran Mehta',
    ];

    const count = Math.floor(Math.random() * 8) + 5;
    return Array.from({ length: count }, (_, i) => ({
      name: names[i % names.length],
      phone: '9' + String(Math.floor(Math.random() * 900000000) + 100000000),
      email: i % 3 === 0 ? `${names[i % names.length].split(' ')[0].toLowerCase()}${Math.floor(Math.random() * 99)}@gmail.com` : undefined,
      source: 'OTHER',
      platform,
      location: area,
      intent: ['looking_to_buy', 'researching', 'investor', 'comparing'][Math.floor(Math.random() * 4)],
      rawData: {
        keywords: keywords.join(', '),
        scrapedAt: new Date().toISOString(),
        profileUrl: `https://${platform}.com/user/${i}`,
      },
    }));
  }
}
