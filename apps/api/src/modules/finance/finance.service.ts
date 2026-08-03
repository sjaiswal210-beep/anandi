import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { RedisService } from '../../common/redis/redis.service';

@Injectable()
export class FinanceService {
  constructor(
    private prisma: PrismaService,
    private redisService: RedisService,
  ) {}

  async getSummary(workspaceId: string) {
    const [totalRevenue, monthlyRevenue, pendingPayments, commissions, gstCollected] =
      await Promise.all([
        this.prisma.payment.aggregate({
          where: { booking: { workspaceId }, status: 'COMPLETED' },
          _sum: { amount: true },
        }),
        this.prisma.payment.aggregate({
          where: {
            booking: { workspaceId },
            status: 'COMPLETED',
            paidAt: { gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1) },
          },
          _sum: { amount: true },
        }),
        this.prisma.payment.aggregate({
          where: { booking: { workspaceId }, status: 'PENDING' },
          _sum: { amount: true },
        }),
        this.prisma.commission.aggregate({
          where: { workspaceId },
          _sum: { amount: true },
        }),
        this.prisma.booking.aggregate({
          where: { workspaceId, gstAmount: { not: null } },
          _sum: { gstAmount: true },
        }),
      ]);

    return {
      totalRevenue: Number(totalRevenue._sum.amount || 0),
      monthlyRevenue: Number(monthlyRevenue._sum.amount || 0),
      pendingPayments: Number(pendingPayments._sum.amount || 0),
      totalCommissions: Number(commissions._sum.amount || 0),
      gstCollected: Number(gstCollected._sum.gstAmount || 0),
    };
  }

  async getTransactions(workspaceId: string, params: {
    page?: number;
    limit?: number;
    type?: string;
    status?: string;
    dateFrom?: string;
    dateTo?: string;
  }) {
    const { page = 1, limit = 20, type, status, dateFrom, dateTo } = params;

    const where: Record<string, unknown> = { booking: { workspaceId } };
    if (type) where.type = type;
    if (status) where.status = status;
    if (dateFrom || dateTo) {
      where.createdAt = {};
      if (dateFrom) (where.createdAt as Record<string, unknown>).gte = new Date(dateFrom);
      if (dateTo) (where.createdAt as Record<string, unknown>).lte = new Date(dateTo);
    }

    const [data, total] = await Promise.all([
      this.prisma.payment.findMany({
        where,
        include: {
          booking: { select: { bookingNumber: true, property: { select: { title: true } } } },
          customer: { select: { name: true, phone: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.payment.count({ where }),
    ]);

    return { data, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } };
  }

  async getOverduePayments(workspaceId: string) {
    return this.prisma.payment.findMany({
      where: {
        booking: { workspaceId },
        status: 'PENDING',
        dueDate: { lt: new Date() },
      },
      include: {
        booking: { select: { bookingNumber: true } },
        customer: { select: { name: true, phone: true, email: true } },
      },
      orderBy: { dueDate: 'asc' },
    });
  }

  async getCommissions(workspaceId: string, params: { userId?: string; status?: string }) {
    const where: Record<string, unknown> = { workspaceId };
    if (params.userId) where.userId = params.userId;
    if (params.status) where.status = params.status;

    return this.prisma.commission.findMany({
      where,
      include: { user: { select: { name: true, email: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async createCommission(workspaceId: string, dto: {
    userId: string;
    bookingId?: string;
    amount: number;
    percentage?: number;
    type: string;
  }) {
    return this.prisma.commission.create({
      data: {
        workspaceId,
        userId: dto.userId,
        bookingId: dto.bookingId,
        amount: dto.amount,
        percentage: dto.percentage,
        type: dto.type,
        status: 'pending',
      },
    });
  }

  async payCommission(id: string) {
    return this.prisma.commission.update({
      where: { id },
      data: { status: 'paid', paidAt: new Date() },
    });
  }

  async getRevenueByMonth(workspaceId: string, year: number) {
    const payments = await this.prisma.payment.findMany({
      where: {
        booking: { workspaceId },
        status: 'COMPLETED',
        paidAt: {
          gte: new Date(year, 0, 1),
          lte: new Date(year, 11, 31),
        },
      },
      select: { amount: true, paidAt: true },
    });

    const monthlyData = Array.from({ length: 12 }, (_, i) => ({
      month: i + 1,
      revenue: 0,
    }));

    payments.forEach((payment) => {
      if (payment.paidAt) {
        const month = payment.paidAt.getMonth();
        monthlyData[month].revenue += Number(payment.amount);
      }
    });

    return monthlyData;
  }
}
