import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../common/prisma/prisma.service';
import { LeadIngestionService } from './lead-ingestion.service';

const GRAPH = 'https://graph.facebook.com/v21.0';

/**
 * Pulls Meta Lead Ads submissions by polling the Graph API.
 *
 * Polling is used rather than webhooks deliberately: webhooks require a
 * publicly reachable HTTPS endpoint, which this deployment does not have.
 * Polling needs only an outbound connection and a Page access token.
 */
@Injectable()
export class MetaLeadsService {
  private readonly logger = new Logger(MetaLeadsService.name);

  constructor(
    private configService: ConfigService,
    private prisma: PrismaService,
    private ingestion: LeadIngestionService,
  ) {}

  private get token(): string | undefined {
    return this.configService.get<string>('META_PAGE_ACCESS_TOKEN');
  }

  private get pageId(): string | undefined {
    return this.configService.get<string>('META_PAGE_ID');
  }

  private requireToken(): string {
    const t = this.token;
    if (!t) {
      throw new BadRequestException(
        'META_PAGE_ACCESS_TOKEN is not set in .env. Generate a Page token with ' +
          'leads_retrieval and pages_read_engagement permissions.',
      );
    }
    return t;
  }

  /**
   * The configured token may be a system-user token. Lead form APIs require a
   * Page token, so we exchange on first use and cache it.
   */
  private cachedPageToken: string | null = null;

  private async getPageToken(): Promise<string> {
    if (this.cachedPageToken) return this.cachedPageToken;

    const userToken = this.requireToken();
    const pageId = this.pageId;
    if (!pageId) {
      this.cachedPageToken = userToken;
      return userToken;
    }

    const axios = (await import('axios')).default;
    try {
      const res = await axios.get(`${GRAPH}/${pageId}`, {
        params: { fields: 'access_token', access_token: userToken },
        timeout: 15000,
      });
      if (res.data?.access_token) {
        this.cachedPageToken = res.data.access_token;
        this.logger.log('Exchanged system-user token for Page token (leads)');
        return this.cachedPageToken!;
      }
    } catch (e: any) {
      this.logger.warn(`Page token exchange failed: ${e?.response?.data?.error?.message || e.message}`);
    }

    this.cachedPageToken = userToken;
    return userToken;
  }

  private async get<T = any>(path: string, params: Record<string, string> = {}): Promise<T> {
    const axios = (await import('axios')).default;
    const url = new URL(`${GRAPH}/${path.replace(/^\//, '')}`);
    Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
    url.searchParams.set('access_token', await this.getPageToken());

    try {
      const res = await axios.get(url.toString(), { timeout: 30000 });
      return res.data;
    } catch (e: any) {
      const err = e?.response?.data?.error;
      throw new BadRequestException(
        `Meta API error on ${path}: ${err?.message || e.message}` +
          (err?.code ? ` (code ${err.code})` : ''),
      );
    }
  }

  /** Confirms the token works and reports what it can actually do. */
  async diagnostics() {
    if (!this.token) {
      return {
        configured: false,
        message:
          'META_PAGE_ACCESS_TOKEN missing. Add META_PAGE_ACCESS_TOKEN and META_PAGE_ID to .env, then restart the API.',
      };
    }

    const result: Record<string, unknown> = { configured: true, pageIdConfigured: this.pageId ?? null };

    try {
      const me = await this.get('me', { fields: 'id,name' });
      result.tokenValidFor = me;
    } catch (e: any) {
      return { ...result, ok: false, error: e.message };
    }

    try {
      const forms = await this.listForms();
      result.leadForms = forms;
      result.ok = true;
    } catch (e: any) {
      result.ok = false;
      result.formsError = e.message;
      result.hint =
        'If this says the leads_retrieval permission is missing, the Page token needs it. ' +
        'Also confirm Lead Access is granted to this app under Business Settings.';
    }

    return result;
  }

  /** Lead forms attached to the Page. */
  async listForms() {
    const pageId = this.pageId;
    if (!pageId) {
      throw new BadRequestException('META_PAGE_ID is not set in .env');
    }

    const data = await this.get<{ data: any[] }>(`${pageId}/leadgen_forms`, {
      fields: 'id,name,status,leads_count',
      limit: '50',
    });

    return (data.data || []).map((f) => ({
      id: f.id,
      name: f.name,
      status: f.status,
      leadsCount: f.leads_count ?? null,
    }));
  }

