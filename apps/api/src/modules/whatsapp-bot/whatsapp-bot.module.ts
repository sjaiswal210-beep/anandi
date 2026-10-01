import { Module } from '@nestjs/common';
import { WhatsAppBotController } from './whatsapp-bot.controller';
import { WhatsAppBotService } from './whatsapp-bot.service';
import { WhatsAppKeepaliveService } from './whatsapp-keepalive.service';

@Module({
  controllers: [WhatsAppBotController],
  providers: [WhatsAppBotService, WhatsAppKeepaliveService],
  exports: [WhatsAppBotService],
})
export class WhatsAppBotModule {}
