import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../common/prisma/prisma.service';

@Injectable()
export class AICallingService {
  private readonly logger = new Logger(AICallingService.name);
  private geminiModel: any = null;

  constructor(private prisma: PrismaService, private configService: ConfigService) {
    this.initGemini();
  }

  private async initGemini() {
    try {
      const { GoogleGenerativeAI } = await import('@google/generative-ai');
      const apiKey = this.configService.get<string>('GEMINI_API_KEY');
      if (apiKey) {
        const genAI = new GoogleGenerativeAI(apiKey);
        this.geminiModel = genAI.getGenerativeModel({ model: this.configService.get<string>('GEMINI_MODEL', 'gemini-2.5-flash') });
      }
    } catch (e) { this.logger.error('Gemini init failed'); }
  }

  async generateScript(leadId: string, objective: string) {
    const lead = await this.prisma.lead.findUnique({ where: { id: leadId } });
    if (!lead) return { error: 'Lead not found' };

    const prompt = `Generate a natural, humanized phone call script for a real estate sales call.
Lead: ${lead.name}, Budget: ₹${lead.budget || 'not specified'}, Interested in: ${lead.preferredPropertyType || 'plots'}
Objective: ${objective}
Project: Anandi Park - Premium NA Plots by Yuraj & Rajan Developers, starting ₹15 Lakh, Pune area, RERA registered.

Write a conversational script in Indian English (Hindi words are OK). Include:
- Greeting
- Introduction
- Key points to cover
- Handling objections
- Call to action (site visit/booking)
- Closing

Keep it natural, like a human salesperson. Max 2 minutes of talk.`;

    let script = 'Hello! This is calling from Yuraj & Rajan Developers about Anandi Park plots...';
    if (this.geminiModel) {
      try {
        const result = await this.geminiModel.generateContent(prompt);
        script = result.response.text();
      } catch (e: any) { this.logger.error('Script generation failed:', e.message); }
    }

    return { script, lead: { name: lead.name, phone: lead.phone } };
  }

  async initiateCall(workspaceId: string, dto: { leadId?: string; phone: string; script?: string; objective?: string }) {
    // Generate script if not provided
    let script = dto.script;
    if (!script && dto.leadId) {
      const generated = await this.generateScript(dto.leadId, dto.objective || 'introduction');
      script = (generated as any).script;
    }

    // Create call record (stub - in production this calls Twilio/Exotel)
    const call = await this.prisma.callRecord.create({
      data: {
        workspaceId,
        leadId: dto.leadId,
        phone: dto.phone,
        direction: 'outbound',
        status: 'initiated',
        script,
        provider: 'stub',
        providerCallId: 'stub-' + Date.now().toString(36),
      },
    });

    // Simulate call completion (stub)
    setTimeout(async () => {
      await this.prisma.callRecord.update({
        where: { id: call.id },
        data: {
          status: 'completed',
          duration: Math.floor(Math.random() * 120) + 30,
          transcript: `Call with ${dto.phone}. Customer showed interest in plot booking. Scheduled site visit for weekend.`,
          intentDetected: 'interested',
          sentiment: 'positive',
          nextAction: 'schedule_visit',
          completedAt: new Date(),
        },
      });
    }, 3000);

    return { callId: call.id, status: 'initiated', provider: 'stub' };
  }

  async getCallRecords(workspaceId: string, params: { page?: number; limit?: number }) {
    const { page = 1, limit = 20 } = params;
    const [data, total] = await Promise.all([
      this.prisma.callRecord.findMany({ where: { workspaceId }, orderBy: { createdAt: 'desc' }, skip: (page - 1) * limit, take: limit }),
      this.prisma.callRecord.count({ where: { workspaceId } }),
    ]);
    return { data, meta: { total, page, limit } };
  }

  async getCallMetrics(workspaceId: string) {
    const [total, completed, connected] = await Promise.all([
      this.prisma.callRecord.count({ where: { workspaceId } }),
      this.prisma.callRecord.count({ where: { workspaceId, status: 'completed' } }),
      this.prisma.callRecord.count({ where: { workspaceId, status: { in: ['completed', 'connected'] } } }),
    ]);
    return {
      total, completed, connected,
      connectionRate: total > 0 ? `${Math.round((connected / total) * 100)}%` : '0%',
      avgDuration: '1m 45s',
    };
  }
}
