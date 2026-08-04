import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../common/prisma/prisma.service';
import { VobizService } from './vobiz.service';

@Injectable()
export class AICallingService {
  private readonly logger = new Logger(AICallingService.name);
  private geminiModel: any = null;

  constructor(
    private prisma: PrismaService,
    private configService: ConfigService,
    private vobiz: VobizService,
  ) {
    this.initGemini();
  }

  private async initGemini() {
    try {
      const { GoogleGenerativeAI } = await import('@google/generative-ai');
      const apiKey = this.configService.get<string>('GEMINI_API_KEY');
      if (apiKey) {
        const genAI = new GoogleGenerativeAI(apiKey);
        this.geminiModel = genAI.getGenerativeModel({ model: this.configService.get<string>('GEMINI_MODEL', 'gemini-flash-latest') });
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
    let script = dto.script;
    if (!script && dto.leadId) {
      const generated = await this.generateScript(dto.leadId, dto.objective || 'introduction');
      script = (generated as any).script;
    }

    // If Vobiz is configured, place a real call.
    if (this.vobiz.isConfigured) {
      // Determine the answer URL — use GitHub-hosted XML files since Vobiz needs HTTPS.
      const answerUrl = this.resolveAnswerUrl(script);

      const call = await this.prisma.callRecord.create({
        data: {
          workspaceId,
          leadId: dto.leadId,
          phone: dto.phone,
          direction: 'outbound',
          status: 'initiated',
          script: script || answerUrl,
          provider: 'vobiz',
          providerCallId: '',
        },
      });

      try {
        const result = await this.vobiz.makeCall({ to: dto.phone, answerUrl });
        await this.prisma.callRecord.update({
          where: { id: call.id },
          data: { providerCallId: result.callUuid },
        });
        return { callId: call.id, callUuid: result.callUuid, status: 'initiated', provider: 'vobiz' };
      } catch (e: any) {
        await this.prisma.callRecord.update({
          where: { id: call.id },
          data: { status: 'failed', transcript: e.message },
        });
        throw new BadRequestException(`Call failed: ${e.message}`);
      }
    }

    throw new BadRequestException(
      'No telephony provider configured. Set VOBIZ_AUTH_ID, VOBIZ_AUTH_TOKEN, ' +
        'and VOBIZ_FROM_NUMBER in .env to place real calls.',
    );
  }

  /** Resolves which HTTPS answer_url to use for Vobiz. */
  private resolveAnswerUrl(script?: string): string {
    const base = 'https://raw.githubusercontent.com/sjaiswal210-beep/anandi/main/uploads/tts';

    // If script looks like an XML URL already
    if (script?.startsWith('https://') && script.endsWith('.xml')) return script;

    // Match known audio keywords to XML files
    if (script?.includes('marathi')) return `${base}/answer-marathi.xml`;
    if (script?.includes('english')) return `${base}/answer-english.xml`;
    if (script?.includes('followup')) return `${base}/answer-hindi.xml`;

    // Default: Hindi pitch
    return `${base}/answer-hindi.xml`;
  }

  /** Call every scraped lead in the workspace, one after another. */
  async blastCall(workspaceId: string, dto: { script?: string; tag?: string; limit?: number }) {
    if (!this.vobiz.isConfigured) {
      throw new BadRequestException('Vobiz is not configured. Set env vars first.');
    }

    const leads = await this.prisma.lead.findMany({
      where: {
        workspaceId,
        phone: { not: '' },
        ...(dto.tag && { tags: { has: dto.tag } }),
        NOT: { status: { in: ['WON', 'LOST'] } },
      },
      select: { id: true, phone: true, name: true },
      take: dto.limit || 50,
    });

    if (leads.length === 0) {
      return { message: 'No eligible leads to call', called: 0 };
    }

    const results: any[] = [];

    for (const lead of leads) {
      try {
        const r = await this.initiateCall(workspaceId, {
          leadId: lead.id,
          phone: lead.phone,
          script: dto.script,
        });
        results.push({ name: lead.name, phone: lead.phone, ...r });
      } catch (e: any) {
        results.push({ name: lead.name, phone: lead.phone, error: e.message });
      }
      await new Promise((resolve) => setTimeout(resolve, 1500));
    }

    return {
      called: results.length,
      placed: results.filter((r) => r.callUuid).length,
      failed: results.filter((r) => r.error).length,
      results,
    };
  }

  /** Call a raw list of phone numbers (from the dashboard input). */
  async callNumbers(workspaceId: string, dto: { numbers: string[]; script?: string }) {
    if (!this.vobiz.isConfigured) {
      throw new BadRequestException('Vobiz is not configured.');
    }

    const answerUrl = this.resolveAnswerUrl(dto.script);
    const results: any[] = [];

    for (const num of dto.numbers) {
      const phone = num.replace(/[^\d]/g, '');
      if (phone.length < 10) {
        results.push({ phone: num, error: 'invalid number', status: 'skipped' });
        continue;
      }

      try {
        const call = await this.prisma.callRecord.create({
          data: {
            workspaceId,
            phone,
            direction: 'outbound',
            status: 'initiated',
            script: dto.script || answerUrl,
            provider: 'vobiz',
            providerCallId: '',
          },
        });

        const result = await this.vobiz.makeCall({ to: phone, answerUrl });
        await this.prisma.callRecord.update({
          where: { id: call.id },
          data: { providerCallId: result.callUuid },
        });
        results.push({ phone, callUuid: result.callUuid, status: 'placed' });
      } catch (e: any) {
        results.push({ phone, error: e.message, status: 'failed' });
      }
      await new Promise((resolve) => setTimeout(resolve, 1500));
    }

    return {
      total: dto.numbers.length,
      placed: results.filter((r) => r.status === 'placed').length,
      failed: results.filter((r) => r.status === 'failed').length,
      results,
    };
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