  /**
   * Fetches submissions and files them into the CRM.
   * Safe to run repeatedly — already-seen leads are skipped by leadgen id.
   */
  async pollLeads(workspaceId: string, opts?: { sinceHours?: number; formId?: string }) {
    const sinceHours = opts?.sinceHours ?? 24 * 7;
    const since = Math.floor((Date.now() - sinceHours * 3600_000) / 1000);

    const forms = opts?.formId
      ? [{ id: opts.formId, name: opts.formId }]
      : await this.listForms();

    if (forms.length === 0) {
      return {
        forms: 0,
        fetched: 0,
        ingested: 0,
        skipped: 0,
        errors: [] as string[],
        message: 'No lead forms found on this Page. Create a Lead Ad form in Meta Ads Manager first.',
      };
    }

    let fetched = 0;
    let ingested = 0;
    let skipped = 0;
    const errors: string[] = [];

    for (const form of forms) {
      try {
        const data = await this.get<{ data: any[] }>(`${form.id}/leads`, {
          fields: 'id,created_time,field_data,platform,ad_name,campaign_name',
          limit: '100',
          filtering: JSON.stringify([
            { field: 'time_created', operator: 'GREATER_THAN', value: since },
          ]),
        });

        for (const raw of data.data || []) {
          fetched++;
          try {
            const wasNew = await this.ingestOne(workspaceId, raw, form.name);
            if (wasNew) ingested++;
            else skipped++;
          } catch (e: any) {
            errors.push(`lead ${raw.id}: ${e.message}`);
          }
        }
      } catch (e: any) {
        errors.push(`form ${form.name}: ${e.message}`);
      }
    }

    this.logger.log(
      `Meta lead poll: ${fetched} fetched, ${ingested} new, ${skipped} already known, ${errors.length} errors`,
    );

    return { forms: forms.length, fetched, ingested, skipped, errors: errors.slice(0, 10) };
  }

  /** Returns true when a new lead was created. */
  private async ingestOne(workspaceId: string, raw: any, formName: string): Promise<boolean> {
    const fields: any[] = raw.field_data || [];
    let name = '';
    let phone = '';
    let email = '';
    let city = '';
    const extra: Record<string, string> = {};

    for (const f of fields) {
      const key = String(f.name || '').toLowerCase();
      const value = Array.isArray(f.values) ? String(f.values[0] ?? '') : '';
      if (!value) continue;

      if (!name && (key.includes('name') || key === 'full_name')) name = value;
      else if (!phone && (key.includes('phone') || key.includes('mobile'))) phone = value;
      else if (!email && key.includes('email')) email = value;
      else if (!city && (key.includes('city') || key.includes('location'))) city = value;
      else extra[key] = value;
    }

    if (!phone && !email) {
      throw new Error('submission had neither phone nor email');
    }

    // Skip anything already recorded, matched on Meta's own lead id.
    const leadgenId = String(raw.id);
    const already = await this.prisma.lead.findFirst({
      where: { workspaceId, customFields: { path: ['leadgenId'], equals: leadgenId } },
      select: { id: true },
    });
    if (already) return false;

    const normalisedPhone = phone.replace(/[^\d]/g, '').replace(/^91(?=\d{10}$)/, '');

    await this.ingestion.ingest(workspaceId, {
      name: name || 'Meta Lead',
      phone: normalisedPhone,
      email: email || undefined,
      source: String(raw.platform).toLowerCase() === 'ig' ? 'INSTAGRAM' : 'FACEBOOK',
      message:
        `Meta Lead Ad — form "${formName}"` +
        (raw.ad_name ? ` · ad "${raw.ad_name}"` : '') +
        (city ? ` · city ${city}` : ''),
      metadata: {
        leadgenId,
        formName,
        adName: raw.ad_name ?? null,
        campaignName: raw.campaign_name ?? null,
        platform: raw.platform ?? null,
        createdTime: raw.created_time ?? null,
        city: city || null,
        ...extra,
      },
    });

    return true;
  }
}
