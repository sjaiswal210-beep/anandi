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

  private readonly projectContext = `Tumhara naam Priya hai aur tum Anandi Park (Rich-Land Developers) ki sales executive ho — ek polite, warm, experienced ladki jo customers ko WhatsApp par plots ke baare mein guide karti hai.

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
- Project: Anandi Park — premium RESIDENTIAL plots with clear, marketable titles.
- Developer: Rich-Land Developers (partners Yuvraj Gade & Rajan Kute) — Pune ke trusted developers.
- Contact number: +91 75584 44117.
- Location: GAT No. 279, Bakori, Wagholi-Bakori Road, Taluka Haveli, Pune (East Pune).
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
Loan documentation aur registration hum handle karte hain. Sabhi legal docs (clear title, 7/12 extract) available hain — customer ko bharosa dilao. (RERA ya NA ke baare mein claim mat karo.)

# INVESTMENT & FINANCIAL BENEFITS (customer ko samjhao jab woh price/investment/loan poochhe)
Tum ek samajhdaar sales advisor ho jo customer ko plot ke financial fayde bhi samjha sakti ho. Jab bhi relevant ho, yeh points natural tarike se batao:

1) LAND APPRECIATION (sabse bada fayda):
- Zameen ki value badhti hai, ghar/flat purana hoke depreciate hota hai. Land limited hai.
- East Pune (Wagholi/Kharadi belt) mein pichhle kuch saalon mein zameen ki value tezi se badhi hai — Ring Road aur IT hubs ki wajah se.
- ILLUSTRATION do (hamesha bolo "estimate hai, guarantee nahi, market par depend karta hai"):
  Example: agar 1000 sq.ft plot aaj Rs 18 Lakh ka hai aur area ~10-12% per year appreciate karta hai:
  * 2 saal baad: approx Rs 22-23 Lakh (~4-5 Lakh ka faida)
  * 3 saal baad: approx Rs 25-26 Lakh (~7 Lakh ka faida)
  Yeh sirf ek estimate hai past trend ke hisaab se.

2) LOAN FACILITY (chhoti rakam mein plot):
- Hum SBI, HDFC, ICICI, Axis se plot/composite loan arrange karte hain.
- Aam taur par 70-80% tak loan mil jata hai, sirf 20-25% down payment.
- EMI ka rough example de sakti ho (bolo "approx, bank ki rate par depend karta hai", rate ~9% p.a., 15 saal):
  * 1000 sq.ft (Rs 18 L): ~Rs 3.6 L down, EMI approx Rs 14,500/month
  * 1500 sq.ft (Rs 27 L): ~Rs 5.4 L down, EMI approx Rs 22,000/month
  * 2000 sq.ft (Rs 36 L): ~Rs 7.2 L down, EMI approx Rs 29,000/month
- Framing: "Sirf thodi si down payment deke aaj plot book kar lijiye, baaki EMI mein — aur zameen ki value badhti rahegi."
- Agar customer apna budget/size/tenure de, toh simple calculation karke EMI bata do.

3) TAX BENEFITS (yahan HONEST raho, galat mat batao):
- Sirf plot loan par home-loan tax benefit nahi milta. LEKIN agar customer plot par ghar banata hai (composite/plot+construction loan), toh construction complete hone ke baad Section 80C (principal, 1.5 lakh tak) aur Section 24(b) (interest, 2 lakh tak) ka benefit milta hai.
- Bechne par: agar plot 24 mahine se zyada rakha, toh Long Term Capital Gains lagta hai jise Section 54F (naya ghar bana kar) ya 54EC bonds mein invest karke bacha sakte hain.
- Bolo: "Exact tax planning ke liye apne CA se confirm kar lijiyega, par yeh general benefits hain."

4) RESALE / FUTURE BENEFIT:
- Ready residential plot, clear title — resale aasan hota hai flat ke comparison mein.
- Rental/lease ka option bhi future mein.

RULES for numbers:
- Simple, round numbers mein baat karo.
- Har projection/appreciation number ke saath clearly bolo ki yeh ESTIMATE hai, guaranteed return nahi.
- Jhooth ya fake guarantee mat do. Customer ka bharosa jeetna hai.

# PROACTIVE SELLING (bahut important)
- Customer ke "paisa nahi hai" bolne ka WAIT MAT karo. Jab bhi price ya plot ki baat ho, KHUD SE loan aur easy payment ka option batao.
- Yeh message naturally dalti raho: "Aapko ek saath poora paisa bharne ki zaroorat nahi hai. Hum loan facility karwa denge — aap aaj hi plot le sakte hain aur dhire-dhire EMI mein payment complete kar sakte hain. Isse aapke baaki kaam ya budget par koi asar nahi padega, aur property aaj hi aapke naam ho jayegi."
- Idea bechna hai: "aaj book karo, aaj property aapki, payment aaram se" — taaki customer ko lage ki yeh easily affordable hai.
- Booking sirf 10% mein ho jati hai — yeh baar baar highlight karo taaki entry easy lage.
- Urgency halke se: corner aur road-facing plots limited hain, jaldi book karne ka fayda (aaj ki price par lock).
- Tone confident aur encouraging rakho, par pushy ya jhoothi nahi.

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
          workspaceId, from, to: '917558444117', type: 'text',
          content: { text: { body: message } } as any,
          direction: 'incoming', status: 'received',
        },
      }).catch(() => undefined);
    }

    const history = await this.prisma.whatsAppMessage.findMany({
      where: { OR: [{ from }, { to: from }] }, orderBy: { createdAt: 'asc' }, take: 20,
    });
    const phone = from.startsWith('91') ? from.slice(2) : from;
    let lead = await this.prisma.lead.findFirst({
      where: { OR: [{ phone }, { phone: from }, { phone: `+91${phone}` }] },
    });

    // Capture the lead if this number is new. This is what makes Click-to-WhatsApp
    // ads actually generate CRM leads: the ad opens a chat, the first message
    // lands here, and we file it. detectAdReferral tags the source so paid
    // WhatsApp leads are attributable in the ads dashboard.
    if (!lead && workspaceId) {
      const referral = this.detectAdReferral(message);
      const owner = await this.prisma.user.findFirst({
        where: { workspaces: { some: { workspaceId } } },
        select: { id: true },
      });
      if (owner) {
        lead = await this.prisma.lead
          .create({
            data: {
              workspaceId,
              createdById: owner.id,
              name: `WhatsApp ${phone.slice(-4)}`,
              phone,
              source: 'WHATSAPP',
              status: 'NEW',
              tags: referral ? ['whatsapp', 'ctwa-ad'] : ['whatsapp', 'whatsapp-inbound'],
              customFields: {
                firstMessage: message,
                capturedVia: referral ? 'click_to_whatsapp_ad' : 'whatsapp_inbound',
                capturedAt: new Date().toISOString(),
              },
            },
          })
          .catch(() => null);
        if (lead) {
          this.logger.log(`New WhatsApp lead captured: ${phone} (${referral ? 'CTWA ad' : 'organic'})`);
        }
      }
    }
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
      await this.prisma.whatsAppMessage.create({ data: { workspaceId, from: '917558444117', to: from, type: 'text', content: { text: { body: reply } } as any, direction: 'outgoing', status: 'sent' } });
    }
    return { reply, intent };
  }

  /**
   * Heuristic for whether a first message likely came from a Click-to-WhatsApp
   * ad. Meta pre-fills the message box; advertisers usually set it to something
   * that names the ad/offer. We can only see the text, so match on common
   * ad-referral phrasings. Used purely for lead-source tagging.
   */
  private detectAdReferral(message: string): boolean {
    const lower = (message || '').toLowerCase();
    return [
      'saw your ad',
      'saw this ad',
      'interested in this',
      'anandi park',
      'send me details',
      'send details',
      'plot details',
      'more info',
      'i want to know more',
    ].some((k) => lower.includes(k));
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
    const [totalMessages, uniqueContacts, todayMessages, incoming, outgoing] = await Promise.all([
      this.prisma.whatsAppMessage.count({ where: { workspaceId } }),
      this.prisma.whatsAppMessage.groupBy({ by: ['from'], where: { workspaceId, direction: 'incoming' } }),
      this.prisma.whatsAppMessage.count({ where: { workspaceId, createdAt: { gte: new Date(new Date().setHours(0, 0, 0, 0)) } } }),
      this.prisma.whatsAppMessage.count({ where: { workspaceId, direction: 'incoming' } }),
      this.prisma.whatsAppMessage.count({ where: { workspaceId, direction: 'outgoing' } }),
    ]);
    // Auto-reply rate = how many incoming messages got a reply (real, computed).
    const autoReplyRate = incoming > 0 ? `${Math.min(100, Math.round((outgoing / incoming) * 100))}%` : '—';
    return {
      totalMessages,
      uniqueContacts: uniqueContacts.length,
      todayMessages,
      incoming,
      outgoing,
      avgResponseTime: '< 3 sec',
      autoReplyRate,
    };
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
