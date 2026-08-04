import { Controller, Get, Post, Body, Query, HttpCode } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { LeadIngestionService } from './lead-ingestion.service';
import { Public } from '../../common/decorators/public.decorator';
import { ConfigService } from '@nestjs/config';
import { Logger } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';

/**
 * Meta (Facebook/Instagram) Lead Ads Webhook
 * 
 * Setup in Meta Business Suite:
 * 1. Go to Business Settings → Integrations → Lead Access
 * 2. Set webhook URL: http://YOUR-VPS:4000/api/v1/meta-leads/webhook
 * 3. Verify token: anandi-park-meta-verify
 * 4. Subscribe to: leadgen events
 * 
 * When someone fills your lead ad form on Facebook/Instagram,
 * Meta sends the lead data here → we create it in CRM automatically.
 */
@ApiTags('Meta Lead Ads')
@Controller('meta-leads')
export class MetaWebhookController {
  private readonly logger = new Logger(MetaWebhookController.name);
  private readonly verifyToken: string;
  private readonly workspaceId: string;

  constructor(
    private readonly ingestionService: LeadIngestionService,
    private configService: ConfigService,
    private prisma: PrismaService,
  ) {
    this.verifyToken = this.configService.get<string>('META_VERIFY_TOKEN', 'anandi-park-meta-verify');
    this.workspaceId = ''; // Will be fetched dynamically
  }

  /**
   * Meta webhook verification (GET request)
   * Meta sends this to verify your endpoint when you set up the webhook
   */
  @Public()
  @Get('webhook')
  @ApiOperation({ summary: 'Meta webhook verification' })
  verify(
    @Query('hub.mode') mode: string,
    @Query('hub.verify_token') token: string,
    @Query('hub.challenge') challenge: string,
  ) {
    if (mode === 'subscribe' && token === this.verifyToken) {
      this.logger.log('Meta webhook verified successfully');
      return challenge;
    }
    return 'Verification failed';
  }

  /**
   * Meta webhook for incoming lead data (POST request)
   * This is called every time someone submits your lead ad form
   */
  @Public()
  @Post('webhook')
  @HttpCode(200)
  @ApiOperation({ summary: 'Receive lead from Meta Lead Ads' })
  async handleLead(@Body() body: any) {
    this.logger.log('Meta lead webhook received');

    try {
      const entries = body?.entry || [];
      for (const entry of entries) {
        const changes = entry?.changes || [];
        for (const change of changes) {
          if (change.field === 'leadgen') {
            const leadData = change.value;
            await this.processMetaLead(leadData);
          }
        }
      }
    } catch (e: any) {
      this.logger.error('Meta webhook processing error:', e.message);
    }

    return { received: true };
  }

  /**
   * Direct lead submission (for testing or manual Meta form integration)
   * Use this if you want to manually POST leads from Meta without the full webhook flow
   */
  @Public()
  @Post('submit')
  @ApiOperation({ summary: 'Direct lead submission from Meta ads (simplified)' })
  async directSubmit(@Body() body: {
    name: string;
    phone: string;
    email?: string;
    ad_name?: string;
    form_name?: string;
    platform?: string;
    city?: string;
    budget?: string;
  }) {
    this.logger.log(`Direct Meta lead: ${body.name} - ${body.phone}`);

    const workspace = await this.prisma.workspace.findFirst();
    if (!workspace) return { error: 'No workspace configured' };

    return this.ingestionService.ingest(workspace.id, {
      name: body.name,
      phone: body.phone,
      email: body.email,
      source: body.platform === 'instagram' ? 'INSTAGRAM' : 'FACEBOOK',
      message: `From Meta Ad: ${body.ad_name || ''} | Form: ${body.form_name || ''} | Budget: ${body.budget || 'not specified'} | City: ${body.city || ''}`,
      metadata: { ad_name: body.ad_name, form_name: body.form_name, platform: body.platform },
    });
  }

  private async processMetaLead(leadData: any) {
    // Meta sends: { leadgen_id, page_id, form_id, created_time, field_data: [...] }
    // field_data contains the form fields the user filled
    const fields = leadData?.field_data || [];
    
    let name = '';
    let phone = '';
    let email = '';
    let city = '';

    for (const field of fields) {
      const key = (field.name || '').toLowerCase();
      const value = Array.isArray(field.values) ? field.values[0] : '';
      
      if (key.includes('name') || key === 'full_name') name = value;
      if (key.includes('phone') || key.includes('mobile') || key === 'phone_number') phone = value;
      if (key.includes('email')) email = value;
      if (key.includes('city') || key.includes('location')) city = value;
    }

    if (!name && !phone) {
      this.logger.warn('Meta lead missing name and phone, skipping');
      return;
    }

    const workspace = await this.prisma.workspace.findFirst();
    if (!workspace) return;

    await this.ingestionService.ingest(workspace.id, {
      name: name || 'Meta Lead',
      phone: phone || '',
      email: email || undefined,
      source: 'FACEBOOK',
      message: `Meta Lead Ad | Page: ${leadData.page_id} | Form: ${leadData.form_id} | City: ${city}`,
      metadata: { leadgen_id: leadData.leadgen_id, page_id: leadData.page_id, form_id: leadData.form_id },
    });

    this.logger.log(`Meta lead ingested: ${name} (${phone})`);
  }
}
