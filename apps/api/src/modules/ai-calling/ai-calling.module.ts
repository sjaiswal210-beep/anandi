import { Module } from '@nestjs/common';
import { AICallingController } from './ai-calling.controller';
import { AICallingService } from './ai-calling.service';

@Module({
  controllers: [AICallingController],
  providers: [AICallingService],
  exports: [AICallingService],
})
export class AICallingModule {}
