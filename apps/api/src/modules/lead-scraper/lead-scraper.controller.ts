import { Controller, Get, Post, Param, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { LeadScraperService, ScrapedLead } from './lead-scraper.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { WorkspaceGuard } from '../../common/guards/workspace.guard';
import { WorkspaceId } from '../../common/decorators/workspace.decorator';
import { Public } from '../../common/decorators/public.decorator';

@ApiTags('Lead Scraper')
@Controller('lead-scraper')
export class LeadScraperController {
  constructor(private readonly service: LeadScraperService) {}

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, WorkspaceGuard)
  @Post('start')
  @ApiOperation({ summary: 'Start a scrape job' })
  async startJob(
    @WorkspaceId() workspaceId: string,
    @Body() dto: { platform: string; targetArea: string; keywords: string[]; n8nWebhookUrl?: string },
  ) {
    return this.service.startScrapeJob(workspaceId, dto);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, WorkspaceGuard)
  @Get('jobs')
  @ApiOperation({ summary: 'Get all scrape jobs' })
  async getJobs() {
    return this.service.getJobs();
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, WorkspaceGuard)
  @Get('leads')
  @ApiOperation({ summary: 'Get scraped leads' })
  async getScrapedLeads(@WorkspaceId() workspaceId: string) {
    return this.service.getScrapedLeads(workspaceId);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, WorkspaceGuard)
  @Get('stats')
  @ApiOperation({ summary: 'Scraped lead totals, including results from cron runs' })
  async getStats(@WorkspaceId() workspaceId: string) {
    return this.service.getStats(workspaceId);
  }

  // n8n / external scraper webhook — receives scraped leads
  @Public()
  @Post('webhook/:workspaceId')
  @ApiOperation({ summary: 'Webhook to receive scraped leads from n8n or external tools' })
  async webhook(
    @Param('workspaceId') workspaceId: string,
    @Body() body: { leads: ScrapedLead[] },
  ) {
    return this.service.ingestScrapedLeads(workspaceId, body.leads);
  }
}
