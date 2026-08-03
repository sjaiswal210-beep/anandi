import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';

@Injectable()
export class ReportsService {
  constructor(private prisma: PrismaService) {}

  async getSalesReport(workspaceId: string, period: string) {
    const startDate = this.getStartDate(period);

    const [bookings, revenue, byAgent, conversionRate] = await Promise.all([
      this.prisma.booking.count({
        where: { workspaceId, createdAt: { gte: startDate } },
      }),
      this.prisma.payment.aggregate({
        where: { booking: { workspaceId }, status: 'COMPLETED', paidAt: { gte: startDate } },
        _sum: { amount: true },
      }),
      this.prisma.booking.groupBy({
        by: ['customerId'],
        where: { workspaceId, createdAt: { gte: startDate } },
        _count: true,
      }),
      this.prisma.lead.count({
        where: { workspaceId, status: 'WON', convertedAt: { gte: startDate } },
      }),
    ]);

    const totalLeads = await this.prisma.lead.count({
      where: { workspaceId, createdAt: { gte: startDate } },
    });

    return {
      period,
      totalBookings: bookings,
      totalRevenue: Number(revenue._sum.amount || 0),
      uniqueCustomers: byAgent.length,
      conversions: conversionRate,
      conversionRate: totalLeads > 0 ? ((conversionRate / totalLeads) * 100).toFixed(2) : '0',
      totalLeads,
    };
  }

  async getLeadsReport(workspaceId: string, period: string, groupBy: string = 'status') {
    const startDate = this.getStartDate(period);

    const [total, grouped, topSources, avgScore] = await Promise.all([
      this.prisma.lead.count({
        where: { workspaceId, createdAt: { gte: startDate } },
      }),
      this.prisma.lead.groupBy({
        by: [groupBy as 'status' | 'source'],
        where: { workspaceId, createdAt: { gte: startDate } },
        _count: true,
      }),
      this.prisma.lead.groupBy({
        by: ['source'],
        where: { workspaceId, createdAt: { gte: startDate } },
        _count: true,
        orderBy: { _count: { source: 'desc' } },
        take: 5,
      }),
      this.prisma.lead.aggregate({
        where: { workspaceId, createdAt: { gte: startDate } },
        _avg: { score: true },
      }),
    ]);

    return { period, total, grouped, topSources, avgScore: avgScore._avg.score || 0 };
  }

  async getPropertyReport(workspaceId: string) {
    const [total, byType, byStatus, avgPrice] = await Promise.all([
      this.prisma.property.count({ where: { workspaceId } }),
      this.prisma.property.groupBy({
        by: ['type'],
        where: { workspaceId },
        _count: true,
      }),
      this.prisma.property.groupBy({
        by: ['status'],
        where: { workspaceId },
        _count: true,
      }),
      this.prisma.property.aggregate({
        where: { workspaceId },
        _avg: { price: true },
      }),
    ]);

    return { total, byType, byStatus, avgPrice: Number(avgPrice._avg.price || 0) };
  }

  async getAgentPerformance(workspaceId: string, period: string) {
    const startDate = this.getStartDate(period);

    const agents = await this.prisma.workspaceMember.findMany({
      where: {
        workspaceId,
        role: { in: ['SALES_MANAGER', 'SALES_EXECUTIVE'] },
      },
      include: { user: { select: { id: true, name: true, avatar: true } } },
    });

    const performance = await Promise.all(
      agents.map(async (agent) => {
        const [leadsAssigned, leadsConverted, visitsCompleted, revenue] = await Promise.all([
          this.prisma.lead.count({
            where: { workspaceId, assignedToId: agent.userId, createdAt: { gte: startDate } },
          }),
          this.prisma.lead.count({
            where: { workspaceId, assignedToId: agent.userId, status: 'WON', convertedAt: { gte: startDate } },
          }),
          this.prisma.siteVisit.count({
            where: { workspaceId, agentId: agent.userId, status: 'COMPLETED', completedAt: { gte: startDate } },
          }),
          this.prisma.commission.aggregate({
            where: { userId: agent.userId, createdAt: { gte: startDate } },
            _sum: { amount: true },
          }),
        ]);

        return {
          agent: agent.user,
          leadsAssigned,
          leadsConverted,
          conversionRate: leadsAssigned > 0 ? ((leadsConverted / leadsAssigned) * 100).toFixed(1) : '0',
          visitsCompleted,
          commission: Number(revenue._sum.amount || 0),
        };
      }),
    );

    return performance.sort((a, b) => b.leadsConverted - a.leadsConverted);
  }

  async getMarketingReport(workspaceId: string, period: string) {
    const startDate = this.getStartDate(period);

    const [campaigns, leadsBySource, totalSpent] = await Promise.all([
      this.prisma.campaign.findMany({
        where: { workspaceId, createdAt: { gte: startDate } },
        select: { name: true, platform: true, status: true, budget: true, spent: true, metrics: true },
      }),
      this.prisma.lead.groupBy({
        by: ['source'],
        where: { workspaceId, createdAt: { gte: startDate } },
        _count: true,
      }),
      this.prisma.campaign.aggregate({
        where: { workspaceId, createdAt: { gte: startDate } },
        _sum: { spent: true },
      }),
    ]);

    return { period, campaigns, leadsBySource, totalSpent: Number(totalSpent._sum.spent || 0) };
  }

  private getStartDate(period: string): Date {
    const now = new Date();
    switch (period) {
      case 'daily': return new Date(now.setDate(now.getDate() - 1));
      case 'weekly': return new Date(now.setDate(now.getDate() - 7));
      case 'monthly': return new Date(now.setMonth(now.getMonth() - 1));
      case 'quarterly': return new Date(now.setMonth(now.getMonth() - 3));
      case 'yearly': return new Date(now.setFullYear(now.getFullYear() - 1));
      default: return new Date(now.setMonth(now.getMonth() - 1));
    }
  }
}
