import { Controller, Get, Post, Param, Body, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AICallingService } from './ai-calling.service';
import { VobizService } from './vobiz.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { WorkspaceGuard } from '../../common/guards/workspace.guard';
import { WorkspaceId } from '../../common/decorators/workspace.decorator';
import { Public } from '../../common/decorators/public.decorator';

@ApiTags('AI Calling')
@Controller('ai-calling')
export class AICallingController {
  constructor(
    private readonly service: AICallingService,
    private readonly vobiz: VobizService,
  ) {}

  @Public()
  @Get('status')
  @ApiOperation({ summary: 'Check Vobiz telephony configuration' })
  async status() {
    return {
      provider: 'vobiz',
      configured: this.vobiz.isConfigured,
      fromNumber: this.vobiz.fromNumber ? this.vobiz.fromNumber.slice(0, 6) + '...' : null,
      authIdPrefix: this.vobiz.authId ? this.vobiz.authId.slice(0, 8) + '...' : null,
    };
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, WorkspaceGuard)
  @Post('generate-script/:leadId')
  @ApiOperation({ summary: 'Generate call script for a lead' })
  async generateScript(@Param('leadId') leadId: string, @Body() dto: { objective?: string }) {
    return this.service.generateScript(leadId, dto.objective || 'introduction');
  }

  @Post('call')
  @ApiOperation({ summary: 'Place one outbound call via Vobiz' })
  async initiateCall(@WorkspaceId() workspaceId: string, @Body() dto: { leadId?: string; phone: string; script?: string; objective?: string }) {
    return this.service.initiateCall(workspaceId, dto);
  }

  @Post('blast')
  @ApiOperation({ summary: 'Call all eligible leads (blast TTS campaign)' })
  async blastCall(
    @WorkspaceId() workspaceId: string,
    @Body() dto: { script?: string; tag?: string; limit?: number },
  ) {
    return this.service.blastCall(workspaceId, dto);
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
