import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { RedisService } from '../../common/redis/redis.service';

@Injectable()
export class VisitsService {
  constructor(
    private prisma: PrismaService,
    private redisService: RedisService,
  ) {}

  async create(workspaceId: string, dto: {
    leadId: string;
    propertyId?: string;
    agentId: string;
    scheduledAt: string;
    driverName?: string;
    driverPhone?: string;
    pickupAddress?: string;
    notes?: string;
  }) {
    const lead = await this.prisma.lead.findFirst({
      where: { id: dto.leadId, workspaceId },
    });
    if (!lead) throw new NotFoundException('Lead not found');

    const visit = await this.prisma.siteVisit.create({
      data: {
        workspace: { connect: { id: workspaceId } },
        lead: { connect: { id: dto.leadId } },
        agent: { connect: { id: dto.agentId } },
        ...(dto.propertyId && { property: { connect: { id: dto.propertyId } } }),
        scheduledAt: new Date(dto.scheduledAt),
        status: 'SCHEDULED',
        driverName: dto.driverName,
        driverPhone: dto.driverPhone,
        pickupAddress: dto.pickupAddress,
        notes: dto.notes,
      },
      include: {
        lead: { select: { name: true, phone: true } },
        agent: { select: { name: true, phone: true } },
        property: { select: { title: true, address: true } },
      },
    });

    // Create activity
    await this.prisma.activity.create({
      data: {
        userId: dto.agentId,
        leadId: dto.leadId,
        type: 'VISIT_SCHEDULED',
        title: `Site visit scheduled for ${lead.name}`,
      },
    });

    await this.redisService.flushByPattern(`visits:${workspaceId}:*`);
    return visit;
  }

  async findAll(workspaceId: string, params: {
    page?: number;
    limit?: number;
    status?: string;
    agentId?: string;
    date?: string;
  }) {
    const { page = 1, limit = 20, status, agentId, date } = params;

    const where: Record<string, unknown> = { workspaceId };
    if (status) where.status = status;
    if (agentId) where.agentId = agentId;
    if (date) {
      const start = new Date(date);
      const end = new Date(date);
      end.setDate(end.getDate() + 1);
      where.scheduledAt = { gte: start, lt: end };
    }

    const [data, total] = await Promise.all([
      this.prisma.siteVisit.findMany({
        where,
        include: {
          lead: { select: { id: true, name: true, phone: true } },
          agent: { select: { id: true, name: true, phone: true, avatar: true } },
          property: { select: { id: true, title: true, address: true, city: true } },
        },
        orderBy: { scheduledAt: 'asc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.siteVisit.count({ where }),
    ]);

    return { data, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } };
  }

  async findById(id: string, workspaceId: string) {
    const visit = await this.prisma.siteVisit.findFirst({
      where: { id, workspaceId },
      include: {
        lead: { select: { id: true, name: true, phone: true, email: true, budget: true } },
        agent: { select: { id: true, name: true, phone: true, avatar: true } },
        property: {
          select: { id: true, title: true, address: true, city: true, price: true, type: true },
        },
      },
    });
    if (!visit) throw new NotFoundException('Visit not found');
    return visit;
  }

  async updateStatus(id: string, workspaceId: string, status: string) {
    const visit = await this.prisma.siteVisit.findFirst({ where: { id, workspaceId } });
    if (!visit) throw new NotFoundException('Visit not found');

    const updateData: Record<string, unknown> = { status };
    if (status === 'COMPLETED') {
      updateData.completedAt = new Date();
    }

    const updated = await this.prisma.siteVisit.update({
      where: { id },
      data: updateData,
    });

    await this.redisService.flushByPattern(`visits:${workspaceId}:*`);
    return updated;
  }

  async addFeedback(id: string, workspaceId: string, dto: {
    feedback: string;
    rating?: number;
    photos?: string[];
  }) {
    const visit = await this.prisma.siteVisit.findFirst({ where: { id, workspaceId } });
    if (!visit) throw new NotFoundException('Visit not found');

    return this.prisma.siteVisit.update({
      where: { id },
      data: {
        feedback: dto.feedback,
        rating: dto.rating,
        photos: dto.photos || [],
        status: 'COMPLETED',
        completedAt: new Date(),
      },
    });
  }

  async reschedule(id: string, workspaceId: string, newDate: string) {
    const visit = await this.prisma.siteVisit.findFirst({ where: { id, workspaceId } });
    if (!visit) throw new NotFoundException('Visit not found');
    if (visit.status === 'COMPLETED') {
      throw new BadRequestException('Cannot reschedule completed visit');
    }

    return this.prisma.siteVisit.update({
      where: { id },
      data: { scheduledAt: new Date(newDate) },
    });
  }

  async getTodaySchedule(workspaceId: string, agentId?: string) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const where: Record<string, unknown> = {
      workspaceId,
      scheduledAt: { gte: today, lt: tomorrow },
    };
    if (agentId) where.agentId = agentId;

    return this.prisma.siteVisit.findMany({
      where,
      include: {
        lead: { select: { name: true, phone: true } },
        property: { select: { title: true, address: true } },
        agent: { select: { name: true } },
      },
      orderBy: { scheduledAt: 'asc' },
    });
  }

  async getCalendarView(workspaceId: string, month: number, year: number) {
    const start = new Date(year, month - 1, 1);
    const end = new Date(year, month, 0);

    return this.prisma.siteVisit.findMany({
      where: {
        workspaceId,
        scheduledAt: { gte: start, lte: end },
      },
      include: {
        lead: { select: { name: true } },
        agent: { select: { name: true } },
      },
      orderBy: { scheduledAt: 'asc' },
    });
  }
}
