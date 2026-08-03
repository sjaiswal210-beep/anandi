import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { RedisService } from '../../common/redis/redis.service';
import { generateBookingNumber } from '@realtyos/shared';

@Injectable()
export class BookingsService {
  constructor(
    private prisma: PrismaService,
    private redisService: RedisService,
  ) {}

  async create(workspaceId: string, dto: {
    leadId?: string;
    customerId: string;
    propertyId: string;
    bookingAmount: number;
    totalAmount: number;
    loanRequired?: boolean;
    loanAmount?: number;
    loanBank?: string;
    notes?: string;
  }) {
    const property = await this.prisma.property.findFirst({
      where: { id: dto.propertyId, workspaceId },
    });

    if (!property) throw new NotFoundException('Property not found');
    if (property.status !== 'AVAILABLE') {
      throw new BadRequestException('Property is not available for booking');
    }

    const booking = await this.prisma.booking.create({
      data: {
        workspace: { connect: { id: workspaceId } },
        customer: { connect: { id: dto.customerId } },
        property: { connect: { id: dto.propertyId } },
        ...(dto.leadId && { lead: { connect: { id: dto.leadId } } }),
        bookingNumber: generateBookingNumber(),
        status: 'INITIATED',
        bookingAmount: dto.bookingAmount,
        totalAmount: dto.totalAmount,
        paidAmount: 0,
        pendingAmount: dto.totalAmount,
        loanRequired: dto.loanRequired || false,
        loanAmount: dto.loanAmount,
        loanBank: dto.loanBank,
        notes: dto.notes,
      },
      include: {
        customer: { select: { id: true, name: true, phone: true, email: true } },
        property: { select: { id: true, title: true, type: true, price: true } },
      },
    });

    // Update property status
    await this.prisma.property.update({
      where: { id: dto.propertyId },
      data: { status: 'RESERVED' },
    });

    // Update lead status if linked
    if (dto.leadId) {
      await this.prisma.lead.update({
        where: { id: dto.leadId },
        data: { status: 'WON', convertedAt: new Date() },
      });
    }

    await this.redisService.flushByPattern(`bookings:${workspaceId}:*`);
    await this.redisService.flushByPattern(`dashboard:${workspaceId}:*`);

    return booking;
  }

  async findAll(workspaceId: string, params: {
    page?: number;
    limit?: number;
    status?: string;
    search?: string;
  }) {
    const { page = 1, limit = 20, status, search } = params;

    const where: Record<string, unknown> = { workspaceId };
    if (status) where.status = status;
    if (search) {
      where.OR = [
        { bookingNumber: { contains: search, mode: 'insensitive' } },
        { customer: { name: { contains: search, mode: 'insensitive' } } },
        { customer: { phone: { contains: search } } },
      ];
    }

    const [data, total] = await Promise.all([
      this.prisma.booking.findMany({
        where,
        include: {
          customer: { select: { id: true, name: true, phone: true } },
          property: { select: { id: true, title: true, type: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.booking.count({ where }),
    ]);

    return {
      data,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async findById(id: string, workspaceId: string) {
    const booking = await this.prisma.booking.findFirst({
      where: { id, workspaceId },
      include: {
        customer: true,
        property: { include: { media: { take: 5 } } },
        lead: { select: { id: true, name: true, phone: true } },
        payments: { orderBy: { createdAt: 'desc' } },
      },
    });

    if (!booking) throw new NotFoundException('Booking not found');
    return booking;
  }

  async updateStatus(id: string, workspaceId: string, status: string) {
    const booking = await this.prisma.booking.findFirst({
      where: { id, workspaceId },
    });

    if (!booking) throw new NotFoundException('Booking not found');

    const updateData: Record<string, unknown> = { status };

    if (status === 'REGISTERED') {
      updateData.registrationDate = new Date();
    }
    if (status === 'COMPLETED') {
      await this.prisma.property.update({
        where: { id: booking.propertyId },
        data: { status: 'SOLD' },
      });
    }
    if (status === 'CANCELLED') {
      await this.prisma.property.update({
        where: { id: booking.propertyId },
        data: { status: 'AVAILABLE' },
      });
    }

    const updated = await this.prisma.booking.update({
      where: { id },
      data: updateData,
    });

    await this.redisService.flushByPattern(`bookings:${workspaceId}:*`);
    return updated;
  }

  async addPayment(bookingId: string, workspaceId: string, dto: {
    amount: number;
    type: string;
    method?: string;
    transactionId?: string;
    dueDate?: string;
    notes?: string;
  }) {
    const booking = await this.prisma.booking.findFirst({
      where: { id: bookingId, workspaceId },
    });

    if (!booking) throw new NotFoundException('Booking not found');

    const payment = await this.prisma.payment.create({
      data: {
        booking: { connect: { id: bookingId } },
        customer: { connect: { id: booking.customerId } },
        amount: dto.amount,
        type: dto.type,
        method: dto.method,
        transactionId: dto.transactionId,
        status: 'PENDING',
        dueDate: dto.dueDate ? new Date(dto.dueDate) : undefined,
        notes: dto.notes,
      },
    });

    return payment;
  }

  async recordPayment(paymentId: string, dto: {
    method: string;
    transactionId?: string;
    receiptUrl?: string;
  }) {
    const payment = await this.prisma.payment.findUnique({
      where: { id: paymentId },
      include: { booking: true },
    });

    if (!payment) throw new NotFoundException('Payment not found');

    const updated = await this.prisma.payment.update({
      where: { id: paymentId },
      data: {
        status: 'COMPLETED',
        method: dto.method,
        transactionId: dto.transactionId,
        receiptUrl: dto.receiptUrl,
        paidAt: new Date(),
      },
    });

    // Update booking amounts
    const totalPaid = await this.prisma.payment.aggregate({
      where: { bookingId: payment.bookingId, status: 'COMPLETED' },
      _sum: { amount: true },
    });

    const paidAmount = Number(totalPaid._sum.amount || 0);
    await this.prisma.booking.update({
      where: { id: payment.bookingId },
      data: {
        paidAmount,
        pendingAmount: Number(payment.booking.totalAmount) - paidAmount,
      },
    });

    return updated;
  }

  async getPaymentSchedule(bookingId: string) {
    return this.prisma.payment.findMany({
      where: { bookingId },
      orderBy: { dueDate: 'asc' },
    });
  }
}
