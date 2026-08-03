import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { RedisService } from '../../common/redis/redis.service';

@Injectable()
export class WorkspacesService {
  constructor(
    private prisma: PrismaService,
    private redisService: RedisService,
  ) {}

  async create(userId: string, dto: {
    name: string;
    slug: string;
    description?: string;
  }) {
    const existing = await this.prisma.workspace.findUnique({ where: { slug: dto.slug } });
    if (existing) throw new ConflictException('Workspace slug already taken');

    const workspace = await this.prisma.workspace.create({
      data: {
        name: dto.name,
        slug: dto.slug,
        description: dto.description,
        members: {
          create: { userId, role: 'BUILDER' },
        },
        subscription: {
          create: {
            plan: 'FREE',
            status: 'TRIALING',
            currentPeriodStart: new Date(),
            currentPeriodEnd: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
            trialEndsAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
          },
        },
      },
      include: { subscription: true },
    });

    return workspace;
  }

  async findAll(userId: string) {
    return this.prisma.workspace.findMany({
      where: { members: { some: { userId, isActive: true } } },
      include: {
        subscription: { select: { plan: true, status: true } },
        _count: { select: { members: true, leads: true, properties: true } },
      },
    });
  }

  async findById(id: string) {
    const workspace = await this.prisma.workspace.findUnique({
      where: { id },
      include: {
        subscription: true,
        _count: { select: { members: true, leads: true, properties: true, bookings: true } },
      },
    });
    if (!workspace) throw new NotFoundException('Workspace not found');
    return workspace;
  }

  async update(id: string, dto: { name?: string; description?: string; logo?: string; settings?: Record<string, unknown> }) {
    return this.prisma.workspace.update({
      where: { id },
      data: dto as never,
    });
  }

  async getMembers(workspaceId: string) {
    return this.prisma.workspaceMember.findMany({
      where: { workspaceId, isActive: true },
      include: {
        user: { select: { id: true, name: true, email: true, phone: true, avatar: true, lastLoginAt: true } },
      },
    });
  }

  async addMember(workspaceId: string, userId: string, role: string) {
    const existing = await this.prisma.workspaceMember.findFirst({
      where: { workspaceId, userId },
    });

    if (existing) {
      if (existing.isActive) throw new ConflictException('User is already a member');
      return this.prisma.workspaceMember.update({
        where: { id: existing.id },
        data: { isActive: true, role: role as never },
      });
    }

    return this.prisma.workspaceMember.create({
      data: { workspaceId, userId, role: role as never },
    });
  }

  async removeMember(workspaceId: string, userId: string) {
    const member = await this.prisma.workspaceMember.findFirst({ where: { workspaceId, userId } });
    if (!member) throw new NotFoundException('Member not found');

    return this.prisma.workspaceMember.update({
      where: { id: member.id },
      data: { isActive: false },
    });
  }

  async getAuditLogs(workspaceId: string, params: { page?: number; limit?: number }) {
    const { page = 1, limit = 50 } = params;

    const [data, total] = await Promise.all([
      this.prisma.auditLog.findMany({
        where: { workspaceId },
        include: { user: { select: { name: true, email: true } } },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.auditLog.count({ where: { workspaceId } }),
    ]);

    return { data, meta: { total, page, limit } };
  }

  async getApiKeys(workspaceId: string) {
    return this.prisma.apiKey.findMany({
      where: { workspaceId, isActive: true },
      select: { id: true, name: true, key: true, permissions: true, lastUsedAt: true, createdAt: true },
    });
  }

  async createApiKey(workspaceId: string, dto: { name: string; permissions: string[] }) {
    const { generateApiKey } = await import('@realtyos/shared');
    const key = generateApiKey();
    const crypto = await import('crypto');
    const hashedKey = crypto.createHash('sha256').update(key).digest('hex');

    const apiKey = await this.prisma.apiKey.create({
      data: {
        workspace: { connect: { id: workspaceId } },
        name: dto.name,
        key: key.slice(0, 12) + '...',
        hashedKey,
        permissions: dto.permissions,
      },
    });

    return { ...apiKey, fullKey: key };
  }

  async revokeApiKey(id: string) {
    return this.prisma.apiKey.update({
      where: { id },
      data: { isActive: false },
    });
  }

  async getFeatureFlags(workspaceId: string) {
    return this.prisma.featureFlag.findMany({ where: { workspaceId } });
  }

  async setFeatureFlag(workspaceId: string, key: string, isEnabled: boolean) {
    return this.prisma.featureFlag.upsert({
      where: { workspaceId_key: { workspaceId, key } },
      create: { workspaceId, key, name: key, isEnabled },
      update: { isEnabled },
    });
  }
}
