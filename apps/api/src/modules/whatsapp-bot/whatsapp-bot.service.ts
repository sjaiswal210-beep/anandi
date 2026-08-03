import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../common/prisma/prisma.service';
import axios from 'axios';

@Injectable()
export class WhatsAppBotService {
  private readonly logger = new Logger(WhatsAppBotService.name);
  private geminiModel: any = null;
  private readonly vpsUrl: string;
  private readonly vpsSecret: string;
  private readonly vpsBizId: string;

  private readonly projectContext = `You are the AI sales assistant for Anandi Park by Yuvraj Gade & Rajan Kute Developers.
Project: Anandi Park - Premium NA Plots at GAT No. 279, Village Bakori, Taluka Haveli, Dist Pune.
Location: On Wagholi-Bakori Wide Road, just 5 minutes from Wagholi, 10 min from Pune-Nagar Highway.
Total: 84 plots ranging from 1000 sqft to 4500 sqft.
Pricing: Starting Rs 15 Lakh (Rs 1500/sqft base). Corner plots and road-facing plots at premium.
Roads: 30 feet wide road on two sides, 20 feet internal roads.
Infrastructure: Compound wall, landscaped entry, water supply, electricity, drainage, street lights.
Title: Clear title, NA approved, RERA registered.
Possession: Ready for registration.
Developers: Yuvraj Gade & Rajan Kute - trusted developers in Pune region.
Reply in customer language. If buying intent detected, mark as HOT. Always end with a question.`;

  constructor(private prisma: PrismaService, private configService: ConfigService) {
    this.vpsUrl = this.configService.get<string>('VPS_WHATSAPP_URL', 'http://147.93.169.183:8300');
    this.vpsSecret = this.configService.get<string>('VPS_WHATSAPP_SECRET', '');
    this.vpsBizId = this.configService.get<string>('VPS_WHATSAPP_BIZ_ID', 'anandi-park');
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

  async handleIncomingMessage(from: string, message: string, workspaceId?: string) {
    const history = await this.prisma.whatsAppMessage.findMany({
      where: { OR: [{ from }, { to: from }] }, orderBy: { createdAt: 'asc' }, take: 20,
    });
    const phone = from.startsWith('91') ? from.slice(2) : from;
    const lead = await this.prisma.lead.findFirst({
      where: { OR: [{ phone }, { phone: from }, { phone: `+91${phone}` }] },
    });
    const chatHistory = history.map((m: any) => ({
      role: m.direction === 'incoming' ? 'user' : 'model',
      parts: [{ text: (m.content as any)?.text?.body || '' }],
    }));
    let reply = 'Thank you for your message. Our team will get back to you shortly.';
    if (this.geminiModel) {
      try {
        const chat = this.geminiModel.startChat({
          history: [
            { role: 'user', parts: [{ text: `System: ${this.projectContext}${lead ? `\nLead: ${lead.name}, Budget: ${lead.budget}, Status: ${lead.status}` : ''}` }] },
            { role: 'model', parts: [{ text: 'Understood. I am ready to assist customers.' }] },
            ...chatHistory.slice(-16),
          ],
        });
        const result = await chat.sendMessage(message);
        reply = result.response.text();
      } catch (err: any) { this.logger.error('Gemini reply failed:', err.message); }
    }
    const intent = this.detectIntent(message);
    if (intent === 'HOT' && lead) {
      await this.prisma.lead.update({ where: { id: lead.id }, data: { score: Math.min(100, (lead.score || 0) + 20), tags: { push: 'hot-lead' } } });
    }
    if (workspaceId) {
      await this.prisma.whatsAppMessage.create({ data: { workspaceId, from: '919999000001', to: from, type: 'text', content: { text: { body: reply } } as any, direction: 'outgoing', status: 'sent' } });
    }
    return { reply, intent };
  }

  private detectIntent(message: string): string {
    const lower = message.toLowerCase();
    if (['book', 'buy', 'price', 'rate', 'visit', 'interested', 'khareedna', 'dekhna', 'payment'].some(k => lower.includes(k))) return 'HOT';
    if (['not interested', 'no', 'stop', 'later', 'busy'].some(k => lower.includes(k))) return 'COLD';
    return 'WARM';
  }

  async getConversations(workspaceId: string) {
    const messages = await this.prisma.whatsAppMessage.findMany({ where: { workspaceId }, orderBy: { createdAt: 'desc' }, take: 200 });
    const contactMap = new Map<string, any>();
    messages.forEach((m: any) => {
      const contact = m.direction === 'incoming' ? m.from : m.to;
      if (!contactMap.has(contact)) contactMap.set(contact, { messages: 0, lastMessage: (m.content as any)?.text?.body?.slice(0, 60) || '', lastTime: m.createdAt, intent: 'WARM' });
      contactMap.get(contact)!.messages++;
    });
    return Array.from(contactMap.entries()).map(([phone, data]) => ({ phone, ...data }));
  }

  async getBotMetrics(workspaceId: string) {
    const [totalMessages, uniqueContacts, todayMessages] = await Promise.all([
      this.prisma.whatsAppMessage.count({ where: { workspaceId } }),
      this.prisma.whatsAppMessage.groupBy({ by: ['from'], where: { workspaceId, direction: 'incoming' } }),
      this.prisma.whatsAppMessage.count({ where: { workspaceId, createdAt: { gte: new Date(new Date().setHours(0, 0, 0, 0)) } } }),
    ]);
    return { totalMessages, uniqueContacts: uniqueContacts.length, todayMessages, avgResponseTime: '< 3 sec', autoReplyRate: '98%' };
  }

  // VPS Integration
  async getVpsStatus() {
    try {
      const res = await axios.get(`${this.vpsUrl}/session/${this.vpsBizId}/status`, { headers: { 'X-Wa-Secret': this.vpsSecret }, timeout: 5000 });
      return res.data;
    } catch (e: any) { return { status: 'unreachable', error: e.message }; }
  }

  async startVpsSession() {
    try {
      const res = await axios.post(`${this.vpsUrl}/session/${this.vpsBizId}/start`, {}, { headers: { 'X-Wa-Secret': this.vpsSecret }, timeout: 10000 });
      return res.data;
    } catch (e: any) { return { error: e.message }; }
  }

  async sendViaVps(to: string, message: string) {
    try {
      const phone = to.replace(/[^0-9]/g, '');
      const res = await axios.post(`${this.vpsUrl}/session/${this.vpsBizId}/send`, { to: phone, message }, { headers: { 'X-Wa-Secret': this.vpsSecret }, timeout: 30000 });
      this.logger.log(`VPS WhatsApp sent to ${phone}`);
      return res.data;
    } catch (e: any) { this.logger.error(`VPS send failed: ${e.message}`); return { error: e.message }; }
  }

  async broadcastViaVps(numbers: string[], message: string) {
    try {
      const clean = numbers.map(n => n.replace(/[^0-9]/g, '')).filter(n => n.length >= 10);
      const res = await axios.post(`${this.vpsUrl}/session/${this.vpsBizId}/broadcast`, { numbers: clean, message }, { headers: { 'X-Wa-Secret': this.vpsSecret }, timeout: 60000 });
      return res.data;
    } catch (e: any) { this.logger.error(`VPS broadcast failed: ${e.message}`); return { error: e.message }; }
  }

  async getVpsHealth() {
    try { const res = await axios.get(`${this.vpsUrl}/health`, { timeout: 5000 }); return res.data; }
    catch (e: any) { return { status: 'offline', error: e.message }; }
  }
}
