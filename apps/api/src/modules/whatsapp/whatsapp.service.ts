import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../common/prisma/prisma.service';
import axios from 'axios';

interface WhatsAppMessage {
  to: string;
  type: 'text' | 'template' | 'image' | 'document';
  text?: { body: string };
  template?: { name: string; language: { code: string }; components?: unknown[] };
  image?: { link: string; caption?: string };
  document?: { link: string; filename: string };
}

@Injectable()
export class WhatsAppService {
  private readonly logger = new Logger(WhatsAppService.name);
  private readonly apiUrl: string;
  private readonly phoneNumberId: string;
  private readonly accessToken: string;

  constructor(
    private prisma: PrismaService,
    private configService: ConfigService,
  ) {
    this.apiUrl = this.configService.get<string>('WHATSAPP_API_URL', 'https://graph.facebook.com/v18.0');
    this.phoneNumberId = this.configService.get<string>('WHATSAPP_PHONE_NUMBER_ID', '');
    this.accessToken = this.configService.get<string>('WHATSAPP_ACCESS_TOKEN', '');
  }

  async sendMessage(workspaceId: string, to: string, message: WhatsAppMessage) {
    try {
      const response = await axios.post(
        `${this.apiUrl}/${this.phoneNumberId}/messages`,
        {
          messaging_product: 'whatsapp',
          recipient_type: 'individual',
          to: to.startsWith('+') ? to.slice(1) : to,
          type: message.type,
          ...(message.type === 'text' && { text: message.text }),
          ...(message.type === 'template' && { template: message.template }),
          ...(message.type === 'image' && { image: message.image }),
          ...(message.type === 'document' && { document: message.document }),
        },
        {
          headers: {
            Authorization: `Bearer ${this.accessToken}`,
            'Content-Type': 'application/json',
          },
        },
      );

      // Store message in database
      await this.prisma.whatsAppMessage.create({
        data: {
          workspaceId,
          from: this.phoneNumberId,
          to,
          type: message.type,
          content: message as never,
          direction: 'outgoing',
          status: 'sent',
          messageId: response.data?.messages?.[0]?.id,
        },
      });

      return { success: true, messageId: response.data?.messages?.[0]?.id };
    } catch (error: unknown) {
      const err = error as { response?: { data?: unknown }; message?: string };
      this.logger.error('WhatsApp send failed:', err.response?.data || err.message);
      throw error;
    }
  }

  async sendTemplate(workspaceId: string, to: string, templateName: string, params: string[] = []) {
    const components = params.length > 0
      ? [{
          type: 'body',
          parameters: params.map((p) => ({ type: 'text', text: p })),
        }]
      : undefined;

    return this.sendMessage(workspaceId, to, {
      to,
      type: 'template',
      template: {
        name: templateName,
        language: { code: 'en' },
        components,
      },
    });
  }

  async sendTextMessage(workspaceId: string, to: string, text: string) {
    return this.sendMessage(workspaceId, to, {
      to,
      type: 'text',
      text: { body: text },
    });
  }

  async broadcast(workspaceId: string, recipients: string[], templateName: string, params: string[] = []) {
    const results = { sent: 0, failed: 0, errors: [] as string[] };

    for (const recipient of recipients) {
      try {
        await this.sendTemplate(workspaceId, recipient, templateName, params);
        results.sent++;
        // Rate limiting: 80 messages per second max
        await new Promise((resolve) => setTimeout(resolve, 50));
      } catch (error) {
        results.failed++;
        results.errors.push(`Failed to send to ${recipient}`);
      }
    }

    return results;
  }

  async handleWebhook(body: Record<string, unknown>) {
    const entry = (body.entry as unknown[]) || [];

    for (const item of entry as Array<{ changes: Array<{ value: { messages?: unknown[] } }> }>) {
      const changes = item.changes || [];
      for (const change of changes) {
        const messages = change.value?.messages || [];
        for (const message of messages as Array<{
          from: string;
          id: string;
          type: string;
          text?: { body: string };
          timestamp: string;
        }>) {
          await this.processIncomingMessage(message);
        }
      }
    }
  }

  private async processIncomingMessage(message: {
    from: string;
    id: string;
    type: string;
    text?: { body: string };
    timestamp: string;
  }) {
    // Store incoming message
    await this.prisma.whatsAppMessage.create({
      data: {
        from: message.from,
        to: this.phoneNumberId,
        type: message.type,
        content: message as never,
        direction: 'incoming',
        status: 'received',
        messageId: message.id,
      },
    });

    // Check if sender is a known lead
    const phone = message.from.startsWith('91') ? message.from.slice(2) : message.from;
    const lead = await this.prisma.lead.findFirst({
      where: {
        OR: [
          { phone },
          { phone: `+91${phone}` },
          { phone: message.from },
        ],
      },
    });

    if (lead) {
      // Log activity
      await this.prisma.activity.create({
        data: {
          userId: lead.createdById,
          leadId: lead.id,
          type: 'WHATSAPP_RECEIVED',
          title: `WhatsApp message from ${lead.name}`,
          description: message.text?.body || 'Media message received',
        },
      });

      // Update last contacted
      await this.prisma.lead.update({
        where: { id: lead.id },
        data: { lastContactedAt: new Date() },
      });
    } else {
      // Auto-create lead from WhatsApp
      // Find a workspace to assign (using first workspace for now)
      const workspace = await this.prisma.workspace.findFirst();
      if (workspace) {
        const admin = await this.prisma.user.findFirst({ where: { role: 'SUPER_ADMIN' } });
        if (admin) {
          await this.prisma.lead.create({
            data: {
              workspaceId: workspace.id,
              createdById: admin.id,
              name: `WhatsApp Lead (${phone})`,
              phone: phone,
              source: 'WHATSAPP',
              status: 'NEW',
            },
          });
        }
      }
    }
  }

  async getConversations(workspaceId: string, phone?: string) {
    const where: Record<string, unknown> = { workspaceId };
    if (phone) {
      where.OR = [{ from: phone }, { to: phone }];
    }

    return this.prisma.whatsAppMessage.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
  }

  async getMessages(workspaceId: string, contactPhone: string) {
    return this.prisma.whatsAppMessage.findMany({
      where: {
        workspaceId,
        OR: [
          { from: contactPhone },
          { to: contactPhone },
        ],
      },
      orderBy: { createdAt: 'asc' },
    });
  }
}
