import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PrismaService } from '../prisma/prisma.service';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';

@Injectable()
export class WorkspaceGuard implements CanActivate {
  constructor(private prisma: PrismaService, private reflector: Reflector) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // Skip workspace enforcement on @Public() endpoints.
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;

    const request = context.switchToHttp().getRequest();
    const user = request.user;
    const workspaceId = request.headers['x-workspace-id'] || request.params.workspaceId;

    if (!workspaceId) {
      throw new ForbiddenException('Workspace ID is required');
    }

    if (!user) {
      throw new ForbiddenException('Authentication required');
    }

    // Super admins can access any workspace
    if (user.role === 'SUPER_ADMIN') {
      request.workspaceId = workspaceId;
      return true;
    }

    // Check if user is a member of the workspace
    const membership = await this.prisma.workspaceMember.findUnique({
      where: {
        workspaceId_userId: {
          workspaceId,
          userId: user.id,
        },
      },
    });

    if (!membership || !membership.isActive) {
      throw new ForbiddenException('You do not have access to this workspace');
    }

    request.workspaceId = workspaceId;
    request.workspaceRole = membership.role;
    return true;
  }
}
