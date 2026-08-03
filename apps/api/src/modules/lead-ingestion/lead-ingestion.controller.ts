import { Controller, Post, Get, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { LeadIngestionService } from './lead-ingestion.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { WorkspaceGuard } from '../../common/guards/workspace.guard';
import { WorkspaceId } from '../../common/decorators/workspace.decorator';
import { Public } from '../../common/decorators/public.decorator';

@ApiTags('Lead Ingestion')
@Controller('lead-ingestion')
export class LeadIngestionController {
  constructor(private readonly service: LeadIngestionService) {}

  @Public()
  @Post('webhook')
  @ApiOperation({ summary: 'Ingest lead from external webhook (Meta, Google Forms, etc.)' })
  async webhook(@Body() body: { workspaceId: string; name: string; phone: string; email?: string; source: string; message?: string }) {
    return this.service.ingest(body.workspaceId, body);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, WorkspaceGuard)
  @Post('manual')
  @ApiOperation({ summary: 'Manually ingest a lead' })
  async manual(@WorkspaceId() workspaceId: string, @Body() body: { name: string; phone: string; email?: string; source: string; message?: string }) {
    return this.service.ingest(workspaceId, body);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, WorkspaceGuard)
  @Get('source-breakdown')
  @ApiOperation({ summary: 'Get leads by source' })
  async sourceBreakdown(@WorkspaceId() workspaceId: string) {
    return this.service.getSourceBreakdown(workspaceId);
  }
}
