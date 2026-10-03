import { Module } from '@nestjs/common';
import { CustomerDataController } from './customer-data.controller';
import { CustomerDataService } from './customer-data.service';
import { BroadcastDripService } from './broadcast-drip.service';
import { WhatsAppBotModule } from '../whatsapp-bot/whatsapp-bot.module';

@Module({
  imports: [WhatsAppBotModule],
  controllers: [CustomerDataController],
  providers: [CustomerDataService, BroadcastDripService],
  exports: [CustomerDataService],
})
export class CustomerDataModule {}
