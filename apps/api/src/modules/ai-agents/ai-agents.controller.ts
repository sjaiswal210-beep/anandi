import {
  Controller,
  Get,
  Post,
  Put,
  Param,
  Body,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AIAgentsService } from './ai-agents.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { WorkspaceGuard } from '../../common/guards/workspace.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { WorkspaceId } from '../../common/decorators/workspace.decorator';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';

@ApiTags('AI Agents')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, WorkspaceGuard, PermissionsGuard)
@Controller('ai-agents')
export class AIAgentsController {
  constructor(private readonly aiAgentsService: AIAgentsService) {}

  @Get()
  @RequirePermissions('ai_agents:view')
  @ApiOperation({ summary: 'List all AI agents' })
  async findAll(@WorkspaceId() workspaceId: string) {
    return this.aiAgentsService.findAll(workspaceId);
  }

  @Get(':id')
  @RequirePermissions('ai_agents:view')
  @ApiOperation({ summary: 'Get agent details' })
  async findById(
    @Param('id') id: string,
    @WorkspaceId() workspaceId: string,
  ) {
    return this.aiAgentsService.findById(id, workspaceId);
  }

  @Put(':id/configure')
  @RequirePermissions('ai_agents:manage')
  @ApiOperation({ summary: 'Configure agent settings' })
  async configure(
    @Param('id') id: string,
    @WorkspaceId() workspaceId: string,
    @Body() config: Record<string, unknown>,
  ) {
    return this.aiAgentsService.configure(id, workspaceId, config);
  }

  @Post(':id/toggle')
  @RequirePermissions('ai_agents:manage')
  @ApiOperation({ summary: 'Enable/disable agent' })
  async toggle(
    @Param('id') id: string,
    @WorkspaceId() workspaceId: string,
  ) {
    return this.aiAgentsService.toggle(id, workspaceId);
  }

  @Post(':id/execute')
  @RequirePermissions('ai_agents:execute')
  @ApiOperation({ summary: 'Execute agent manually' })
  async execute(
    @Param('id') id: string,
    @WorkspaceId() workspaceId: string,
    @Body() input: Record<string, unknown>,
  ) {
    return this.aiAgentsService.execute(id, workspaceId, input);
  }

  @Post(':id/chat')
  @RequirePermissions('ai_agents:execute')
  @ApiOperation({ summary: 'Chat with an agent' })
  async chat(
    @Param('id') id: string,
    @WorkspaceId() workspaceId: string,
    @Body() body: { message: string; sessionId: string },
  ) {
    return this.aiAgentsService.chat(id, workspaceId, body.message, body.sessionId);
  }

  @Get(':id/conversations')
  @RequirePermissions('ai_agents:view')
  @ApiOperation({ summary: 'Get agent conversations' })
  async getConversations(
    @Param('id') id: string,
    @Query('sessionId') sessionId?: string,
  ) {
    return this.aiAgentsService.getConversations(id, sessionId);
  }

  @Post('initialize')
  @RequirePermissions('ai_agents:manage')
  @ApiOperation({ summary: 'Initialize all agents for workspace' })
  async initialize(@WorkspaceId() workspaceId: string) {
    await this.aiAgentsService.initializeAgents(workspaceId);
    return { message: 'All agents initialized successfully' };
  }
}
