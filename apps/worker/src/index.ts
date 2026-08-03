import { Worker, Queue } from 'bullmq';
import Redis from 'ioredis';
import { PrismaClient } from '@prisma/client';
import { processEmailJob } from './processors/email.processor';
import { processNotificationJob } from './processors/notification.processor';
import { processAIAgentJob } from './processors/ai-agent.processor';
import { processWhatsAppJob } from './processors/whatsapp.processor';
import { processReportJob } from './processors/report.processor';

const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');
const prisma = new PrismaClient();

// Email Queue
const emailWorker = new Worker(
  'email',
  async (job) => processEmailJob(job, prisma),
  { connection: redis, concurrency: 5 },
);

// Notification Queue
const notificationWorker = new Worker(
  'notification',
  async (job) => processNotificationJob(job, prisma),
  { connection: redis, concurrency: 10 },
);

// AI Agent Queue
const aiAgentWorker = new Worker(
  'ai-agent',
  async (job) => processAIAgentJob(job, prisma),
  { connection: redis, concurrency: 3 },
);

// WhatsApp Queue
const whatsappWorker = new Worker(
  'whatsapp',
  async (job) => processWhatsAppJob(job, prisma),
  { connection: redis, concurrency: 5 },
);

// Report Generation Queue
const reportWorker = new Worker(
  'report',
  async (job) => processReportJob(job, prisma),
  { connection: redis, concurrency: 2 },
);

// Error handlers
const workers = [emailWorker, notificationWorker, aiAgentWorker, whatsappWorker, reportWorker];
workers.forEach((worker) => {
  worker.on('completed', (job) => {
    console.warn(`✅ Job ${job.id} completed in queue ${job.queueName}`);
  });
  worker.on('failed', (job, err) => {
    console.error(`❌ Job ${job?.id} failed in queue ${job?.queueName}:`, err.message);
  });
});

console.warn('🚀 RealtyOS Worker started');
console.warn('📋 Queues: email, notification, ai-agent, whatsapp, report');

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.warn('Shutting down workers...');
  await Promise.all(workers.map((w) => w.close()));
  await prisma.$disconnect();
  await redis.quit();
  process.exit(0);
});
