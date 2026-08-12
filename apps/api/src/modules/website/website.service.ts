import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { WhatsAppBotService } from '../whatsapp-bot/whatsapp-bot.service';

@Injectable()
export class WebsiteService {
  private readonly logger = new Logger(WebsiteService.name);

  constructor(
    private prisma: PrismaService,
    private whatsapp: WhatsAppBotService,
  ) {}

  async getConfig(workspaceId: string) {
    return this.prisma.website.findFirst({ where: { workspaceId } });
  }

  async createOrUpdate(workspaceId: string, dto: {
    name: string;
    domain?: string;
    subdomain?: string;
    template?: string;
    config?: Record<string, unknown>;
    seoConfig?: Record<string, unknown>;
    pages?: unknown[];
  }) {
    const existing = await this.prisma.website.findFirst({ where: { workspaceId } });

    if (existing) {
      return this.prisma.website.update({
        where: { id: existing.id },
        data: {
          name: dto.name,
          domain: dto.domain,
          subdomain: dto.subdomain,
          template: dto.template,
          config: dto.config as never,
          seoConfig: dto.seoConfig as never,
          pages: dto.pages as never,
        },
      });
    }

    return this.prisma.website.create({
      data: {
        workspace: { connect: { id: workspaceId } },
        name: dto.name,
        domain: dto.domain,
        subdomain: dto.subdomain,
        template: dto.template || 'default',
        config: dto.config as never || {},
        seoConfig: dto.seoConfig as never || {},
        pages: dto.pages as never || [],
      },
    });
  }

  async publish(workspaceId: string) {
    const website = await this.prisma.website.findFirst({ where: { workspaceId } });
    if (!website) throw new NotFoundException('Website not configured');

    return this.prisma.website.update({
      where: { id: website.id },
      data: { isPublished: true, publishedAt: new Date() },
    });
  }

  async unpublish(workspaceId: string) {
    const website = await this.prisma.website.findFirst({ where: { workspaceId } });
    if (!website) throw new NotFoundException('Website not configured');

    return this.prisma.website.update({
      where: { id: website.id },
      data: { isPublished: false },
    });
  }

  async getPublicWebsite(subdomain: string) {
    const website = await this.prisma.website.findFirst({
      where: { subdomain, isPublished: true },
      include: {
        workspace: {
          select: {
            name: true,
            logo: true,
            properties: {
              where: { status: 'AVAILABLE', publishedAt: { not: null } },
              select: {
                id: true, title: true, slug: true, type: true, price: true,
                area: true, bedrooms: true, bathrooms: true, city: true,
                media: { take: 1 },
              },
              take: 20,
              orderBy: { createdAt: 'desc' },
            },
            projects: {
              where: { status: 'active' },
              select: { id: true, name: true, slug: true, city: true, totalUnits: true, availableUnits: true },
            },
          },
        },
      },
    });

    if (!website) throw new NotFoundException('Website not found');
    return website;
  }

  async submitInquiry(subdomain: string, dto: {
    name: string;
    phone: string;
    email?: string;
    message?: string;
    propertyId?: string;
    source?: string;
    config?: string;
  }) {
    // Resolve the workspace. Prefer a published site matching the subdomain,
    // but fall back to the first workspace so the form always works even
    // before a Website record is configured. This is a single-project setup.
    const website = await this.prisma.website.findFirst({
      where: { subdomain },
    });

    const workspaceId =
      website?.workspaceId ||
      (await this.prisma.workspace.findFirst({ select: { id: true } }))?.id;

    if (!workspaceId) {
      throw new NotFoundException('No workspace configured');
    }

    if (!dto.name?.trim() || !dto.phone?.trim()) {
      return { success: false, message: 'Name and phone are required' };
    }

    const admin = await this.prisma.user.findFirst({
      where: {
        workspaces: { some: { workspaceId } },
        role: { in: ['SUPER_ADMIN', 'BUILDER', 'SALES_MANAGER'] },
      },
    });

    const createdById =
      admin?.id ||
      (await this.prisma.user.findFirst({ where: { workspaces: { some: { workspaceId } } } }))?.id;

    if (!createdById) {
      throw new NotFoundException('No user to attribute the lead to');
    }

    const phone = dto.phone.replace(/[^\d]/g, '').replace(/^91(?=\d{10}$)/, '');

    // Dedupe: if this phone already exists, append a note instead of duplicating.
    const existing = await this.prisma.lead.findFirst({
      where: { workspaceId, phone },
      select: { id: true },
    });

    if (existing) {
      await this.prisma.lead.update({
        where: { id: existing.id },
        data: {
          customFields: {
            message: dto.message,
            config: dto.config,
            repeatInquiry: true,
            lastInquiryAt: new Date().toISOString(),
            inquirySource: dto.source || 'project_website',
          },
        },
      });

      // Fire-and-forget: the visitor should never wait on WhatsApp delivery.
      void this.startWhatsAppFlow(workspaceId, dto.name, phone, true);

      return { success: true, message: 'Inquiry submitted successfully', duplicate: true };
    }

    const tags = ['website', 'anandi-park'];
    if (dto.source && dto.source !== 'project_website') tags.push(dto.source);

    await this.prisma.lead.create({
      data: {
        workspaceId,
        createdById,
        name: dto.name.trim(),
        phone,
        email: dto.email?.trim() || undefined,
        source: 'WEBSITE',
        status: 'NEW',
        tags,
        customFields: {
          message: dto.message,
          config: dto.config,
          propertyId: dto.propertyId,
          inquirySource: dto.source || 'project_website',
          submittedAt: new Date().toISOString(),
        },
      },
    });

    void this.startWhatsAppFlow(workspaceId, dto.name, phone, false);

    return { success: true, message: 'Inquiry submitted successfully' };
  }

