import { Job } from 'bullmq';
import { PrismaClient } from '@prisma/client';

export async function processNotificationJob(job: Job, prisma: PrismaClient) {
  const { userId, workspaceId, type, title, body, data } = job.data;

  // Create in-app notification
  await prisma.notification.create({
    data: {
      userId,
      workspaceId,
      type: type || 'IN_APP',
      title,
      body,
      data: data || {},
      sentAt: new Date(),
    },
  });

  // Handle push notifications
  if (type === 'PUSH' || type === 'IN_APP') {
    // Push notification logic via FCM/VAPID would go here
  }

  return { notified: true, userId, type };
}
