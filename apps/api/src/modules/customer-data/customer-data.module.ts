import { Module } from '@nestjs/common';
import { CustomerDataController } from './customer-data.controller';
import { CustomerDataService } from './customer-data.service';

@Module({
  controllers: [CustomerDataController],
  providers: [CustomerDataService],
  exports: [CustomerDataService],
})
export class CustomerDataModule {}
