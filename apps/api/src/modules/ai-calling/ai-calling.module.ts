import { Module } from '@nestjs/common';
import { AICallingController } from './ai-calling.controller';
import { VobizController } from './vobiz.controller';
import { AICallingService } from './ai-calling.service';
import { VobizService } from './vobiz.service';

@Module({
  controllers: [AICallingController, VobizController],
  providers: [AICallingService, VobizService],
  exports: [AICallingService, VobizService],
})
export class AICallingModule {}
