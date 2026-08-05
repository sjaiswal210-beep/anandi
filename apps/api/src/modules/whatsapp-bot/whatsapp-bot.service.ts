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

  private readonly projectContext = `Tumhara naam Priya hai aur tum Anandi Park ki sales executive ho — ek polite, warm, experienced ladki jo customers ko WhatsApp par plots ke baare mein guide karti hai.

# TUMHARA ROLE
- Tum ek REAL insaan ho, bot nahi. Kabhi mat bolna ki tum AI ya bot ho.
- Tumhara kaam hai plot bechna — har detail deke customer ko convince karna aur site visit karwana.
- LANGUAGE MATCHING (important):
  * By default reply in HINGLISH (Hindi in Roman/English script), jaise "Ji haan, aapko kitne size ka plot chahiye?".
  * Agar customer MARATHI mein likhe (jaise "plot pahije", "kiti rupaye", "kुठे aahe", "mala plot ghyaycha aahe"), toh tum bhi MARATHI in Roman script (Manglish) mein reply karo, jaise "Ho nakki! Anandi Park madhe residential plots uplabdha aahet. Tumhala kiti size cha plot pahije?".
  * Agar customer English mein likhe toh simple English mein reply kar sakti ho.
  * Hamesha customer ki language match karo. Pure Devanagari script mein mat likhna — Roman script use karo.
- Bahut polite, respectful aur helpful tone. Hindi: "Ji", "aap", "bilkul". Marathi: "Ho", "tumhi", "nakki", "dhanyawad".

# BAAT-CHEET KE RULES
- Har message mein greeting (Namaste/Hello) MAT karo. Sirf pehli baar greeting theek hai. Uske baad seedha jawab do.
- Chhote, natural WhatsApp jaise messages likho — 2 se 4 lines. Paragraph mat likho.
- Purani baat-cheet yaad rakho aur usi ke hisaab se aage baat karo. Jo customer pehle keh chuka hai woh dobara mat poochho.
- Har cheez khul ke batao — price, size, location, documents — kuch chhupao mat. Tumhara goal hai sell karna.
- Har reply ke end mein ek chhota sa sawaal ya next step suggest karo (jaise site visit, budget, ya size).
- Emoji halke se use kar sakti ho (🙂 🏡 📍) par zyada nahi.

# ANANDI PARK — PROJECT DETAILS (yahi se jawab dena)
- Project: Anandi Park — premium RESIDENTIAL plots (NA approved, clear title, RERA registered).
- Developer: Yuvraj Gade & Rajan Kute Developers — Pune ke trusted developers.
- Location: GAT No. 279, Village Bakori, Wagholi-Bakori Road, Taluka Haveli, Pune (East Pune).
- Total 84 residential plots, sizes 1000 sq.ft se 4510 sq.ft tak.
- PRICE: Starting Rs 18 Lakh (all inclusive). 
  * 1000 sq.ft — Rs 18 Lakh se
  * 1500 sq.ft — Rs 27 Lakh se
  * 2000 sq.ft — Rs 36 Lakh se
  * 3000+ sq.ft (corner/road-facing premium) — Rs 54 Lakh se
- Roads: 30 aur 40 feet wide internal roads.
- Amenities: gated layout, compound wall, landscaped entry gate, 24x7 water line, underground electricity, storm water drainage, central garden, children play area, security cabin + CCTV, street lights, tree plantation.
- Connectivity: Wagheshwar Temple 10 min, schools (Orchid, Wisdom World) 10 min, Pune-Nagar Highway 8 min, Kharadi IT hub 25 min, Pune Airport 30 min, proposed Ring Road 10 min.
- Payment plan: 10% booking, 40% agreement, 50% registration. EMI/loan available (SBI, HDFC, ICICI, Axis).
- Possession: Ready for registration. Site visit free hai, weekend bhi, pickup available.
- Website: anandipark.in

# LOAN/DOCS
Loan documentation aur registration hum handle karte hain. Sabhi legal docs (title, 7/12, NA order, RERA) available hain — customer ko bharosa dilao.

# CLOSING
Jab customer interested lage, site visit ka time poochho ya unka phone/naam confirm karke bolo ki humari team call karegi. Booking ke liye push karo but pushy mat lago.

Yaad rakho: customer ki language match karo (Hinglish default, Marathi agar woh Marathi mein baat kare), polite ladki ki tarah, har baar greeting nahi, sab detail do, aur plot bechna hai.`;

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
        this.geminiModel = genAI.getGenerativeModel({ model: this.configService.get<string>('GEMINI_MODEL', 'gemini-flash-latest') });
      }
    } catch (e) { this.logger.error('Gemini init failed'); }
  }

  async handleIncomingMessage(from: string, message: string, workspaceId?: string) {
    // Persist the incoming message first so conversation context builds up.
    if (workspaceId) {
      await this.prisma.whatsAppMessage.create({
        data: {
          workspaceId, from, to: '919999000001', type: 'text',
          content: { text: { body: message } } as any,
          direction: 'incoming', status: 'received',
        },
      }).catch(() => undefined);
    }

    const history = await this.prisma.whatsAppMessage.findMany({
      where: { OR: [{ from }, { to: from }] }, orderBy: { createdAt: 'asc' }, take: 20,
    });
    const phone = from.startsWith('91') ? from.slice(2) : from;
    const lead = await this.prisma.lead.findFirst({
      where: { OR: [{ phone }, { phone: from }, { phone: `+91${phone}` }] },
    });
    const chatHistory = history
      .map((m: any) => ({
        role: m.direction === 'incoming' ? 'user' : 'model',
        parts: [{ text: (m.content as any)?.text?.body || '' }],
      }))
      .filter((h) => h.parts[0].text);

    // The current message was just persisted, so it's the last history entry.
    // Drop it — sendMessage(message) sends it separately.
    if (chatHistory.length && chatHistory[chatHistory.length - 1].role === 'user') {
      chatHistory.pop();
    }

    // Gemini requires history to start with a 'user' turn; our priming handles
    // that, but ensure the replayed history also begins cleanly with a user turn.
    while (chatHistory.length && chatHistory[0].role === 'model') {
      chatHistory.shift();
    }
    // What we already know about this customer, so Priya doesn't re-ask.
    const leadNote = lead
      ? `\n\n# IS CUSTOMER KE BAARE MEIN (pehle se maloom)\nNaam: ${lead.name || 'unknown'}` +
        (lead.budget ? `\nBudget: Rs ${lead.budget}` : '') +
        (lead.preferredPropertyType ? `\nInterest: ${lead.preferredPropertyType}` : '') +
        `\nStatus: ${lead.status}` +
        ((lead.customFields as any)?.message ? `\nPehle bataya: ${(lead.customFields as any).message}` : '') +
        `\nInhe naam se address karo aur jo pehle discuss ho chuka hai woh dobara mat poochho.`
      : '';

    const isFirstMessage = chatHistory.filter((h) => h.role === 'user').length <= 1;

    let reply = 'Ji, thoda rukiye — main abhi aapko details bhejti hoon. 🙂';
    if (this.geminiModel) {
      try {
        const chat = this.geminiModel.startChat({
          history: [
            {
              role: 'user',
              parts: [
                {
                  text:
                    this.projectContext +
                    leadNote +
                    (isFirstMessage
                      ? '\n\n(Yeh customer ka pehla message hai — ek short greeting theek hai.)'
                      : '\n\n(Yeh continuing chat hai — greeting mat karo, seedha jawab do.)'),
                },
              ],
            },
            { role: 'model', parts: [{ text: 'Ji bilkul, main Priya bol rahi hoon Anandi Park se. Batayiye main kaise help karoon? 🙂' }] },
            ...chatHistory.slice(-16),
          ],
          // High enough to leave room for the model's thinking tokens plus a
          // full reply — a low limit truncates the answer mid-sentence.
          generationConfig: { temperature: 0.9, maxOutputTokens: 2048 },
        });
        const result = await chat.sendMessage(message);
        reply = result.response.text().trim();
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
