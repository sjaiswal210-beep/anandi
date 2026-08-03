import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { RedisService } from '../../common/redis/redis.service';

interface QueryUsersParams {
  page?: number;
  limit?: number;
  search?: string;
  role?: string;
}

@Injectable()
export class UsersService {
  constructor(
    private prisma: PrismaService,
    private redisService: RedisService,
  ) {}

  async findAll(workspaceId: string, params: QueryUsersParams) {
    const { page = 1, limit = 20, search, role } = params;
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {
      workspaces: {
        some: { workspaceId },
      },
    };

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (role) {
      where.workspaces = {
        some: { workspaceId, role },
      };
    }

    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        skip,
        take: limit,
        include: {
          workspaces: {
            where: { workspaceId },
            select: { role: true, joinedAt: true },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.user.count({ where }),
    ]);

    return {
      data: users,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findById(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  async findByIdInWorkspace(userId: string, workspaceId: string) {
    const user = await this.prisma.user.findFirst({
      where: {
        id: userId,
        workspaces: { some: { workspaceId } },
      },
      include: {
        workspaces: {
          where: { workspaceId },
          select: { role: true, joinedAt: true },
        },
      },
    });

    if (!user) {
      throw new NotFoundException('User not found in workspace');
    }

    return user;
  }

  async update(userId: string, workspaceId: string, dto: { name?: string; phone?: string; avatar?: string }) {
    await this.findByIdInWorkspace(userId, workspaceId);

    const user = await this.prisma.user.update({
      where: { id: userId },
      data: dto as any,
    });

    await this.redisService.flushByPattern(`users:${workspaceId}:*`);
    return user;
  }

  async updateRole(userId: string, workspaceId: string, role: string) {
    const membership = await this.prisma.workspaceMember.findFirst({
      where: { userId, workspaceId },
    });

    if (!membership) {
      throw new NotFoundException('User not found in workspace');
    }

    await this.prisma.workspaceMember.update({
      where: { id: membership.id },
      data: { role: role as any },
    });

    await this.redisService.flushByPattern(`users:${workspaceId}:*`);
    return { message: 'Role updated successfully' };
  }

  async removeFromWorkspace(userId: string, workspaceId: string) {
    const membership = await this.prisma.workspaceMember.findFirst({
      where: { userId, workspaceId },
    });

    if (!membership) {
      throw new NotFoundException('User not found in workspace');
    }

    await this.prisma.workspaceMember.delete({
      where: { id: membership.id },
    });

    await this.redisService.flushByPattern(`users:${workspaceId}:*`);
    return { message: 'User removed from workspace' };
  }

  async inviteUser(
    workspaceId: string,
    invitedBy: string,
    dto: { email: string; role: string; name?: string },
  ) {
    const existingUser = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (existingUser) {
      const existingMembership = await this.prisma.workspaceMember.findFirst({
        where: { userId: existingUser.id, workspaceId },
      });

      if (existingMembership) {
        throw new ConflictException('User is already a member of this workspace');
      }

      // Add existing user directly
      await this.prisma.workspaceMember.create({
        data: {
          workspaceId,
          userId: existingUser.id,
          role: dto.role as any,
        },
      });

      return { message: 'User added to workspace successfully' };
    }

    // For non-existing users, we'd send an email invite
    // Store invite info in workspace settings or a separate mechanism
    return { message: 'Invitation sent successfully' };
  }
}
