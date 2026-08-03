import { Job } from 'bullmq';
import { PrismaClient } from '@prisma/client';

export async function processReportJob(job: Job, prisma: PrismaClient) {
  const { workspaceId, type, period, format } = job.data;

  const startDate = getStartDate(period);
  const endDate = new Date();

  let reportData: unknown;

  switch (type) {
    case 'sales':
      reportData = await generateSalesReport(prisma, workspaceId, startDate, endDate);
      break;
    case 'leads':
      reportData = await generateLeadsReport(prisma, workspaceId, startDate, endDate);
      break;
    case 'finance':
      reportData = await generateFinanceReport(prisma, workspaceId, startDate, endDate);
      break;
    case 'marketing':
      reportData = await generateMarketingReport(prisma, workspaceId, startDate, endDate);
      break;
    default:
      reportData = {};
  }

  return { type, period, format, data: reportData };
}

function getStartDate(period: string): Date {
  const now = new Date();
  switch (period) {
    case 'daily':
      return new Date(now.setDate(now.getDate() - 1));
    case 'weekly':
      return new Date(now.setDate(now.getDate() - 7));
    case 'monthly':
      return new Date(now.setMonth(now.getMonth() - 1));
    case 'yearly':
      return new Date(now.setFullYear(now.getFullYear() - 1));
    default:
      return new Date(now.setMonth(now.getMonth() - 1));
  }
}

async function generateSalesReport(prisma: PrismaClient, workspaceId: string, startDate: Date, endDate: Date) {
  const [bookings, revenue, topAgents] = await Promise.all([
    prisma.booking.count({
      where: { workspaceId, createdAt: { gte: startDate, lte: endDate } },
    }),
    prisma.payment.aggregate({
      where: {
        booking: { workspaceId },
        status: 'COMPLETED',
        paidAt: { gte: startDate, lte: endDate },
      },
      _sum: { amount: true },
    }),
    prisma.lead.groupBy({
      by: ['assignedToId'],
      where: { workspaceId, status: 'WON', convertedAt: { gte: startDate, lte: endDate } },
      _count: true,
      orderBy: { _count: { assignedToId: 'desc' } },
      take: 10,
    }),
  ]);

  return {
    totalBookings: bookings,
    totalRevenue: Number(revenue._sum.amount || 0),
    topAgents,
  };
}

async function generateLeadsReport(prisma: PrismaClient, workspaceId: string, startDate: Date, endDate: Date) {
  const [total, byStatus, bySource, conversions] = await Promise.all([
    prisma.lead.count({ where: { workspaceId, createdAt: { gte: startDate, lte: endDate } } }),
    prisma.lead.groupBy({ by: ['status'], where: { workspaceId, createdAt: { gte: startDate, lte: endDate } }, _count: true }),
    prisma.lead.groupBy({ by: ['source'], where: { workspaceId, createdAt: { gte: startDate, lte: endDate } }, _count: true }),
    prisma.lead.count({ where: { workspaceId, status: 'WON', convertedAt: { gte: startDate, lte: endDate } } }),
  ]);

  return { total, byStatus, bySource, conversions, conversionRate: total > 0 ? (conversions / total) * 100 : 0 };
}

async function generateFinanceReport(prisma: PrismaClient, workspaceId: string, startDate: Date, endDate: Date) {
  const [totalReceived, pending, commissions] = await Promise.all([
    prisma.payment.aggregate({
      where: { booking: { workspaceId }, status: 'COMPLETED', paidAt: { gte: startDate, lte: endDate } },
      _sum: { amount: true },
    }),
    prisma.payment.aggregate({
      where: { booking: { workspaceId }, status: 'PENDING' },
      _sum: { amount: true },
    }),
    prisma.commission.aggregate({
      where: { workspaceId, createdAt: { gte: startDate, lte: endDate } },
      _sum: { amount: true },
    }),
  ]);

  return {
    totalReceived: Number(totalReceived._sum.amount || 0),
    totalPending: Number(pending._sum.amount || 0),
    totalCommissions: Number(commissions._sum.amount || 0),
  };
}

async function generateMarketingReport(prisma: PrismaClient, workspaceId: string, startDate: Date, endDate: Date) {
  const [campaigns, leadsBySource] = await Promise.all([
    prisma.campaign.findMany({
      where: { workspaceId, createdAt: { gte: startDate, lte: endDate } },
      select: { name: true, type: true, platform: true, status: true, budget: true, spent: true, metrics: true },
    }),
    prisma.lead.groupBy({
      by: ['source'],
      where: { workspaceId, createdAt: { gte: startDate, lte: endDate } },
      _count: true,
    }),
  ]);

  return { campaigns, leadsBySource };
}
