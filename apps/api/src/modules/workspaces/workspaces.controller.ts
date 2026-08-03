import { Controller, Get, Post, Put, Delete, Param, Body, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { WorkspacesService } from './workspaces.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { WorkspaceGuard } from '../../common/guards/workspace.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { WorkspaceId } from '../../common/decorators/workspace.decorator';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';
import { PermissionsGuard } from '../../common/guards/permissions.guard';

@ApiTags('Workspaces')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('workspaces')
export class WorkspacesController {
  constructor(private readonly workspacesService: WorkspacesService) {}

  @Post()
  @ApiOperation({ summary: 'Create workspace' })
  async create(
    @CurrentUser('id') userId: string,
    @Body() dto: { name: string; slug: string; description?: string },
  ) {
    return this.workspacesService.create(userId, dto);
  }

  @Get()
  @ApiOperation({ summary: 'List user workspaces' })
  async findAll(@CurrentUser('id') userId: string) {
    return this.workspacesService.findAll(userId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get workspace details' })
  async findById(@Param('id') id: string) {
    return this.workspacesService.findById(id);
  }

  @Put(':id')
  @UseGuards(WorkspaceGuard, PermissionsGuard)
  @RequirePermissions('workspace:manage')
  @ApiOperation({ summary: 'Update workspace' })
  async update(@Param('id') id: string, @Body() dto: any) {
    return this.workspacesService.update(id, dto);
  }

  @Get(':id/members')
  @UseGuards(WorkspaceGuard)
  @ApiOperation({ summary: 'Get workspace members' })
  async getMembers(@Param('id') id: string) {
    return this.workspacesService.getMembers(id);
  }

  @Post(':id/members')
  @UseGuards(WorkspaceGuard, PermissionsGuard)
  @RequirePermissions('users:invite')
  @ApiOperation({ summary: 'Add member to workspace' })
  async addMember(
    @Param('id') id: string,
    @Body() dto: { userId: string; role: string },
  ) {
    return this.workspacesService.addMember(id, dto.userId, dto.role);
  }

  @Delete(':id/members/:userId')
  @UseGuards(WorkspaceGuard, PermissionsGuard)
  @RequirePermissions('users:manage')
  @ApiOperation({ summary: 'Remove member' })
  async removeMember(@Param('id') id: string, @Param('userId') userId: string) {
    return this.workspacesService.removeMember(id, userId);
  }

  @Get(':id/audit-logs')
  @UseGuards(WorkspaceGuard, PermissionsGuard)
  @RequirePermissions('settings:view')
  @ApiOperation({ summary: 'Get audit logs' })
  async getAuditLogs(
    @Param('id') id: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.workspacesService.getAuditLogs(id, { page, limit });
  }

  @Get(':id/api-keys')
  @UseGuards(WorkspaceGuard, PermissionsGuard)
  @RequirePermissions('settings:manage')
  @ApiOperation({ summary: 'Get API keys' })
  async getApiKeys(@Param('id') id: string) {
    return this.workspacesService.getApiKeys(id);
  }

  @Post(':id/api-keys')
  @UseGuards(WorkspaceGuard, PermissionsGuard)
  @RequirePermissions('settings:manage')
  @ApiOperation({ summary: 'Create API key' })
  async createApiKey(
    @Param('id') id: string,
    @Body() dto: { name: string; permissions: string[] },
  ) {
    return this.workspacesService.createApiKey(id, dto);
  }

  @Delete(':id/api-keys/:keyId')
  @UseGuards(WorkspaceGuard, PermissionsGuard)
  @RequirePermissions('settings:manage')
  @ApiOperation({ summary: 'Revoke API key' })
  async revokeApiKey(@Param('keyId') keyId: string) {
    return this.workspacesService.revokeApiKey(keyId);
  }

  @Get(':id/feature-flags')
  @UseGuards(WorkspaceGuard)
  @ApiOperation({ summary: 'Get feature flags' })
  async getFeatureFlags(@Param('id') id: string) {
    return this.workspacesService.getFeatureFlags(id);
  }

  @Post(':id/feature-flags')
  @UseGuards(WorkspaceGuard, PermissionsGuard)
  @RequirePermissions('settings:manage')
  @ApiOperation({ summary: 'Set feature flag' })
  async setFeatureFlag(
    @Param('id') id: string,
    @Body() dto: { key: string; isEnabled: boolean },
  ) {
    return this.workspacesService.setFeatureFlag(id, dto.key, dto.isEnabled);
  }
}
