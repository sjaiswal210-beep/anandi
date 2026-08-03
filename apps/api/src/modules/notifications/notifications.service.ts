import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { NotificationsGateway } from './notifications.gateway';

@Injectable()
export class NotificationsService {
  constructor(
    private prisma: PrismaService,
    private gateway: NotificationsGateway,
  ) {}

  async create(dto: {
    workspaceId: string;
    userId: string;
    type?: string;
    title: string;
    body: string;
    data?: Record<string, unknown>;
  }) {
    const notification = await this.prisma.notification.create({
      data: {
        workspace: { connect: { id: dto.workspaceId } },
        user: { connect: { id: dto.userId } },
        type: (dto.type as never) || 'IN_APP',
        title: dto.title,
        body: dto.body,
        data: dto.data as never || {},
        sentAt: new Date(),
      },
    });

    // Push via WebSocket
    this.gateway.broadcastNotification(dto.userId, notification);

    return notification;
  }

  async findAll(userId: string, params: { page?: number; limit?: number; unreadOnly?: boolean }) {
    const { page = 1, limit = 20, unreadOnly } = params;

    const where: Record<string, unknown> = { userId };
    if (unreadOnly) where.isRead = false;

    const [data, total, unreadCount] = await Promise.all([
      this.prisma.notification.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.notification.count({ where }),
      this.prisma.notification.count({ where: { userId, isRead: false } }),
    ]);

    return { data, meta: { total, page, limit, unreadCount } };
  }

  async markAsRead(id: string, userId: string) {
    return this.prisma.notification.update({
      where: { id },
      data: { isRead: true, readAt: new Date() },
    });
  }

  async markAllAsRead(userId: string) {
    await this.prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true, readAt: new Date() },
    });
    return { message: 'All notifications marked as read' };
  }

  async delete(id: string, userId: string) {
    await this.prisma.notification.delete({ where: { id } });
    return { message: 'Notification deleted' };
  }

  async getUnreadCount(userId: string) {
    const count = await this.prisma.notification.count({
      where: { userId, isRead: false },
    });
    return { count };
  }

  // Utility methods for sending typed notifications
  async notifyLeadAssigned(workspaceId: string, userId: string, leadName: string) {
    return this.create({
      workspaceId,
      userId,
      title: 'New Lead Assigned',
      body: `${leadName} has been assigned to you`,
      data: { type: 'lead_assigned' },
    });
  }

  async notifyVisitScheduled(workspaceId: string, userId: string, leadName: string, date: string) {
    return this.create({
      workspaceId,
      userId,
      title: 'Visit Scheduled',
      body: `Site visit for ${leadName} scheduled on ${date}`,
      data: { type: 'visit_scheduled' },
    });
  }

  async notifyPaymentReceived(workspaceId: string, userId: string, amount: number, bookingNumber: string) {
    return this.create({
      workspaceId,
      userId,
      title: 'Payment Received',
      body: `₹${amount.toLocaleString()} received for booking ${bookingNumber}`,
      data: { type: 'payment_received' },
    });
  }

  async notifyFollowUpDue(workspaceId: string, userId: string, leadName: string) {
    return this.create({
      workspaceId,
      userId,
      title: 'Follow-up Due',
      body: `Follow-up with ${leadName} is due today`,
      data: { type: 'followup_due' },
    });
  }
}
