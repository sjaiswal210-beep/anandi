import { Module } from '@nestjs/common';
import { AdsController } from './ads.controller';
import { AdsService } from './ads.service';
import { AdsSyncCronService } from './ads-sync-cron.service';

@Module({
  controllers: [AdsController],
  providers: [AdsService, AdsSyncCronService],
  exports: [AdsService],
})
export class AdsModule {}
