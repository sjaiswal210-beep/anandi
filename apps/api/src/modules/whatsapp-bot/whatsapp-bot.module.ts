import { Module } from '@nestjs/common';
import { WhatsAppBotController } from './whatsapp-bot.controller';
import { WhatsAppBotService } from './whatsapp-bot.service';

@Module({
  controllers: [WhatsAppBotController],
  providers: [WhatsAppBotService],
  exports: [WhatsAppBotService],
})
export class WhatsAppBotModule {}
