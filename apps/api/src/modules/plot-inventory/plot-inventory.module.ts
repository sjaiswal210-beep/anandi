import { Module } from '@nestjs/common';
import { PlotInventoryController } from './plot-inventory.controller';
import { PlotInventoryService } from './plot-inventory.service';

@Module({
  controllers: [PlotInventoryController],
  providers: [PlotInventoryService],
  exports: [PlotInventoryService],
})
export class PlotInventoryModule {}
