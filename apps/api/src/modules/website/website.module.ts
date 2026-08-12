import { Module } from '@nestjs/common';
import { WebsiteController } from './website.controller';
import { WebsiteService } from './website.service';
import { WhatsAppBotModule } from '../whatsapp-bot/whatsapp-bot.module';

@Module({
  // Website leads kick off the WhatsApp conversation, so the bot service is
  // needed here. WhatsAppBotModule does not import WebsiteModule, so there is
  // no circular dependency.
  imports: [WhatsAppBotModule],
  controllers: [WebsiteController],
  providers: [WebsiteService],
  exports: [WebsiteService],
})
export class WebsiteModule {}
