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
  }) {
    const website = await this.prisma.website.findFirst({
      where: { subdomain, isPublished: true },
      include: { workspace: true },
    });

    if (!website) throw new NotFoundException('Website not found');

    // Create lead from inquiry
    const admin = await this.prisma.user.findFirst({
      where: {
        workspaces: { some: { workspaceId: website.workspaceId } },
      },
    });

    if (admin) {
      await this.prisma.lead.create({
        data: {
          workspaceId: website.workspaceId,
          createdById: admin.id,
          name: dto.name,
          phone: dto.phone,
          email: dto.email,
          source: 'WEBSITE',
          status: 'NEW',
          customFields: {
            message: dto.message,
            propertyId: dto.propertyId,
            inquirySource: dto.source || 'website_form',
          },
        },
      });
    }

    return { message: 'Inquiry submitted successfully' };
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
