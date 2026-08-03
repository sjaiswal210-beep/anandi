import { Controller, Get, Post, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { WhatsAppBotService } from './whatsapp-bot.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { WorkspaceGuard } from '../../common/guards/workspace.guard';
import { WorkspaceId } from '../../common/decorators/workspace.decorator';
import { Public } from '../../common/decorators/public.decorator';

@ApiTags('WhatsApp Bot')
@Controller('whatsapp-bot')
export class WhatsAppBotController {
  constructor(private readonly service: WhatsAppBotService) {}

  @Public()
  @Post('incoming')
  @ApiOperation({ summary: 'Handle incoming WhatsApp message (AI auto-reply)' })
  async handleIncoming(@Body() body: { from: string; message: string; workspaceId?: string }) {
    return this.service.handleIncomingMessage(body.from, body.message, body.workspaceId);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, WorkspaceGuard)
  @Get('conversations')
  @ApiOperation({ summary: 'Get bot conversations summary' })
  async getConversations(@WorkspaceId() workspaceId: string) {
    return this.service.getConversations(workspaceId);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, WorkspaceGuard)
  @Get('metrics')
  @ApiOperation({ summary: 'Get bot metrics' })
  async getMetrics(@WorkspaceId() workspaceId: string) {
    return this.service.getBotMetrics(workspaceId);
  }

  // VPS Bot endpoints (public - no auth needed for status checks)
  @Public()
  @Get('vps/status')
  @ApiOperation({ summary: 'Get VPS WhatsApp bot session status' })
  async vpsStatus() {
    return this.service.getVpsStatus();
  }

  @Public()
  @Post('vps/start')
  @ApiOperation({ summary: 'Start VPS WhatsApp session' })
  async vpsStart() {
    return this.service.startVpsSession();
  }

  @Public()
  @Post('vps/send')
  @ApiOperation({ summary: 'Send message via VPS WhatsApp bot' })
  async vpsSend(@Body() body: { to: string; message: string }) {
    return this.service.sendViaVps(body.to, body.message);
  }

  @Public()
  @Post('vps/broadcast')
  @ApiOperation({ summary: 'Broadcast via VPS WhatsApp bot' })
  async vpsBroadcast(@Body() body: { numbers: string[]; message: string }) {
    return this.service.broadcastViaVps(body.numbers, body.message);
  }

  @Public()
  @Get('vps/health')
  @ApiOperation({ summary: 'VPS bot health check' })
  async vpsHealth() {
    return this.service.getVpsHealth();
  }
}
