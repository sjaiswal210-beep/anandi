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
- NEXT-STEP SAWAAL — HAR MESSAGE MEIN NAHI: customer jo poochhe uska seedha, pura jawab do. Har reply ke end mein kuch maangna ZARURI NAHI hai — agar customer ne sirf ek simple sawaal poocha hai (jaise price, size, location), toh sirf jawab do aur chhodo, khali follow-up ke liye mat poochho.
  * Jab natural lage tabhi ek halka next-step sawaal daalo (size, budget, naam, ya visit) — lekin yeh sirf kabhi-kabhi (jaise har 2-3 messages mein ek baar), har reply mein NAHI.
  * SITE VISIT sirf tab suggest karo jab customer clearly interested lage (price/booking/visit ki baat kare) — har message mein site visit mat maango, yeh pushy lagta hai.
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
- Jab customer koi bhi document maange (NA order, title, 7/12 extract, ya koi aur), politely bolo (customer ki language mein) ki humari team saare documents share karegi aur detail mein discuss karegi, taaki woh sab kuch khud validate/verify kar sakein. Site visit ek option hai documents dekhne ke liye, lekin har baar zabardasti visit mat bolo — natural lage tab hi mention karo.
- Example (Marathi): "Sagle documents aamhi tumhala sविस्तर dakhavto ani discuss karto, taaki tumhi validate karu shakta."
- RERA ka claim mat karo, aur koi bhi jhooth mat bolo.

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
Jab customer clearly interested lage (price/booking discuss kar raha ho, ya khud visit/call maange), tabhi site visit ka time poochho ya unka phone/naam confirm karke bolo ki humari team call karegi. Yeh sirf tab karo jab natural lage — har message ke end mein mat karo, warna pushy aur robotic lagta hai.

