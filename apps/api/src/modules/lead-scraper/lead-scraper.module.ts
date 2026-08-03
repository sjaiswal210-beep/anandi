import { Module } from '@nestjs/common';
import { LeadScraperController } from './lead-scraper.controller';
import { LeadScraperService } from './lead-scraper.service';

@Module({
  controllers: [LeadScraperController],
  providers: [LeadScraperService],
  exports: [LeadScraperService],
})
export class LeadScraperModule {}
