import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { LeadsRepository } from './leads.repository';
import { CreateLeadDto } from './dto/create-lead.dto';
import { UpdateLeadDto } from './dto/update-lead.dto';
import { QueryLeadsDto } from './dto/query-leads.dto';
import { PrismaService } from '../../common/prisma/prisma.service';
import { RedisService } from '../../common/redis/redis.service';

@Injectable()
export class LeadsService {
  constructor(
    private leadsRepository: LeadsRepository,
    private prisma: PrismaService,
    private redisService: RedisService,
  ) {}

  async create(workspaceId: string, userId: string, dto: CreateLeadDto) {
    // Check for duplicates
    const duplicates = await this.leadsRepository.getDuplicates(
      workspaceId,
      dto.phone,
      dto.email,
    );

    if (duplicates.length > 0) {
      throw new ConflictException({
        message: 'Potential duplicate lead found',
        duplicates,
      });
    }

    const lead = await this.leadsRepository.create({
      workspace: { connect: { id: workspaceId } },
      createdBy: { connect: { id: userId } },
      ...(dto.assignedToId && { assignedTo: { connect: { id: dto.assignedToId } } }),
      name: dto.name,
      phone: dto.phone,
      email: dto.email,
      alternatePhone: dto.alternatePhone,
      source: dto.source as never,
      budget: dto.budget,
      preferredLocation: dto.preferredLocation,
      preferredPropertyType: dto.preferredPropertyType as never,
      timeline: dto.timeline,
      loanRequired: dto.loanRequired,
      tags: dto.tags || [],
      customFields: (dto.customFields as any) || {},
    });

    // Log activity
    await this.prisma.activity.create({
      data: {
        userId,
        leadId: lead.id,
        type: 'LEAD_CREATED',
        title: `Lead "${lead.name}" created`,
      },
    });

    // Invalidate cache
    await this.redisService.flushByPattern(`leads:${workspaceId}:*`);

    return lead;
  }

  async findAll(workspaceId: string, query: QueryLeadsDto) {
    const cacheKey = `leads:${workspaceId}:${JSON.stringify(query)}`;
    const cached = await this.redisService.getJson(cacheKey);
    if (cached) return cached;

    const result = await this.leadsRepository.findAll({
      workspaceId,
      page: query.page || 1,
      limit: query.limit || 20,
      sortBy: query.sortBy,
      sortOrder: query.sortOrder,
      search: query.search,
      status: query.status,
      source: query.source,
      assignedToId: query.assignedToId,
      tags: query.tags,
      dateFrom: query.dateFrom,
      dateTo: query.dateTo,
    });

    await this.redisService.setJson(cacheKey, result, 60); // 60 second cache
    return result;
  }

  async findById(id: string, workspaceId: string) {
    const lead = await this.leadsRepository.findById(id, workspaceId);
    if (!lead) {
      throw new NotFoundException('Lead not found');
    }
    return lead;
  }

  async update(id: string, workspaceId: string, userId: string, dto: UpdateLeadDto) {
    const existing = await this.leadsRepository.findById(id, workspaceId);
    if (!existing) {
      throw new NotFoundException('Lead not found');
    }

    const updateData: Record<string, unknown> = { ...dto };
    delete updateData.assignedToId;

    if (dto.assignedToId) {
      updateData.assignedTo = { connect: { id: dto.assignedToId } };
    }

    const lead = await this.leadsRepository.update(id, workspaceId, updateData);

    // Log status change
    if (dto.status && dto.status !== existing.status) {
      await this.prisma.activity.create({
        data: {
          userId,
          leadId: id,
          type: 'STATUS_CHANGED',
          title: `Status changed from ${existing.status} to ${dto.status}`,
          metadata: { oldStatus: existing.status, newStatus: dto.status },
        },
      });
    }

    // Log assignment change
    if (dto.assignedToId && dto.assignedToId !== existing.assignedToId) {
      await this.prisma.activity.create({
        data: {
          userId,
          leadId: id,
          type: 'LEAD_ASSIGNED',
          title: `Lead assigned to new agent`,
          metadata: { assignedToId: dto.assignedToId },
        },
      });
    }

    await this.redisService.flushByPattern(`leads:${workspaceId}:*`);
    return lead;
  }

  async delete(id: string, workspaceId: string) {
    const existing = await this.leadsRepository.findById(id, workspaceId);
    if (!existing) {
      throw new NotFoundException('Lead not found');
    }
    await this.leadsRepository.delete(id, workspaceId);
    await this.redisService.flushByPattern(`leads:${workspaceId}:*`);
    return { message: 'Lead deleted successfully' };
  }

  async bulkAssign(workspaceId: string, ids: string[], assignedToId: string) {
    await this.leadsRepository.bulkAssign(ids, workspaceId, assignedToId);
    await this.redisService.flushByPattern(`leads:${workspaceId}:*`);
    return { message: `${ids.length} leads assigned successfully` };
  }

  async bulkUpdateStatus(workspaceId: string, ids: string[], status: string) {
    await this.leadsRepository.bulkUpdateStatus(ids, workspaceId, status);
    await this.redisService.flushByPattern(`leads:${workspaceId}:*`);
    return { message: `${ids.length} leads updated to ${status}` };
  }

  async getStats(workspaceId: string) {
    return this.leadsRepository.getStats(workspaceId);
  }

  async importLeads(workspaceId: string, userId: string, leads: CreateLeadDto[]) {
    const results = { created: 0, duplicates: 0, errors: 0 };

    for (const leadData of leads) {
      try {
        const duplicates = await this.leadsRepository.getDuplicates(
          workspaceId,
          leadData.phone,
          leadData.email,
        );

        if (duplicates.length > 0) {
          results.duplicates++;
          continue;
        }

        await this.leadsRepository.create({
          workspace: { connect: { id: workspaceId } },
          createdBy: { connect: { id: userId } },
          name: leadData.name,
          phone: leadData.phone,
          email: leadData.email,
          source: (leadData.source as never) || ('OTHER' as never),
          budget: leadData.budget,
          tags: leadData.tags || [],
        });

        results.created++;
      } catch {
        results.errors++;
      }
    }

    await this.redisService.flushByPattern(`leads:${workspaceId}:*`);
    return results;
  }
}
