import { Controller, Get, Post, Put, Param, Body, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { PlotInventoryService } from './plot-inventory.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { WorkspaceGuard } from '../../common/guards/workspace.guard';
import { Public } from '../../common/decorators/public.decorator';

@ApiTags('Plot Inventory')
@Controller('plots')
export class PlotInventoryController {
  constructor(private readonly service: PlotInventoryService) {}

  @Public()
  @Get('project/:projectId')
  @ApiOperation({ summary: 'Get all plots for a project (public)' })
  async findAll(@Param('projectId') projectId: string) {
    return this.service.findAll(projectId);
  }

  @Public()
  @Get('project/:projectId/stats')
  @ApiOperation({ summary: 'Get plot stats' })
  async getStats(@Param('projectId') projectId: string) {
    return this.service.getStats(projectId);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, WorkspaceGuard)
  @Post('project/:projectId')
  @ApiOperation({ summary: 'Add a plot' })
  async create(@Param('projectId') projectId: string, @Body() dto: any) {
    return this.service.create(projectId, dto);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, WorkspaceGuard)
  @Put(':id/status')
  @ApiOperation({ summary: 'Update plot status' })
  async updateStatus(@Param('id') id: string, @Body() dto: { status: string; bookedBy?: string }) {
    return this.service.updateStatus(id, dto.status, dto.bookedBy);
  }
}
