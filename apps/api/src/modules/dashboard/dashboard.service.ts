import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { RedisService } from '../../common/redis/redis.service';

@Injectable()
export class DashboardService {
  constructor(
    private prisma: PrismaService,
    private redisService: RedisService,
  ) {}

  async getMetrics(workspaceId: string) {
    const cacheKey = `dashboard:${workspaceId}:metrics`;
    const cached = await this.redisService.getJson(cacheKey);
    if (cached) return cached;

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const [
      totalLeads,
      newLeads,
      convertedLeads,
      totalProperties,
      availableProperties,
      soldProperties,
      reservedProperties,
      totalBookings,
      monthlyBookings,
      todayVisits,
      scheduledVisits,
      completedVisits,
    ] = await Promise.all([
      this.prisma.lead.count({ where: { workspaceId } }),
      this.prisma.lead.count({
        where: { workspaceId, createdAt: { gte: startOfMonth } },
      }),
      this.prisma.lead.count({
        where: { workspaceId, status: 'WON' },
      }),
      this.prisma.property.count({ where: { workspaceId } }),
      this.prisma.property.count({ where: { workspaceId, status: 'AVAILABLE' } }),
      this.prisma.property.count({ where: { workspaceId, status: 'SOLD' } }),
      this.prisma.property.count({ where: { workspaceId, status: 'RESERVED' } }),
      this.prisma.booking.count({ where: { workspaceId } }),
      this.prisma.booking.count({
        where: { workspaceId, createdAt: { gte: startOfMonth } },
      }),
      this.prisma.siteVisit.count({
        where: { workspaceId, scheduledAt: { gte: startOfDay } },
      }),
      this.prisma.siteVisit.count({
        where: { workspaceId, status: 'SCHEDULED' },
      }),
      this.prisma.siteVisit.count({
        where: { workspaceId, status: 'COMPLETED', completedAt: { gte: startOfMonth } },
      }),
    ]);

    // Revenue calculation
    const revenueData = await this.prisma.payment.aggregate({
      where: {
        booking: { workspaceId },
        status: 'COMPLETED',
      },
      _sum: { amount: true },
    });

    const monthlyRevenue = await this.prisma.payment.aggregate({
      where: {
        booking: { workspaceId },
        status: 'COMPLETED',
        paidAt: { gte: startOfMonth },
      },
      _sum: { amount: true },
    });

    const conversionRate = totalLeads > 0 ? ((convertedLeads / totalLeads) * 100) : 0;

    const metrics = {
      revenue: {
        total: Number(revenueData._sum.amount || 0),
        monthly: Number(monthlyRevenue._sum.amount || 0),
        growth: 12.5, // Calculate from previous month comparison
      },
      leads: {
        total: totalLeads,
        new: newLeads,
        converted: convertedLeads,
        conversionRate: Math.round(conversionRate * 100) / 100,
      },
      bookings: {
        total: totalBookings,
        thisMonth: monthlyBookings,
        pendingPayments: 0,
      },
      properties: {
        total: totalProperties,
        available: availableProperties,
        sold: soldProperties,
        reserved: reservedProperties,
      },
      visits: {
        today: todayVisits,
        scheduled: scheduledVisits,
        completed: completedVisits,
      },
    };

    await this.redisService.setJson(cacheKey, metrics, 300); // 5 min cache
    return metrics;
  }

  async getRevenueChart(workspaceId: string, period: string = '30d') {
    const days = period === '7d' ? 7 : period === '90d' ? 90 : 30;
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const payments = await this.prisma.payment.findMany({
      where: {
        booking: { workspaceId },
        status: 'COMPLETED',
        paidAt: { gte: startDate },
      },
      select: {
        amount: true,
        paidAt: true,
      },
      orderBy: { paidAt: 'asc' },
    });

    // Group by date
    const chartData: Record<string, number> = {};
    payments.forEach((payment) => {
      if (payment.paidAt) {
        const dateKey = payment.paidAt.toISOString().split('T')[0];
        chartData[dateKey] = (chartData[dateKey] || 0) + Number(payment.amount);
      }
    });

    return Object.entries(chartData).map(([date, amount]) => ({
      date,
      amount,
    }));
  }

  async getLeadPipeline(workspaceId: string) {
    const pipeline = await this.prisma.lead.groupBy({
      by: ['status'],
      where: { workspaceId },
      _count: true,
    });

    const order = ['NEW', 'CONTACTED', 'QUALIFIED', 'NEGOTIATION', 'WON', 'LOST'];
    return order.map((status) => ({
      status,
      count: pipeline.find((p) => p.status === status)?._count || 0,
    }));
  }

  async getTopAgents(workspaceId: string) {
    const agents = await this.prisma.lead.groupBy({
      by: ['assignedToId'],
      where: {
        workspaceId,
        assignedToId: { not: null },
        status: 'WON',
      },
      _count: true,
      orderBy: { _count: { assignedToId: 'desc' } },
      take: 5,
    });

    const agentDetails = await Promise.all(
      agents.map(async (a) => {
        const user = await this.prisma.user.findUnique({
          where: { id: a.assignedToId! },
          select: { name: true, avatar: true },
        });
        return {
          name: user?.name || 'Unknown',
          avatar: user?.avatar,
          conversions: a._count,
        };
      }),
    );

    return agentDetails;
  }
}
