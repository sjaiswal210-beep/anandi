import { Controller, Get, Post, Param, Body, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AICallingService } from './ai-calling.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { WorkspaceGuard } from '../../common/guards/workspace.guard';
import { WorkspaceId } from '../../common/decorators/workspace.decorator';

@ApiTags('AI Calling')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, WorkspaceGuard)
@Controller('ai-calling')
export class AICallingController {
  constructor(private readonly service: AICallingService) {}

  @Post('generate-script/:leadId')
  @ApiOperation({ summary: 'Generate call script for a lead' })
  async generateScript(@Param('leadId') leadId: string, @Body() dto: { objective?: string }) {
    return this.service.generateScript(leadId, dto.objective || 'introduction');
  }

  @Post('call')
  @ApiOperation({ summary: 'Initiate an AI call' })
  async initiateCall(@WorkspaceId() workspaceId: string, @Body() dto: { leadId?: string; phone: string; script?: string; objective?: string }) {
    return this.service.initiateCall(workspaceId, dto);
  }

  @Get('records')
  @ApiOperation({ summary: 'Get call records' })
  async getRecords(@WorkspaceId() workspaceId: string, @Query('page') page?: number) {
    return this.service.getCallRecords(workspaceId, { page });
  }

  @Get('metrics')
  @ApiOperation({ summary: 'Get calling metrics' })
  async getMetrics(@WorkspaceId() workspaceId: string) {
    return this.service.getCallMetrics(workspaceId);
  }
}
