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
}
