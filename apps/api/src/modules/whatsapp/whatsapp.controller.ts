import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  UseGuards,
  Req,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import { WhatsAppService } from './whatsapp.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { WorkspaceGuard } from '../../common/guards/workspace.guard';
import { WorkspaceId } from '../../common/decorators/workspace.decorator';
import { Public } from '../../common/decorators/public.decorator';
import { Request } from 'express';

@ApiTags('WhatsApp')
@Controller('whatsapp')
export class WhatsAppController {
  constructor(
    private readonly whatsappService: WhatsAppService,
    private configService: ConfigService,
  ) {}

  // Webhook verification (Meta requires GET)
  @Public()
  @Get('webhook')
  @ApiOperation({ summary: 'WhatsApp webhook verification' })
  verifyWebhook(
    @Query('hub.mode') mode: string,
    @Query('hub.verify_token') token: string,
    @Query('hub.challenge') challenge: string,
  ) {
    const verifyToken = this.configService.get<string>('WHATSAPP_VERIFY_TOKEN');
    if (mode === 'subscribe' && token === verifyToken) {
      return challenge;
    }
    return 'Forbidden';
  }

  // Webhook for incoming messages
  @Public()
  @Post('webhook')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'WhatsApp incoming message webhook' })
  async handleWebhook(@Body() body: Record<string, unknown>) {
    await this.whatsappService.handleWebhook(body);
    return 'OK';
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, WorkspaceGuard)
  @Post('send')
  @ApiOperation({ summary: 'Send WhatsApp message' })
  async sendMessage(
    @WorkspaceId() workspaceId: string,
    @Body() body: { to: string; message: string },
  ) {
    return this.whatsappService.sendTextMessage(workspaceId, body.to, body.message);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, WorkspaceGuard)
  @Post('send-template')
  @ApiOperation({ summary: 'Send WhatsApp template message' })
  async sendTemplate(
    @WorkspaceId() workspaceId: string,
    @Body() body: { to: string; templateName: string; params?: string[] },
  ) {
    return this.whatsappService.sendTemplate(workspaceId, body.to, body.templateName, body.params);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, WorkspaceGuard)
  @Post('broadcast')
  @ApiOperation({ summary: 'Broadcast template to multiple recipients' })
  async broadcast(
    @WorkspaceId() workspaceId: string,
    @Body() body: { recipients: string[]; templateName: string; params?: string[] },
  ) {
    return this.whatsappService.broadcast(workspaceId, body.recipients, body.templateName, body.params);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, WorkspaceGuard)
  @Get('conversations')
  @ApiOperation({ summary: 'Get WhatsApp conversations' })
  async getConversations(
    @WorkspaceId() workspaceId: string,
    @Query('phone') phone?: string,
  ) {
    return this.whatsappService.getConversations(workspaceId, phone);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, WorkspaceGuard)
  @Get('messages')
  @ApiOperation({ summary: 'Get messages for a contact' })
  async getMessages(
    @WorkspaceId() workspaceId: string,
    @Query('phone') phone: string,
  ) {
    return this.whatsappService.getMessages(workspaceId, phone);
  }
}
