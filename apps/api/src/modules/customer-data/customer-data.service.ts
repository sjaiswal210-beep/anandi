import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';

@Injectable()
export class CustomerDataService {
  constructor(private prisma: PrismaService) {}

  async importCustomers(workspaceId: string, records: { name: string; phone: string; email?: string; tags?: string[] }[]) {
    const results = { imported: 0, duplicates: 0 };
    for (const rec of records) {
      const existing = await this.prisma.customerImport.findFirst({ where: { workspaceId, phone: rec.phone } });
      if (existing) { results.duplicates++; continue; }
      await this.prisma.customerImport.create({
        data: { workspaceId, name: rec.name, phone: rec.phone, email: rec.email, tags: rec.tags || [], source: 'csv_import' },
      });
      results.imported++;
    }
    return results;
  }

  async getAll(workspaceId: string, params: { page?: number; limit?: number; responded?: boolean }) {
    const { page = 1, limit = 50, responded } = params;
    const where: Record<string, unknown> = { workspaceId };
    if (responded !== undefined) where.responded = responded;
    const [data, total] = await Promise.all([
      this.prisma.customerImport.findMany({ where, orderBy: { createdAt: 'desc' }, skip: (page - 1) * limit, take: limit }),
      this.prisma.customerImport.count({ where }),
    ]);
    return { data, meta: { total, page, limit } };
  }

  async createBroadcast(workspaceId: string, dto: { name: string; channel: string; template: string; targetTags?: string[] }) {
    const targets = await this.prisma.customerImport.count({
      where: { workspaceId, broadcastSent: false, ...(dto.targetTags?.length ? { tags: { hasSome: dto.targetTags } } : {}) },
    });
    return this.prisma.broadcastCampaign.create({
      data: { workspaceId, name: dto.name, channel: dto.channel, template: dto.template, targetCount: targets, status: 'draft' },
    });
  }

  async executeBroadcast(campaignId: string) {
    const campaign = await this.prisma.broadcastCampaign.findUnique({ where: { id: campaignId } });
    if (!campaign) return null;
    // Stub: in production, this sends via WhatsApp/Email/SMS
    await this.prisma.broadcastCampaign.update({
      where: { id: campaignId },
      data: { status: 'completed', sentCount: campaign.targetCount, deliveredCount: Math.floor(campaign.targetCount * 0.95), completedAt: new Date() },
    });
    await this.prisma.customerImport.updateMany({
      where: { workspaceId: campaign.workspaceId, broadcastSent: false },
      data: { broadcastSent: true, broadcastChannel: campaign.channel },
    });
    return { status: 'completed', sent: campaign.targetCount };
  }

  async getBroadcasts(workspaceId: string) {
    return this.prisma.broadcastCampaign.findMany({ where: { workspaceId }, orderBy: { createdAt: 'desc' } });
  }

  // ---------------------------------------------------------------------------
  // Throttled "drip" WhatsApp campaign controls
  //
  // A drip campaign sends message + photo + document to imported leads slowly
  // over days/weeks to avoid getting the WhatsApp number banned. The actual
  // sending is done by BroadcastDripService's hourly cron; these methods just
  // configure the campaign and flip its status. Config lives in metadata so the
  // cron can read it without extra tables.
  // ---------------------------------------------------------------------------

  /**
   * Creates (or reuses) a WhatsApp drip campaign and sets it live ('sending').
   * The cron picks it up on the next tick. message supports {{name}}/{{phone}}.
   */
  async startDripCampaign(
    workspaceId: string,
    dto: {
      name: string;
      message: string;
      imageUrl?: string;
      documentUrl?: string;
      dailyCap?: number;
      batchSize?: number;
      minDelaySec?: number;
      maxDelaySec?: number;
      startHour?: number;
      endHour?: number;
      targetTags?: string[];
    },
  ) {
    const pending = await this.prisma.customerImport.count({
      where: {
        workspaceId,
        broadcastSent: false,
        ...(dto.targetTags?.length ? { tags: { hasSome: dto.targetTags } } : {}),
      },
    });

    const metadata: Record<string, unknown> = {
      imageUrl: dto.imageUrl || null,
      documentUrl: dto.documentUrl || null,
      dailyCap: dto.dailyCap ?? 60,
      batchSize: dto.batchSize ?? 8,
      minDelayMs: (dto.minDelaySec ?? 25) * 1000,
      maxDelayMs: (dto.maxDelaySec ?? 75) * 1000,
      startHour: dto.startHour ?? 10,
      endHour: dto.endHour ?? 19,
      targetTags: dto.targetTags ?? [],
      sentDay: null,
      sentToday: 0,
    };

    return this.prisma.broadcastCampaign.create({
      data: {
        workspaceId,
        name: dto.name,
        channel: 'whatsapp',
        template: dto.message,
        targetCount: pending,
        status: 'sending',
        metadata: metadata as object,
      },
    });
  }

  /** Pauses a live drip campaign. The cron skips 'paused' campaigns. */
  async pauseDripCampaign(campaignId: string) {
    return this.prisma.broadcastCampaign.update({
      where: { id: campaignId },
      data: { status: 'paused' },
    });
  }

  /** Resumes a paused drip campaign (back to 'sending'). */
  async resumeDripCampaign(campaignId: string) {
    return this.prisma.broadcastCampaign.update({
      where: { id: campaignId },
      data: { status: 'sending' },
    });
  }

  /**
   * Returns live progress for a drip campaign: how many are sent, how many are
   * still pending in the whole workspace, today's counter, and a rough ETA in
   * days at the configured daily cap.
   */
  async getDripStatus(workspaceId: string, campaignId: string) {
    const campaign = await this.prisma.broadcastCampaign.findUnique({ where: { id: campaignId } });
    if (!campaign) return null;

    const meta = (campaign.metadata || {}) as Record<string, any>;
    const pending = await this.prisma.customerImport.count({
      where: { workspaceId, broadcastSent: false },
    });
    const totalSent = await this.prisma.customerImport.count({
      where: { workspaceId, broadcastSent: true },
    });
    const dailyCap = Number(meta.dailyCap) || 60;
    const etaDays = pending > 0 ? Math.ceil(pending / dailyCap) : 0;

    return {
      id: campaign.id,
      name: campaign.name,
      status: campaign.status,
      sentCount: campaign.sentCount,
      targetCount: campaign.targetCount,
      pendingInWorkspace: pending,
      totalSentInWorkspace: totalSent,
      sentToday: meta.sentDay ? Number(meta.sentToday) || 0 : 0,
      dailyCap,
      estimatedDaysRemaining: etaDays,
      businessHours: { startHour: meta.startHour ?? 10, endHour: meta.endHour ?? 19 },
      lastTickAt: meta.lastTickAt || null,
      lastError: meta.lastError || null,
      media: { imageUrl: meta.imageUrl || null, documentUrl: meta.documentUrl || null },
    };
  }
}
