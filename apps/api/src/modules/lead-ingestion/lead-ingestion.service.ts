import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';

@Injectable()
export class LeadIngestionService {
  private readonly logger = new Logger(LeadIngestionService.name);

  constructor(private prisma: PrismaService) {}

  async ingest(workspaceId: string, data: {
    name: string;
    phone: string;
    email?: string;
    source: string;
    message?: string;
    metadata?: Record<string, unknown>;
  }) {
    // Deduplicate by phone
    const existing = await this.prisma.lead.findFirst({
      where: { workspaceId, phone: data.phone },
    });

    if (existing) {
      this.logger.log(`Duplicate lead detected: ${data.phone} - updating activity`);
      await this.prisma.activity.create({
        data: {
          userId: existing.createdById,
          leadId: existing.id,
          type: 'DUPLICATE_INQUIRY',
          title: `Repeat inquiry from ${data.source}`,
          description: data.message,
        },
      });
      return { status: 'duplicate', leadId: existing.id, existing: true };
    }

    // Find admin to assign
    const admin = await this.prisma.user.findFirst({
      where: { workspaces: { some: { workspaceId } }, role: { in: ['SUPER_ADMIN', 'BUILDER', 'SALES_MANAGER'] } },
    });

    const lead = await this.prisma.lead.create({
      data: {
        workspaceId,
        createdById: admin?.id || '',
        name: data.name,
        phone: data.phone,
        email: data.email,
        source: data.source as any,
        status: 'NEW',
        customFields: { originalMessage: data.message, ...(data.metadata || {}) },
      },
    });

    this.logger.log(`New lead ingested: ${lead.name} from ${data.source}`);
    return { status: 'created', leadId: lead.id, existing: false };
  }

  async getSourceBreakdown(workspaceId: string) {
    return this.prisma.lead.groupBy({
      by: ['source'],
      where: { workspaceId },
      _count: true,
      orderBy: { _count: { source: 'desc' } },
    });
  }
}
