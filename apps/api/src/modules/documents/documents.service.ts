import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class DocumentsService {
  constructor(
    private prisma: PrismaService,
    private configService: ConfigService,
  ) {}

  async upload(workspaceId: string, dto: {
    leadId?: string;
    customerId?: string;
    type: string;
    name: string;
    originalName: string;
    url: string;
    mimeType: string;
    size: number;
    tags?: string[];
  }) {
    return this.prisma.document.create({
      data: {
        workspace: { connect: { id: workspaceId } },
        ...(dto.leadId && { lead: { connect: { id: dto.leadId } } }),
        ...(dto.customerId && { customer: { connect: { id: dto.customerId } } }),
        type: dto.type as never,
        name: dto.name,
        originalName: dto.originalName,
        url: dto.url,
        mimeType: dto.mimeType,
        size: dto.size,
        tags: dto.tags || [],
      },
    });
  }

  async findAll(workspaceId: string, params: {
    page?: number;
    limit?: number;
    type?: string;
    leadId?: string;
    customerId?: string;
    search?: string;
  }) {
    const { page = 1, limit = 20, type, leadId, customerId, search } = params;

    const where: Record<string, unknown> = { workspaceId };
    if (type) where.type = type;
    if (leadId) where.leadId = leadId;
    if (customerId) where.customerId = customerId;
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { originalName: { contains: search, mode: 'insensitive' } },
        { tags: { hasSome: [search] } },
      ];
    }

    const [data, total] = await Promise.all([
      this.prisma.document.findMany({
        where,
        include: {
          lead: { select: { name: true } },
          customer: { select: { name: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.document.count({ where }),
    ]);

    return { data, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } };
  }

  async findById(id: string, workspaceId: string) {
    const doc = await this.prisma.document.findFirst({
      where: { id, workspaceId },
      include: {
        lead: { select: { name: true, phone: true } },
        customer: { select: { name: true, phone: true } },
        versions: { orderBy: { version: 'desc' } },
      },
    });
    if (!doc) throw new NotFoundException('Document not found');
    return doc;
  }

  async delete(id: string, workspaceId: string) {
    const doc = await this.prisma.document.findFirst({ where: { id, workspaceId } });
    if (!doc) throw new NotFoundException('Document not found');
    await this.prisma.document.delete({ where: { id } });
    return { message: 'Document deleted' };
  }

  async createVersion(id: string, workspaceId: string, dto: {
    url: string;
    name: string;
    originalName: string;
    mimeType: string;
    size: number;
  }) {
    const parent = await this.prisma.document.findFirst({ where: { id, workspaceId } });
    if (!parent) throw new NotFoundException('Document not found');

    return this.prisma.document.create({
      data: {
        workspace: { connect: { id: workspaceId } },
        parent: { connect: { id } },
        type: parent.type,
        name: dto.name,
        originalName: dto.originalName,
        url: dto.url,
        mimeType: dto.mimeType,
        size: dto.size,
        version: parent.version + 1,
        ...(parent.leadId && { lead: { connect: { id: parent.leadId } } }),
        ...(parent.customerId && { customer: { connect: { id: parent.customerId } } }),
      },
    });
  }

  async searchByOcr(workspaceId: string, query: string) {
    return this.prisma.document.findMany({
      where: {
        workspaceId,
        ocrText: { contains: query, mode: 'insensitive' },
      },
      select: { id: true, name: true, type: true, ocrText: true, url: true },
      take: 20,
    });
  }
}
