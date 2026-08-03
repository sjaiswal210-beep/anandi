import { Job } from 'bullmq';
import { PrismaClient } from '@prisma/client';
import * as nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD,
  },
});

export async function processEmailJob(job: Job, prisma: PrismaClient) {
  const { to, subject, html, from, replyTo } = job.data;

  await transporter.sendMail({
    from: from || process.env.SMTP_FROM || 'noreply@realtyos.ai',
    to,
    subject,
    html,
    replyTo,
  });

  return { sent: true, to, subject };
}
