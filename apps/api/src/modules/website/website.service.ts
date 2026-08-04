import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';

@Injectable()
export class WebsiteService {
  constructor(private prisma: PrismaService) {}

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
      return { success: true, message: 'Inquiry submitted successfully', duplicate: true };
    }

    await this.prisma.lead.create({
      data: {
        workspaceId,
        createdById,
        name: dto.name.trim(),
        phone,
        email: dto.email?.trim() || undefined,
        source: 'WEBSITE',
        status: 'NEW',
        tags: ['website', 'anandi-park'],
        customFields: {
          message: dto.message,
          config: dto.config,
          propertyId: dto.propertyId,
          inquirySource: dto.source || 'project_website',
          submittedAt: new Date().toISOString(),
        },
      },
    });

    return { success: true, message: 'Inquiry submitted successfully' };
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
