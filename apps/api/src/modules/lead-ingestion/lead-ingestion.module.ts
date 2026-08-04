import { Module } from '@nestjs/common';
import { LeadIngestionController } from './lead-ingestion.controller';
import { MetaWebhookController } from './meta-webhook.controller';
import { MetaLeadsController } from './meta-leads.controller';
import { LeadIngestionService } from './lead-ingestion.service';
import { MetaLeadsService } from './meta-leads.service';
import { MetaCommentsService } from './meta-comments.service';

@Module({
  controllers: [LeadIngestionController, MetaWebhookController, MetaLeadsController],
  providers: [LeadIngestionService, MetaLeadsService, MetaCommentsService],
  exports: [LeadIngestionService, MetaLeadsService, MetaCommentsService],
})
export class LeadIngestionModule {}
