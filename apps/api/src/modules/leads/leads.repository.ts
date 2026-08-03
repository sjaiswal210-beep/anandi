import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class LeadsRepository {
  constructor(private prisma: PrismaService) {}

  async create(data: Prisma.LeadCreateInput) {
    return this.prisma.lead.create({
      data,
      include: {
        assignedTo: { select: { id: true, name: true, email: true, avatar: true } },
        createdBy: { select: { id: true, name: true, email: true } },
      },
    });
  }

  async findById(id: string, workspaceId: string) {
    return this.prisma.lead.findFirst({
      where: { id, workspaceId },
      include: {
        assignedTo: { select: { id: true, name: true, email: true, avatar: true, phone: true } },
        createdBy: { select: { id: true, name: true, email: true } },
        activities: { orderBy: { createdAt: 'desc' }, take: 10 },
        notes: { orderBy: { createdAt: 'desc' }, include: { user: { select: { name: true } } } },
        tasks: { orderBy: { dueDate: 'asc' }, where: { status: { not: 'COMPLETED' } } },
        visits: { orderBy: { scheduledAt: 'desc' }, take: 5 },
        documents: { orderBy: { createdAt: 'desc' } },
      },
    });
  }

  async findAll(params: {
    workspaceId: string;
    page: number;
    limit: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
    search?: string;
    status?: string;
    source?: string;
    assignedToId?: string;
    tags?: string[];
    dateFrom?: string;
    dateTo?: string;
  }) {
    const {
      workspaceId,
      page,
      limit,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      search,
      status,
      source,
      assignedToId,
      tags,
      dateFrom,
      dateTo,
    } = params;

    const where: Prisma.LeadWhereInput = {
      workspaceId,
      ...(status && { status: status as Prisma.EnumLeadStatusFilter }),
      ...(source && { source: source as Prisma.EnumLeadSourceFilter }),
      ...(assignedToId && { assignedToId }),
      ...(tags && tags.length > 0 && { tags: { hasSome: tags } }),
      ...(dateFrom && { createdAt: { gte: new Date(dateFrom) } }),
      ...(dateTo && { createdAt: { lte: new Date(dateTo) } }),
      ...(search && {
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { email: { contains: search, mode: 'insensitive' } },
          { phone: { contains: search } },
        ],
      }),
    };

    const [data, total] = await Promise.all([
      this.prisma.lead.findMany({
        where,
        include: {
          assignedTo: { select: { id: true, name: true, avatar: true } },
        },
        orderBy: { [sortBy]: sortOrder },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.lead.count({ where }),
    ]);

    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        hasNext: page * limit < total,
        hasPrev: page > 1,
      },
    };
  }

  async update(id: string, workspaceId: string, data: Prisma.LeadUpdateInput) {
    return this.prisma.lead.update({
      where: { id },
      data,
      include: {
        assignedTo: { select: { id: true, name: true, email: true, avatar: true } },
      },
    });
  }

  async delete(id: string, workspaceId: string) {
    return this.prisma.lead.delete({ where: { id } });
  }

  async bulkAssign(ids: string[], workspaceId: string, assignedToId: string) {
    return this.prisma.lead.updateMany({
      where: { id: { in: ids }, workspaceId },
      data: { assignedToId },
    });
  }

  async bulkUpdateStatus(ids: string[], workspaceId: string, status: string) {
    return this.prisma.lead.updateMany({
      where: { id: { in: ids }, workspaceId },
      data: { status: status as never },
    });
  }

  async getDuplicates(workspaceId: string, phone: string, email?: string) {
    return this.prisma.lead.findMany({
      where: {
        workspaceId,
        OR: [
          { phone },
          ...(email ? [{ email }] : []),
        ],
      },
      select: { id: true, name: true, phone: true, email: true, status: true },
    });
  }

  async getStats(workspaceId: string) {
    const [total, byStatus, bySource, recentLeads] = await Promise.all([
      this.prisma.lead.count({ where: { workspaceId } }),
      this.prisma.lead.groupBy({
        by: ['status'],
        where: { workspaceId },
        _count: true,
      }),
      this.prisma.lead.groupBy({
        by: ['source'],
        where: { workspaceId },
        _count: true,
      }),
      this.prisma.lead.count({
        where: {
          workspaceId,
          createdAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
        },
      }),
    ]);

    return { total, byStatus, bySource, recentLeads };
  }
}
