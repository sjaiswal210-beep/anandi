import { Module } from '@nestjs/common';
import { LeadIngestionController } from './lead-ingestion.controller';
import { MetaWebhookController } from './meta-webhook.controller';
import { LeadIngestionService } from './lead-ingestion.service';

@Module({
  controllers: [LeadIngestionController, MetaWebhookController],
  providers: [LeadIngestionService],
  exports: [LeadIngestionService],
})
export class LeadIngestionModule {}