Yaad rakho: customer ki language match karo (Hinglish default, Marathi agar woh Marathi mein baat kare), polite ladki ki tarah, har baar greeting nahi, sab detail do, aur plot bechna hai — lekin ek real insaan jaisi natural baat-cheet karo, har reply mein kuch na kuch maango mat.`;

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

  /**
   * Normalizes a raw WhatsApp sender id into something usable for CRM.
   *
   * The bridge can hand us several JID shapes:
   *   - "919876543210@s.whatsapp.net" / "919876543210@c.us"  → a real phone
   *   - "24004639338554@lid"                                 → a privacy-masked
   *     "linked id" (Meta's anti-enumeration identifier). This is NOT a phone
   *     number and the real MSISDN is intentionally hidden; it cannot be
   *     reversed on our side. Previously we stored this whole "...@lid" string
   *     in Lead.phone, which is why the dashboard showed garbage like
   *     "24004639338554@lid".
   *   - "...@g.us"                                           → a group id
   *
   * Returns a clean phone (digits, no country-code assumption stripped yet),
   * the lid when the sender is privacy-masked, and whether it is a lid.
   */
  normalizeWhatsAppId(raw: string): { phone: string; lid?: string; isLid: boolean } {
    const value = (raw || '').trim();
    const atIdx = value.indexOf('@');
    const local = atIdx >= 0 ? value.slice(0, atIdx) : value;
    const domain = atIdx >= 0 ? value.slice(atIdx + 1).toLowerCase() : '';

    // A privacy-masked linked id — no real phone is recoverable here.
    if (domain === 'lid') {
      return { phone: '', lid: local.replace(/[^0-9]/g, ''), isLid: true };
    }

    // Normal phone-bearing JID (or already-bare digits): keep digits only.
    const digits = local.replace(/[^0-9]/g, '');
    return { phone: digits, isLid: false };
  }

  /**
   * Tries to pull an Indian mobile number out of free-text a customer typed,
   * e.g. "mera number 98765 43210 hai" or "+91 9876543210". Returns the clean
   * 10-digit national number, or null if none found. Used to backfill the
   * phone for privacy-masked (@lid) leads whose real number WhatsApp hides —
   * the number the person types in chat IS a real, reachable number.
   */
  extractIndianPhone(text: string): string | null {
    if (!text) return null;
    // Collapse spaces/dashes/dots between digits so "98765 43210" is seen as one run.
    const squashed = text.replace(/(?<=\d)[\s().-]+(?=\d)/g, '');
    // Find digit runs; accept an optional 91/0 prefix on a 10-digit mobile.
    const matches = squashed.match(/(?:\+?91|0)?[6-9]\d{9}/g);
    if (!matches || matches.length === 0) return null;
    for (const m of matches) {
      const d = m.replace(/[^0-9]/g, '');
      const national = d.length > 10 ? d.slice(-10) : d;
      // Valid Indian mobile: 10 digits starting 6-9.
      if (/^[6-9]\d{9}$/.test(national)) return national;
    }
    return null;
  }

  async handleIncomingMessage(
    from: string,
    message: string,
    workspaceId?: string,
    opts?: { senderPn?: string },
  ) {
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

    // Figure out who this is. A "@lid" sender is privacy-masked — there is no
    // real phone in the id itself. But if the bridge resolved the real number
    // (senderPn / lid->pn mapping) and passed it along, use that so the lead
    // gets a real, reachable phone from message one.
    const sender = this.normalizeWhatsAppId(from);
    const resolved = opts?.senderPn ? this.normalizeWhatsAppId(opts.senderPn) : null;

    // The lid (if any) is always remembered for dedup, even once we know the
    // real number.
    const knownLid = sender.isLid ? sender.lid : undefined;
    // Effective phone: prefer a bridge-resolved real number over the @lid.
    const effectivePhone = sender.isLid
      ? (resolved && !resolved.isLid ? resolved.phone : '')
      : sender.phone;
    const haveRealPhone = Boolean(effectivePhone);
    // National phone (strip leading 91 country code) for display + matching.
    const nationalPhone = effectivePhone.startsWith('91') ? effectivePhone.slice(2) : effectivePhone;

    // Match an existing lead by lid first (stable across privacy mode), then by
    // phone when we have one.
    let lead =
      (knownLid
        ? await this.prisma.lead
            .findFirst({ where: { customFields: { path: ['waLid'], equals: knownLid } } })
            .catch(() => null)
        : null) ||
      (haveRealPhone
        ? await this.prisma.lead
            .findFirst({ where: { OR: [{ phone: nationalPhone }, { phone: effectivePhone }, { phone: `+91${nationalPhone}` }] } })
            .catch(() => null)
        : null);

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
        // We store a real phone when we have one (bridge-resolved or normal
        // sender). If the sender is @lid and the bridge did NOT resolve a
        // number, phone stays empty and we track them by waLid + mark
        // "number-hidden" so the dashboard shows a clean label, not "...@lid".
        const numberHidden = !haveRealPhone;
        const displayName = haveRealPhone
          ? `WhatsApp ${nationalPhone.slice(-4)}`
          : `WhatsApp contact ${(knownLid || '').slice(-4)}`;
        const logId = haveRealPhone ? nationalPhone : `lid:${knownLid}`;

        lead = await this.prisma.lead
          .create({
            data: {
              workspaceId: resolvedWorkspaceId,
              createdById: owner.id,
              name: displayName,
              phone: haveRealPhone ? nationalPhone : '',
              source: 'WHATSAPP',
              status: 'NEW',
              tags: [
                'whatsapp',
                referral ? 'ctwa-ad' : 'whatsapp-inbound',
                ...(numberHidden ? ['number-hidden'] : []),
              ],
              customFields: {
                firstMessage: message,
                capturedVia: referral ? 'click_to_whatsapp_ad' : 'whatsapp_inbound',
                capturedAt: new Date().toISOString(),
                // Raw routing id so replies still reach them and we can dedup.
                waId: from,
                // Always remember the lid for dedup, even once the number is known.
                ...(knownLid ? { waLid: knownLid } : {}),
                ...(numberHidden ? { numberHidden: true } : {}),
              },
            },
          })
          .catch((e: any) => {
            // Don't crash the reply flow, but DO log — a dropped lead was
            // previously invisible.
            this.logger.error(`Failed to create WhatsApp lead for ${logId}: ${e?.message || e}`);
            return null;
          });
        if (lead) {
          this.logger.log(`New WhatsApp lead captured: ${logId} (${referral ? 'CTWA ad' : 'organic'})`);
        }
      } else {
        this.logger.error(
          `No user found for workspace "${resolvedWorkspaceId}" — cannot attribute WhatsApp lead ${haveRealPhone ? nationalPhone : `lid:${knownLid}`}.`,
        );
      }
    }

    // If the bridge resolved the real number for an existing lid-only lead that
    // was previously "number hidden", backfill it now.
    if (lead && haveRealPhone && (!lead.phone || /@/.test(lead.phone))) {
      const existingCf = (lead.customFields as any) || {};
      const updated = await this.prisma.lead
        .update({
          where: { id: lead.id },
          data: {
            phone: nationalPhone,
            name: lead.name?.startsWith('WhatsApp contact ') ? `WhatsApp ${nationalPhone.slice(-4)}` : lead.name,
            tags: Array.from(new Set([...(lead.tags || []).filter((t: string) => t !== 'number-hidden'), 'number-captured'])),
            customFields: { ...existingCf, numberHidden: false, phoneResolvedFromBridge: true, phoneResolvedAt: new Date().toISOString() },
          },
        })
        .catch((e: any) => {
          this.logger.error(`Failed to backfill bridge-resolved phone for lead ${lead!.id}: ${e?.message || e}`);
          return null;
        });
      if (updated) {
        lead = updated;
        this.logger.log(`Backfilled bridge-resolved phone ${nationalPhone} for lead ${lead.id}.`);
      }
    }

    // Number backfill: WhatsApp hides the real phone of @lid senders, but the
    // moment the customer types a number in chat we capture it. This turns a
    // "number hidden" lead into a reachable one with no bridge changes.
    if (lead && (!lead.phone || /@/.test(lead.phone))) {
      const typed = this.extractIndianPhone(message);
      if (typed) {
        const existingCf = (lead.customFields as any) || {};
        const updated = await this.prisma.lead
          .update({
            where: { id: lead.id },
            data: {
              phone: typed,
              // Drop the "number-hidden" tag now that we have a real number.
              tags: Array.from(new Set([...(lead.tags || []).filter((t: string) => t !== 'number-hidden'), 'number-captured'])),
              customFields: { ...existingCf, numberHidden: false, phoneCapturedFromChat: true, phoneCapturedAt: new Date().toISOString() },
            },
          })
          .catch((e: any) => {
            this.logger.error(`Failed to backfill phone for lead ${lead!.id}: ${e?.message || e}`);
            return null;
          });
        if (updated) {
          lead = updated;
          this.logger.log(`Captured phone ${typed} from chat for lead ${lead.id} (was number-hidden).`);
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
    const numberStillHidden = Boolean(lead) && (!lead!.phone || /@/.test(lead!.phone));
    const leadNote = lead
      ? `\n\n# IS CUSTOMER KE BAARE MEIN (pehle se maloom)\nNaam: ${lead.name || 'unknown'}` +
        (lead.budget ? `\nBudget: Rs ${lead.budget}` : '') +
        (lead.preferredPropertyType ? `\nInterest: ${lead.preferredPropertyType}` : '') +
        `\nStatus: ${lead.status}` +
        ((lead.customFields as any)?.message ? `\nPehle bataya: ${(lead.customFields as any).message}` : '') +
        `\nInhe naam se address karo aur jo pehle discuss ho chuka hai woh dobara mat poochho.` +
        // WhatsApp hid this contact's number — get a callback number politely so
        // our team can reach them. Once they type it, we capture it automatically.
        (numberStillHidden
          ? `\n\n# IMPORTANT: Is customer ka phone number abhi hamare paas nahi hai. Baat-cheet ke beech mein ek baar politely unka contact/callback number maang lo (jaise: "Humari team aapko call karke saari details de — aapka contact number bata dijiye?"). Pushy mat bano, ek hi baar maango.`
          : '')
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

  /**
   * Sends ONE message with optional media (image + document) to a single number.
   * Tries the bridge's media endpoint if mediaUrls are given; if the bridge has
   * no media route (or it fails), falls back to a text message that includes the
   * public links so the content still reaches the customer. Returns { sent, via }.
   */
  async sendMessageWithMedia(
    to: string,
    message: string,
    media?: { imageUrl?: string; documentUrl?: string },
  ): Promise<{ sent: boolean; via: 'media' | 'text'; error?: string }> {
    const phone = to.replace(/[^0-9]/g, '');
    const headers = { 'X-Wa-Secret': this.vpsSecret };
    const hasMedia = Boolean(media?.imageUrl || media?.documentUrl);

    if (hasMedia) {
      // Attempt a media send against common bridge route shapes. If the bridge
      // doesn't support any of them, we fall through to text+links below.
      const attachments = [media?.imageUrl, media?.documentUrl].filter(Boolean) as string[];
      const payloads = [
        { url: `${this.vpsUrl}/session/${this.vpsBizId}/send-media`, body: { to: phone, message, media: attachments } },
        { url: `${this.vpsUrl}/session/${this.vpsBizId}/sendMedia`, body: { to: phone, caption: message, urls: attachments } },
        { url: `${this.vpsUrl}/session/${this.vpsBizId}/send`, body: { to: phone, message, mediaUrl: media?.imageUrl, documentUrl: media?.documentUrl } },
      ];
      for (const p of payloads) {
        try {
          const res = await axios.post(p.url, p.body, { headers, timeout: 45000 });
          if (res.data && !res.data.error) {
            return { sent: true, via: 'media' };
          }
        } catch {
          // try next shape
        }
      }
      // Bridge has no working media route — fall back to text + links.
      const links = [
        media?.imageUrl ? `📷 Photo: ${media.imageUrl}` : '',
        media?.documentUrl ? `📄 Details: ${media.documentUrl}` : '',
      ].filter(Boolean).join('\n');
      const textWithLinks = `${message}\n\n${links}`.trim();
      const r: any = await this.sendViaVps(phone, textWithLinks);
      return { sent: Boolean(r?.sent) || !r?.error, via: 'text', error: r?.error };
    }

    const r: any = await this.sendViaVps(phone, message);
    return { sent: Boolean(r?.sent) || !r?.error, via: 'text', error: r?.error };
  }

  async getVpsHealth() {
    try { const res = await axios.get(`${this.vpsUrl}/health`, { timeout: 5000 }); return res.data; }
    catch (e: any) { return { status: 'offline', error: e.message }; }
  }
}
