import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { WorkspaceGuard } from '../../common/guards/workspace.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { WorkspaceId } from '../../common/decorators/workspace.decorator';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';

@ApiTags('Users')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, WorkspaceGuard, PermissionsGuard)
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @RequirePermissions('users:view')
  @ApiOperation({ summary: 'List all users in workspace' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiQuery({ name: 'role', required: false, type: String })
  async findAll(
    @WorkspaceId() workspaceId: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('search') search?: string,
    @Query('role') role?: string,
  ) {
    return this.usersService.findAll(workspaceId, { page, limit, search, role });
  }

  @Get('me')
  @ApiOperation({ summary: 'Get current user profile' })
  async getProfile(@CurrentUser('id') userId: string) {
    return this.usersService.findById(userId);
  }

  @Get(':id')
  @RequirePermissions('users:view')
  @ApiOperation({ summary: 'Get user by ID' })
  async findById(
    @Param('id') id: string,
    @WorkspaceId() workspaceId: string,
  ) {
    return this.usersService.findByIdInWorkspace(id, workspaceId);
  }

  @Put(':id')
  @RequirePermissions('users:edit')
  @ApiOperation({ summary: 'Update user details' })
  async update(
    @Param('id') id: string,
    @WorkspaceId() workspaceId: string,
    @Body() dto: { name?: string; phone?: string; avatar?: string },
  ) {
    return this.usersService.update(id, workspaceId, dto);
  }

  @Put(':id/role')
  @RequirePermissions('users:manage-roles')
  @ApiOperation({ summary: 'Update user role' })
  async updateRole(
    @Param('id') id: string,
    @WorkspaceId() workspaceId: string,
    @Body() dto: { role: string },
  ) {
    return this.usersService.updateRole(id, workspaceId, dto.role);
  }

  @Delete(':id')
  @RequirePermissions('users:delete')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Remove user from workspace' })
  async delete(
    @Param('id') id: string,
    @WorkspaceId() workspaceId: string,
  ) {
    return this.usersService.removeFromWorkspace(id, workspaceId);
  }

  @Post('invite')
  @RequirePermissions('users:invite')
  @ApiOperation({ summary: 'Invite a user to the workspace' })
  async invite(
    @WorkspaceId() workspaceId: string,
    @CurrentUser('id') invitedBy: string,
    @Body() dto: { email: string; role: string; name?: string },
  ) {
    return this.usersService.inviteUser(workspaceId, invitedBy, dto);
  }
}