  /**
   * Opening WhatsApp message from Priya. Keeps the same persona and the same
   * hard rules as the bot prompt: Hinglish, no RERA claim, plots described as
   * residential, price from Rs 18 Lakh, proactive about loan/EMI.
   */
  private buildWelcomeMessage(name: string, isRepeat: boolean): string {
    const firstName = name.trim().split(/\s+/)[0] || 'ji';

    if (isRepeat) {
      return (
        `Namaste ${firstName} ji 🙂 Priya again, Anandi Park se.\n\n` +
        `Aapki dobara inquiry mili hai — dhanyawad! Batayiye aapko kitne size ka plot ` +
        `dekhna hai, main aaj hi availability aur EMI detail bhej deti hoon.\n\n` +
        `Site visit free hai, weekend bhi — pickup bhi arrange kar dete hain 🏡`
      );
    }

    return (
      `Namaste ${firstName} ji 🙂 Main Priya bol rahi hoon Anandi Park se — ` +
      `Bakori, Wagholi-Bakori Road (Pune East). Aapki website inquiry mil gayi, dhanyawad!\n\n` +
      `Yahan 84 residential plots hain, 1000 se 4510 sq.ft tak. Price Rs 18 Lakh se ` +
      `(all inclusive), clear title, gated layout aur 30-40 feet wide roads.\n\n` +
      `Aur ek achhi baat — poora paisa ek saath dene ki zaroorat nahi. Booking sirf 10% ` +
      `mein ho jati hai, aur hum SBI, HDFC, ICICI, Axis se loan bhi arrange kar dete hain.\n\n` +
      `Aapko kitne size ka plot chahiye? Main aapke liye best option aur EMI detail bhej deti hoon 🏡`
    );
  }

  /**
   * Sends the opening WhatsApp message and records it, so the conversation shows
   * up in the dashboard AND lands in the bot's history. The history part matters:
   * handleIncomingMessage reads past messages to decide whether to greet, so
   * persisting this greeting is what stops Priya greeting the customer twice.
   */
  private async startWhatsAppFlow(
    workspaceId: string,
    name: string,
    phone: string,
    isRepeat: boolean,
  ): Promise<void> {
    const waNumber = phone.length === 10 ? `91${phone}` : phone;
    const body = this.buildWelcomeMessage(name, isRepeat);

    let delivered = false;
    try {
      const res: any = await this.whatsapp.sendViaVps(waNumber, body);
      delivered = !res?.error;
      if (res?.error) {
        this.logger.warn(`WhatsApp welcome not delivered to ${waNumber}: ${res.error}`);
      }
    } catch (err: any) {
      this.logger.warn(`WhatsApp welcome failed for ${waNumber}: ${err?.message}`);
    }

    // Record it either way. A queued-but-undelivered message is still useful
    // history, and it keeps the bot from re-greeting if the send retries later.
    await this.prisma.whatsAppMessage
      .create({
        data: {
          workspaceId,
          from: '919999000001',
          to: waNumber,
          type: 'text',
          content: { text: { body } } as never,
          direction: 'outgoing',
          status: delivered ? 'sent' : 'failed',
        },
      })
      .catch(() => undefined);
  }

  async getPageTemplates() {
    return [
      { id: 'home', name: 'Home Page', description: 'Main landing page with hero and featured properties' },
      { id: 'properties', name: 'Properties Listing', description: 'Grid of all available properties' },
      { id: 'property-detail', name: 'Property Detail', description: 'Single property with gallery and details' },
      { id: 'about', name: 'About Us', description: 'Company information and team' },
      { id: 'contact', name: 'Contact', description: 'Contact form with map' },
      { id: 'blog', name: 'Blog', description: 'Blog posts and articles' },
      { id: 'gallery', name: 'Gallery', description: 'Photo and video gallery' },
      { id: 'agents', name: 'Our Team', description: 'Agent profiles and contact' },
    ];
  }
}
