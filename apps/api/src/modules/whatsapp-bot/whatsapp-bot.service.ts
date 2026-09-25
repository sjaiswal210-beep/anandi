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
  // The business WhatsApp number the bridge is scanned into. Env-driven so it
  // can be swapped without a code change. Defaults to the WhatsApp-ads number.
  readonly businessNumber: string;

  private readonly projectContext = `Tumhara naam Priya hai aur tum Anandi Park (Rich-Land Developers) ki sales executive ho — ek polite, warm, experienced ladki jo customers ko WhatsApp par plots ke baare mein guide karti hai.

# TUMHARA ROLE
- Tum ek REAL insaan ho, bot nahi. Kabhi mat bolna ki tum AI ya bot ho.
- Tumhara kaam hai plot bechna — har detail deke customer ko convince karna aur site visit karwana.
- LANGUAGE — MARATHI FIRST (bahut important):
  * DEFAULT language MARATHI hai (Roman script / Manglish). Chahe customer English ya Hindi mein likhe, tum PEHLE Marathi mein reply karo, jaise "Ho nakki! Anandi Park madhe plots uplabdha aahet. Tumhala kiti size cha plot pahije? 🙂".
  * Sirf tab dusri language use karo jab customer clearly bole ki usse Hindi/English mein baat karni hai, ya woh lagataar (2-3 baar) English/Hindi mein hi baat kare aur Marathi samajh na raha ho — tab uski language match karo.
  * Marathi Roman script mein likho (Manglish), pure Devanagari mein mat likhna.
- Bahut polite, respectful tone. Marathi: "Ho", "tumhi", "nakki", "dhanyawad", "kripaya". Hindi: "Ji", "aap", "bilkul".

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
- Contact number: +91 80071 07799.
- Location: GAT No. 279, Bakori, Wagholi-Bakori Road, Taluka Haveli, Pune (East Pune).
- MAP / LOCATION LINK (jab customer location, address, ya direction/map poochhe, yeh link bhejo): https://maps.google.com/?q=18.595755,74.04223
- Total 84 residential plots, sizes 1000 sq.ft se 4510 sq.ft tak.
- PRICE: Starting Rs 18 Lakh (all inclusive). 
  * 1000 sq.ft — Rs 18 Lakh se
  * 1500 sq.ft — Rs 27 Lakh se
  * 2000 sq.ft — Rs 36 Lakh se
  * 3000+ sq.ft (corner/road-facing premium) — Rs 54 Lakh se
- Roads: 30 aur 40 feet wide internal roads.
- Amenities: municipal (mahanagarpalika) limits ke andar, PMPL bus stand samorch plots, hospital & market javadch, gated layout, compound wall, 30 feet cement concrete road, 24-hour electricity, drainage line, independent transformer, children play area, security + CCTV, street lights. (NOTE: central garden aur 24x7 water line ka mention MAT karo — yeh nahi hai.)
- Connectivity: Wagheshwar Temple 10 min, schools (Orchid, Wisdom World) 10 min, Pune-Nagar Highway 8 min, Kharadi IT hub 25 min, Pune Airport 30 min, proposed Ring Road 10 min.
- Payment plan: 10% booking, 40% agreement, 50% registration.
- Possession: Ready for registration. Site visit free hai, weekend bhi, pickup available.
- Website: anandipark.in

# LOAN — BAHUT IMPORTANT RULE
- Loan ke baare mein KABHI detail mat do. Loan process, EMI, down payment, bank names, interest rate, calculation — yeh kuch bhi mat samjhao.
- Jab bhi customer loan ya EMI ke baare mein poochhe, sirf itna bolo (customer ki language mein):
  * Hinglish: "Ji, loan ke details main aapko thodi der mein bhej deti hoon / bata deti hoon. 🙂"
  * Marathi: "Ho, loan chi mahiti mi tumhala thodyach velat kalavte. 🙂"
  * English: "Sure, I'll share the loan details with you shortly."
- Iske baad conversation ko aage badhao — plot size, site visit, ya customer ka naam/number confirm karo. Loan par ruko mat.

# DOCS — IMPORTANT
- KABHI mat bolo ki koi document nahi hai ya missing hai. Kisi bhi document ki kami ka zikr mat karo.
- Jab customer koi bhi document maange (NA order, title, 7/12 extract, ya koi aur), politely bolo (customer ki language mein) ki site visit par humari team saare documents aapko dikhayegi, share karegi aur detail mein discuss karegi — taaki aap sab kuch khud validate/verify kar sakein.
- Example (Marathi): "Sagle documents aapan site visit la sविस्तर dakhavto ani discuss karto — tithe tumhi sagle kagadpatra validate karu shakta. Kadhi visit thevu ya?"
- Hamesha document ki baat ko site visit ki taraf le jao. RERA ka claim mat karo, aur koi bhi jhooth mat bolo.

# INVESTMENT BENEFITS (customer ko samjhao jab woh investment/value poochhe)
Tum ek samajhdaar sales advisor ho jo customer ko plot ke fayde samjha sakti ho. NOTE: loan/EMI ke baare mein kabhi detail mat do (upar wala LOAN rule follow karo).

1) LAND APPRECIATION (sabse bada fayda):
- Zameen ki value badhti hai, ghar/flat purana hoke depreciate hota hai. Land limited hai.
- East Pune (Wagholi/Kharadi belt) mein pichhle kuch saalon mein zameen ki value tezi se badhi hai — Ring Road aur IT hubs ki wajah se.
- Bolo ki area fast-growing hai aur plot ki value aage badhne ki achhi sambhavna hai (hamesha bolo "estimate hai, guarantee nahi, market par depend karta hai"). Specific price ya rupee amount MAT batao.

2) RESALE / FUTURE BENEFIT:
- Ready residential plot, clear title — resale aasan hota hai flat ke comparison mein.
- Rental/lease ka option bhi future mein.

RULES:
- Koi bhi appreciation baat karte waqt clearly bolo ki yeh ESTIMATE hai, guaranteed return nahi.
- Price, rupee amount, loan, EMI — yeh numbers mat batao. Jhooth ya fake guarantee mat do.

# PROACTIVE SELLING (bahut important)
- Booking sirf 10% mein ho jati hai — yeh baar baar highlight karo taaki entry easy lage.
- FREE TVS Jupiter offer: har plot booking par ek TVS Jupiter FREE (limited period) — yeh offer proactively batao, yeh sabse bada hook hai.
- Idea bechna hai: "aaj book karo, aaj property aapki" — taaki customer ko lage ki yeh easy aur worth it hai.
- Loan/EMI KHUD SE mat push karo. Agar customer poochhe, toh sirf bolo "loan details thodi der mein bhej deti hoon" aur aage badho.
- Urgency halke se: corner aur road-facing plots limited hain, jaldi book karne ka fayda.
- Tone confident aur encouraging rakho, par pushy ya jhoothi nahi.

# CLOSING
Jab customer interested lage, site visit ka time poochho ya unka phone/naam confirm karke bolo ki humari team call karegi. Booking ke liye push karo but pushy mat lago.

Yaad rakho: customer ki language match karo (Hinglish default, Marathi agar woh Marathi mein baat kare), polite ladki ki tarah, har baar greeting nahi, sab detail do, aur plot bechna hai.`;

  constructor(private prisma: PrismaService, private configService: ConfigService) {
    this.vpsUrl = this.configService.get<string>('VPS_WHATSAPP_URL', 'http://147.93.169.183:8300');
    this.vpsSecret = this.configService.get<string>('VPS_WHATSAPP_SECRET', '');
    this.vpsBizId = this.configService.get<string>('VPS_WHATSAPP_BIZ_ID', 'anandi-park');
    // Number the WhatsApp bridge is logged in as (the WhatsApp-ads number).
    // Override on the VPS with WHATSAPP_BUSINESS_NUMBER=91XXXXXXXXXX if it changes.
    this.businessNumber = this.configService
      .get<string>('WHATSAPP_BUSINESS_NUMBER', '918007107799')
      .replace(/[^0-9]/g, '');
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
    // Resolve to a REAL workspace row. The VPS bridge passes its biz id
    // (VPS_WHATSAPP_BIZ_ID = "anandi-park"), which is NOT a workspace id — using
    // it caused every inbound lead to be silently dropped (owner lookup found no
    // user, so the create was skipped). So: only trust workspaceId if a matching
    // Workspace actually exists; otherwise fall back to the first workspace.
    let resolvedWorkspaceId: string | undefined;
    if (workspaceId) {
      const exists = await this.prisma.workspace
        .findUnique({ where: { id: workspaceId }, select: { id: true } })
        .catch(() => null);
      resolvedWorkspaceId = exists?.id;
    }
    if (!resolvedWorkspaceId) {
      const firstWorkspace = await this.prisma.workspace.findFirst().catch(() => null);
      resolvedWorkspaceId = firstWorkspace?.id;
      if (workspaceId && workspaceId !== resolvedWorkspaceId) {
        this.logger.warn(
          `Inbound WhatsApp workspaceId "${workspaceId}" is not a real workspace; ` +
            `falling back to "${resolvedWorkspaceId}".`,
        );
      }
    }
    // If the DB is momentarily unreachable (Neon auto-suspend / 57P01), fall
    // back to the hardcoded workspace so we can STILL generate + send a reply.
    // The bot must never go silent just because a DB read blipped.
    if (!resolvedWorkspaceId) {
      resolvedWorkspaceId = 'cmsai8kh50001rapl8ioxehxe';
      this.logger.warn('Workspace lookup failed (DB blip?); using fallback workspace id for reply.');
    }

    // Persist the incoming message first so conversation context builds up.
    if (resolvedWorkspaceId) {
      await this.prisma.whatsAppMessage.create({
        data: {
          workspaceId: resolvedWorkspaceId, from, to: this.businessNumber, type: 'text',
          content: { text: { body: message } } as any,
          direction: 'incoming', status: 'received',
        },
      }).catch(() => undefined);
    }

    const history = await this.prisma.whatsAppMessage.findMany({
      where: { OR: [{ from }, { to: from }] }, orderBy: { createdAt: 'asc' }, take: 20,
    }).catch(() => [] as any[]);
    const phone = from.startsWith('91') ? from.slice(2) : from;
    let lead = await this.prisma.lead.findFirst({
      where: { OR: [{ phone }, { phone: from }, { phone: `+91${phone}` }] },
    }).catch(() => null);

    // Capture the lead if this number is new. This is what makes Click-to-WhatsApp
    // ads actually generate CRM leads: the ad opens a chat, the first message
    // lands here, and we file it. detectAdReferral tags the source so paid
    // WhatsApp leads are attributable in the ads dashboard.
    if (!lead && resolvedWorkspaceId) {
      const referral = this.detectAdReferral(message);
      const owner = await this.prisma.user.findFirst({
        where: { workspaces: { some: { workspaceId: resolvedWorkspaceId } } },
        select: { id: true },
      }).catch(() => null);
      if (owner) {
        lead = await this.prisma.lead
          .create({
            data: {
              workspaceId: resolvedWorkspaceId,
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
          .catch((e: any) => {
            // Don't crash the reply flow, but DO log — a dropped lead was
            // previously invisible.
            this.logger.error(`Failed to create WhatsApp lead for ${phone}: ${e?.message || e}`);
            return null;
          });
        if (lead) {
          this.logger.log(`New WhatsApp lead captured: ${phone} (${referral ? 'CTWA ad' : 'organic'})`);
        }
      } else {
        this.logger.error(
          `No user found for workspace "${resolvedWorkspaceId}" — cannot attribute WhatsApp lead ${phone}.`,
        );
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
      await this.prisma.lead.update({ where: { id: lead.id }, data: { score: Math.min(100, (lead.score || 0) + 20), tags: { push: 'hot-lead' } } }).catch(() => undefined);
    }
    if (resolvedWorkspaceId) {
      await this.prisma.whatsAppMessage.create({ data: { workspaceId: resolvedWorkspaceId, from: this.businessNumber, to: from, type: 'text', content: { text: { body: reply } } as any, direction: 'outgoing', status: 'sent' } }).catch(() => undefined);
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
    const messages = await this.prisma.whatsAppMessage.findMany({ where: { workspaceId }, orderBy: { createdAt: 'desc' }, take: 500 });
    const contactMap = new Map<string, any>();
    messages.forEach((m: any) => {
      const contact = m.direction === 'incoming' ? m.from : m.to;
      if (contact === this.businessNumber) return; // skip our own number as a "contact"
      if (!contactMap.has(contact)) contactMap.set(contact, { messages: 0, lastMessage: (m.content as any)?.text?.body?.slice(0, 60) || '', lastTime: m.createdAt, intent: 'WARM' });
      contactMap.get(contact)!.messages++;
    });
    return Array.from(contactMap.entries()).map(([phone, data]) => ({ phone, ...data }));
  }

  /** Full message thread for one contact (both directions), oldest first. */
  async getConversationMessages(workspaceId: string, phone: string) {
    const digits = (phone || '').replace(/[^0-9]/g, '');
    const messages = await this.prisma.whatsAppMessage.findMany({
      where: {
        workspaceId,
        OR: [{ from: phone }, { to: phone }, { from: digits }, { to: digits }],
      },
      orderBy: { createdAt: 'asc' },
      take: 500,
    });
    return messages.map((m: any) => ({
      id: m.id,
      direction: m.direction, // 'incoming' (customer) | 'outgoing' (Priya/bot)
      text: (m.content as any)?.text?.body || '',
      status: m.status,
      at: m.createdAt,
    }));
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

  /**
   * Logs out / resets the current WhatsApp session on the bridge so a NEW number
   * can be scanned. Tries the common bridge routes (logout, then session
   * DELETE) — whichever the bridge supports. After this, call startVpsSession()
   * to get a fresh QR.
   */
  async logoutVpsSession() {
    const headers = { 'X-Wa-Secret': this.vpsSecret };
    const attempts = [
      () => axios.post(`${this.vpsUrl}/session/${this.vpsBizId}/logout`, {}, { headers, timeout: 15000 }),
      () => axios.delete(`${this.vpsUrl}/session/${this.vpsBizId}`, { headers, timeout: 15000 }),
      () => axios.post(`${this.vpsUrl}/session/${this.vpsBizId}/reset`, {}, { headers, timeout: 15000 }),
    ];
    const errors: string[] = [];
    for (const attempt of attempts) {
      try {
        const res = await attempt();
        this.logger.log('WhatsApp session logged out on the bridge.');
        return { ok: true, data: res.data };
      } catch (e: any) {
        errors.push(e?.response?.status ? `${e.response.status}` : e.message);
      }
    }
    return {
      ok: false,
      message:
        'Could not log out via the bridge API (tried /logout, DELETE, /reset). ' +
        'The bridge may need a manual restart with session data cleared on the VPS.',
      tried: errors,
    };
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
