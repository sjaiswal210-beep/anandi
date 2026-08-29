import { Job } from 'bullmq';
import { PrismaClient } from '@prisma/client';
import axios from 'axios';

export async function processWhatsAppJob(job: Job, prisma: PrismaClient) {
  const { to, type, content, workspaceId, templateName, params } = job.data;

  const apiUrl = process.env.WHATSAPP_API_URL || 'https://graph.facebook.com/v18.0';
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  const accessToken = process.env.WHATSAPP_ACCESS_TOKEN;

  const payload: Record<string, unknown> = {
    messaging_product: 'whatsapp',
    recipient_type: 'individual',
    to: to.startsWith('+') ? to.slice(1) : to,
    type,
  };

  if (type === 'text') {
    payload.text = { body: content };
  } else if (type === 'template') {
    payload.template = {
      name: templateName,
      language: { code: 'en' },
      components: params?.length
        ? [{ type: 'body', parameters: params.map((p: string) => ({ type: 'text', text: p })) }]
        : undefined,
    };
  }

  const response = await axios.post(
    `${apiUrl}/${phoneNumberId}/messages`,
    payload,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    },
  );

  await prisma.whatsAppMessage.create({
    data: {
      workspaceId,
      from: phoneNumberId || '',
      to,
      type,
      content: payload as any,
      direction: 'outgoing',
      status: 'sent',
      messageId: response.data?.messages?.[0]?.id,
      templateName,
    },
  });

  return { success: true, messageId: response.data?.messages?.[0]?.id };
}
