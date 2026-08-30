import { Module } from '@nestjs/common';
import { HrController } from './hr.controller';
import { HrService } from './hr.service';
import { HrCronService } from './hr-cron.service';
import { WhatsAppModule } from '../whatsapp/whatsapp.module';

@Module({
  imports: [WhatsAppModule],
  controllers: [HrController],
  providers: [HrService, HrCronService],
  exports: [HrService, HrCronService],
})
export class HrModule {}
