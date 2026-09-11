import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../common/prisma/prisma.service';

const GRAPH = 'https://graph.facebook.com/v21.0';

type Metrics = {
  impressions?: number;
  clicks?: number;
  leads?: number;
  reach?: number;
  ctr?: number;
  cpl?: number;
};

/**
 * Ad spend + analytics across Meta, Google and any other channel.
 * Built on the existing Campaign model so no DB migration is needed:
 *   platform: 'meta' | 'google' | 'other'
 *   budget / spent: money
 *   metrics (Json): { impressions, clicks, leads, reach }
 *   metadata (Json): { source: 'manual' | 'meta_api', externalId, currency }
 */
@Injectable()
export class AdsService {
  private readonly logger = new Logger(AdsService.name);

  constructor(
    private prisma: PrismaService,
    private configService: ConfigService,
  ) {}

  async list(workspaceId: string) {
    return this.prisma.campaign.findMany({
      where: { workspaceId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async create(workspaceId: string, dto: {
    name: string;
    platform: string;
    type?: string;
    budget?: number;
    spent?: number;
    startDate?: string;
    endDate?: string;
    status?: string;
    metrics?: Metrics;
    content?: Record<string, unknown>;
  }) {
    return this.prisma.campaign.create({
      data: {
        workspaceId,
        name: dto.name,
        type: dto.type || 'lead_generation',
        platform: (dto.platform || 'other').toLowerCase(),
        status: (dto.status as any) || 'ACTIVE',
        budget: dto.budget ?? 0,
        spent: dto.spent ?? 0,
        startDate: dto.startDate ? new Date(dto.startDate) : undefined,
        endDate: dto.endDate ? new Date(dto.endDate) : undefined,
        content: (dto.content || {}) as any,
        metrics: (dto.metrics || {}) as any,
        metadata: { source: 'manual', currency: 'INR' } as any,
      },
    });
  }

  async update(id: string, dto: any) {
    const existing = await this.prisma.campaign.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Campaign not found');
    return this.prisma.campaign.update({
      where: { id },
      data: {
        ...(dto.name !== undefined && { name: dto.name }),
        ...(dto.platform !== undefined && { platform: String(dto.platform).toLowerCase() }),
        ...(dto.status !== undefined && { status: dto.status }),
        ...(dto.budget !== undefined && { budget: dto.budget }),
        ...(dto.spent !== undefined && { spent: dto.spent }),
        ...(dto.startDate !== undefined && { startDate: dto.startDate ? new Date(dto.startDate) : null }),
        ...(dto.endDate !== undefined && { endDate: dto.endDate ? new Date(dto.endDate) : null }),
        ...(dto.metrics !== undefined && { metrics: dto.metrics }),
        ...(dto.content !== undefined && { content: dto.content }),
      },
    });
  }

  async remove(id: string) {
    await this.prisma.campaign.delete({ where: { id } }).catch(() => undefined);
    return { deleted: true };
  }

  /** Aggregated analytics across all campaigns + real lead attribution. */
  async summary(workspaceId: string) {
    const campaigns = await this.prisma.campaign.findMany({ where: { workspaceId } });

    const byPlatform: Record<string, { spent: number; budget: number; leads: number; impressions: number; clicks: number; count: number }> = {};
    let totalSpent = 0;
    let totalBudget = 0;
    let totalLeads = 0;
    let totalImpr = 0;
    let totalClicks = 0;

    for (const c of campaigns) {
      const p = (c.platform || 'other').toLowerCase();
      const m = (c.metrics || {}) as Metrics;
      const spent = Number(c.spent || 0);
      const budget = Number(c.budget || 0);
      const leads = Number(m.leads || 0);
      const impr = Number(m.impressions || 0);
      const clicks = Number(m.clicks || 0);

      byPlatform[p] = byPlatform[p] || { spent: 0, budget: 0, leads: 0, impressions: 0, clicks: 0, count: 0 };
      byPlatform[p].spent += spent;
      byPlatform[p].budget += budget;
      byPlatform[p].leads += leads;
      byPlatform[p].impressions += impr;
      byPlatform[p].clicks += clicks;
      byPlatform[p].count += 1;

      totalSpent += spent;
      totalBudget += budget;
      totalLeads += leads;
      totalImpr += impr;
      totalClicks += clicks;
    }

    // Cross-check against real CRM leads from paid sources.
    const paidLeads = await this.prisma.lead.groupBy({
      by: ['source'],
      where: { workspaceId, source: { in: ['FACEBOOK', 'INSTAGRAM', 'GOOGLE_ADS'] } },
      _count: true,
    });
    const crmLeadsBySource = Object.fromEntries(paidLeads.map((p) => [p.source, p._count]));
    const crmPaidLeads = paidLeads.reduce((s, p) => s + p._count, 0);

    const attributedLeads = totalLeads || crmPaidLeads;

    return {
      totals: {
        spent: totalSpent,
        budget: totalBudget,
        remaining: Math.max(0, totalBudget - totalSpent),
        leads: attributedLeads,
        impressions: totalImpr,
        clicks: totalClicks,
        ctr: totalImpr > 0 ? Number(((totalClicks / totalImpr) * 100).toFixed(2)) : 0,
        cpl: attributedLeads > 0 ? Math.round(totalSpent / attributedLeads) : 0,
        cpc: totalClicks > 0 ? Math.round(totalSpent / totalClicks) : 0,
        activeCampaigns: campaigns.filter((c) => c.status === 'ACTIVE').length,
      },
      byPlatform: Object.entries(byPlatform).map(([platform, v]) => ({
        platform,
        ...v,
        cpl: v.leads > 0 ? Math.round(v.spent / v.leads) : 0,
      })),
      crmLeadsBySource,
      metaConnected: Boolean(this.metaToken && this.adAccountId),
    };
  }

  // ---- Meta Ads API ----

  private get metaToken(): string | undefined {
    return this.configService.get<string>('META_PAGE_ACCESS_TOKEN') ||
      this.configService.get<string>('META_AD_ACCESS_TOKEN');
  }

  private get adAccountId(): string | undefined {
    // Format: act_1234567890
    return this.configService.get<string>('META_AD_ACCOUNT_ID');
  }

  /**
   * Turns a generated-image reference into a public https URL Meta can fetch.
   * - full http(s) URL: returned as-is
   * - relative /uploads/... path: joined to API_PUBLIC_URL (falls back to
   *   API_URL). Meta fetches images server-side, so localhost never works.
   */
  private resolvePublicImageUrl(input?: string): string | undefined {
    if (!input) return undefined;
    const v = input.trim();
    if (/^https?:\/\//i.test(v)) return v;
    const base = (
      this.configService.get<string>('API_PUBLIC_URL') ||
      this.configService.get<string>('API_URL') ||
      ''
    ).replace(/\/$/, '');
    if (!base) return undefined;
    return `${base}/${v.replace(/^\//, '')}`;
  }

  /**
   * Pulls spend + insights from Meta Ads and upserts them as campaigns.
   * Needs META_AD_ACCOUNT_ID and a token with ads_read.
   */
  async syncMeta(workspaceId: string) {
    if (!this.metaToken || !this.adAccountId) {
      return {
        synced: 0,
        message: 'Meta not connected. Set META_AD_ACCOUNT_ID (act_...) and a token with ads_read in .env.',
      };
    }

    const axios = (await import('axios')).default;
    try {
      const url = `${GRAPH}/${this.adAccountId}/campaigns`;
      const res = await axios.get(url, {
        params: {
          fields:
            'name,status,daily_budget,lifetime_budget,' +
            'insights{spend,impressions,clicks,reach,actions}',
          access_token: this.metaToken,
          limit: 50,
        },
        timeout: 30000,
      });

      const rows: any[] = res.data?.data || [];
      let synced = 0;

      for (const row of rows) {
        const ins = row.insights?.data?.[0] || {};
        const leadAction = (ins.actions || []).find((a: any) =>
          String(a.action_type).includes('lead'),
        );
        const metrics: Metrics = {
          spend: undefined,
          impressions: Number(ins.impressions || 0),
          clicks: Number(ins.clicks || 0),
          reach: Number(ins.reach || 0),
          leads: leadAction ? Number(leadAction.value) : 0,
        } as any;

        const spent = Number(ins.spend || 0);

        const existing = await this.prisma.campaign.findFirst({
          where: { workspaceId, metadata: { path: ['externalId'], equals: row.id } },
        });

        const data = {
          workspaceId,
          name: row.name,
          type: 'lead_generation',
          platform: 'meta',
          status: (String(row.status).toUpperCase() === 'ACTIVE' ? 'ACTIVE' : 'PAUSED') as any,
          budget: Number(row.daily_budget || row.lifetime_budget || 0) / 100,
          spent,
          metrics: metrics as any,
          metadata: { source: 'meta_api', externalId: row.id, currency: 'INR' } as any,
        };

        if (existing) {
          await this.prisma.campaign.update({ where: { id: existing.id }, data });
        } else {
          await this.prisma.campaign.create({ data });
        }
        synced++;
      }

      this.logger.log(`Meta ads synced: ${synced} campaigns`);
      return { synced };
    } catch (e: any) {
      const detail = e?.response?.data?.error?.message || e.message;
      return { synced: 0, error: detail };
    }
  }

  /**
   * Creates a complete Meta lead-gen ad, ALWAYS PAUSED, so nothing spends until
   * a human launches it (via setMetaStatus -> ACTIVE). Real-estate ads must use
   * the HOUSING special ad category, which Meta requires and which restricts
   * targeting to broad geo (no age/gender/detailed targeting).
   *
   * Sequence: Campaign -> Ad Set -> Ad Creative -> Ad. Stores the result as a
   * Campaign row (platform 'meta', metadata.externalId) so it shows in the
   * dashboard and can be launched/paused.
   */
  async createMetaCampaign(
    workspaceId: string,
    dto: {
      name: string;
      dailyBudget: number; // in account currency major units, e.g. 500 (INR)
      imageUrl: string; // publicly reachable image URL (Meta fetches it)
      caption: string;
      headline?: string;
      link?: string; // landing URL; defaults to the site
      radiusKm?: number; // geo radius around the project
      lat?: number;
      lng?: number;
    },
  ) {
    if (!this.metaToken || !this.adAccountId) {
      return { ok: false, message: 'Meta not connected (need META_AD_ACCOUNT_ID + token).' };
    }
    const pageId = this.configService.get<string>('META_PAGE_ID');
    if (!pageId) {
      return { ok: false, message: 'META_PAGE_ID is required to create ads.' };
    }
    // Accept either a full https URL or a relative /uploads/... path from the
    // social image generator; resolve the latter against the public API base so
    // Meta (which fetches the image server-side) can reach it.
    const imageUrl = this.resolvePublicImageUrl(dto.imageUrl);
    if (!imageUrl || !/^https:\/\//i.test(imageUrl)) {
      return {
        ok: false,
        message:
          'A public https image is required. Pass a full https URL, or generate a creative ' +
          '(its /uploads path is resolved against API_PUBLIC_URL). Note: Meta cannot fetch localhost.',
      };
    }

    const axios = (await import('axios')).default;
    const token = this.metaToken;
    const acct = this.adAccountId;
    const created: Record<string, string> = {};

    // Meta wants the budget in minor units (paise for INR).
    const dailyBudgetMinor = Math.round((dto.dailyBudget || 0) * 100);
    if (dailyBudgetMinor < 10000) {
      // Meta enforces a per-account minimum; INR minimum is typically well above
      // this. Guard against accidental sub-minimum spend.
      return { ok: false, message: 'dailyBudget too low. Use at least the account minimum (e.g. ₹100+).' };
    }

    const link = dto.link || this.configService.get<string>('APP_URL') || 'https://anandipark.in';
    const lat = dto.lat ?? 18.5789; // Wagholi/Bakori, Pune East (approx)
    const lng = dto.lng ?? 73.9857;
    const radiusKm = Math.min(80, Math.max(17, dto.radiusKm ?? 25)); // Meta housing: 15mi/~24km min in many regions

    try {
      // 1) Campaign — PAUSED, Housing special ad category, leads objective.
      const campRes = await axios.post(
        `${GRAPH}/${acct}/campaigns`,
        null,
        {
          params: {
            name: dto.name,
            objective: 'OUTCOME_LEADS',
            status: 'PAUSED',
            special_ad_categories: JSON.stringify(['HOUSING']),
            access_token: token,
          },
          timeout: 30000,
        },
      );
      created.campaignId = campRes.data.id;

      // 2) Ad Set — PAUSED, daily budget, broad geo (housing rules), page leads.
      const adSetRes = await axios.post(
        `${GRAPH}/${acct}/adsets`,
        null,
        {
          params: {
            name: `${dto.name} — Ad Set`,
            campaign_id: created.campaignId,
            status: 'PAUSED',
            daily_budget: dailyBudgetMinor,
            billing_event: 'IMPRESSIONS',
            optimization_goal: 'LEAD_GENERATION',
            bid_strategy: 'LOWEST_COST_WITHOUT_CAP',
            promoted_object: JSON.stringify({ page_id: pageId }),
            targeting: JSON.stringify({
              geo_locations: {
                custom_locations: [{ latitude: lat, longitude: lng, radius: radiusKm, distance_unit: 'kilometer' }],
              },
              // Housing category forbids age/gender/detailed targeting narrowing.
            }),
            access_token: token,
          },
          timeout: 30000,
        },
      );
      created.adSetId = adSetRes.data.id;

      // 3) Ad Creative — link-form creative pointing at the site with the image.
      const creativeRes = await axios.post(
        `${GRAPH}/${acct}/adcreatives`,
        null,
        {
          params: {
            name: `${dto.name} — Creative`,
            object_story_spec: JSON.stringify({
              page_id: pageId,
              link_data: {
                link,
                message: dto.caption,
                name: dto.headline || 'Anandi Park — Residential Plots',
                picture: imageUrl,
                call_to_action: { type: 'LEARN_MORE', value: { link } },
              },
            }),
            access_token: token,
          },
          timeout: 30000,
        },
      );
      created.creativeId = creativeRes.data.id;

      // 4) Ad — PAUSED, ties creative to ad set.
      const adRes = await axios.post(
        `${GRAPH}/${acct}/ads`,
        null,
        {
          params: {
            name: `${dto.name} — Ad`,
            adset_id: created.adSetId,
            creative: JSON.stringify({ creative_id: created.creativeId }),
            status: 'PAUSED',
            access_token: token,
          },
          timeout: 30000,
        },
      );
      created.adId = adRes.data.id;

      // Store as a Campaign row so it shows in the dashboard, PAUSED.
      const row = await this.prisma.campaign.create({
        data: {
          workspaceId,
          name: dto.name,
          type: 'lead_generation',
          platform: 'meta',
          status: 'PAUSED',
          budget: dto.dailyBudget,
          spent: 0,
          content: { caption: dto.caption, headline: dto.headline, imageUrl, link } as any,
          metrics: {} as any,
          metadata: {
            source: 'meta_api',
            externalId: created.campaignId,
            adSetId: created.adSetId,
            creativeId: created.creativeId,
            adId: created.adId,
            currency: 'INR',
            createdPaused: true,
          } as any,
        },
      });

      this.logger.log(`Created PAUSED Meta campaign ${created.campaignId} for "${dto.name}"`);
      return {
        ok: true,
        paused: true,
        message: 'Campaign created PAUSED. Review it, then Launch to start spending.',
        ids: created,
        campaign: row,
      };
    } catch (e: any) {
      const detail = e?.response?.data?.error?.message || e.message;
      this.logger.error(`Meta ad creation failed at ${Object.keys(created).length} steps: ${detail}`);
      return {
        ok: false,
        message: detail,
        partial: created, // so a half-created campaign can be cleaned up in Ads Manager
      };
    }
  }

  /** Pause or resume a Meta campaign via the Marketing API. */
  async setMetaStatus(campaignExternalId: string, status: 'ACTIVE' | 'PAUSED') {
    if (!this.metaToken) {
      return { ok: false, message: 'Meta token not set' };
    }
    const axios = (await import('axios')).default;
    try {
      await axios.post(
        `${GRAPH}/${campaignExternalId}`,
        { status },
        { params: { access_token: this.metaToken }, timeout: 20000 },
      );
      return { ok: true, status };
    } catch (e: any) {
      return { ok: false, message: e?.response?.data?.error?.message || e.message };
    }
  }

  connectionInfo() {
    return {
      meta: {
        tokenSet: Boolean(this.metaToken),
        adAccountSet: Boolean(this.adAccountId),
        ready: Boolean(this.metaToken && this.adAccountId),
      },
      hint:
        'For Meta ad spend sync + create/pause, set META_AD_ACCOUNT_ID (act_XXXX) and a token with ' +
        'ads_read + ads_management. Google Ads and other costs can be tracked manually.',
    };
  }

  /**
   * Read-only check of whether the configured token + ad account can actually
   * create ads. Spends nothing. Reports account status, funding, capabilities,
   * and the exact granted token permissions so we know if `ads_management` is
   * present BEFORE attempting any ad-creation calls.
   */
  async metaCapabilities() {
    if (!this.metaToken || !this.adAccountId) {
      return {
        ready: false,
        message: 'Meta not connected. Set META_AD_ACCOUNT_ID (act_...) and META_PAGE_ACCESS_TOKEN.',
      };
    }

    const axios = (await import('axios')).default;
    const result: Record<string, unknown> = {
      adAccountId: this.adAccountId,
      pageId: this.configService.get<string>('META_PAGE_ID') ?? null,
    };

    // 1. Ad account status + funding + what the account can do.
    try {
      const acc = await axios.get(`${GRAPH}/${this.adAccountId}`, {
        params: {
          fields:
            'name,account_status,disable_reason,currency,funding_source,' +
            'capabilities,business{id,name}',
          access_token: this.metaToken,
        },
        timeout: 20000,
      });
      const d = acc.data || {};
      // account_status: 1 = ACTIVE, 2 = DISABLED, 3 = UNSETTLED, 101 = closed, etc.
      result.account = {
        name: d.name,
        status: d.account_status,
        statusLabel: d.account_status === 1 ? 'ACTIVE' : `NON-ACTIVE (${d.account_status})`,
        disableReason: d.disable_reason ?? null,
        currency: d.currency,
        hasFundingSource: Boolean(d.funding_source),
        business: d.business ?? null,
        capabilities: d.capabilities ?? [],
      };
    } catch (e: any) {
      result.account = { error: e?.response?.data?.error?.message || e.message };
    }

    // 2. Exact token permissions — is ads_management granted?
    try {
      const perms = await axios.get(`${GRAPH}/me/permissions`, {
        params: { access_token: this.metaToken },
        timeout: 20000,
      });
      const granted = (perms.data?.data || [])
        .filter((p: any) => p.status === 'granted')
        .map((p: any) => p.permission);
      const needed = ['ads_management', 'ads_read', 'pages_manage_ads', 'leads_retrieval'];
      result.permissions = {
        granted,
        adsManagement: granted.includes('ads_management'),
        adsRead: granted.includes('ads_read'),
        missing: needed.filter((n) => !granted.includes(n)),
      };
    } catch (e: any) {
      // System-user tokens sometimes 404 on /me/permissions; note it, don't fail.
      result.permissions = {
        note: 'Could not read /me/permissions (common for system-user tokens).',
        error: e?.response?.data?.error?.message || e.message,
      };
    }

    const acc: any = result.account;
    const perms: any = result.permissions;
    const canCreate =
      acc?.status === 1 &&
      acc?.hasFundingSource === true &&
      (perms?.adsManagement === true || perms?.note); // note = unknown but not denied

    result.ready = canCreate;
    result.verdict = canCreate
      ? 'Account is active with funding; ad creation should work. Try a PAUSED test campaign.'
      : 'Ad creation likely blocked — check account status, funding source, and ads_management permission above.';

    return result;
  }
}
