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
}
