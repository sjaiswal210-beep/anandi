import { Controller, Get, Post, Param, Body, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { CustomerDataService } from './customer-data.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { WorkspaceGuard } from '../../common/guards/workspace.guard';
import { WorkspaceId } from '../../common/decorators/workspace.decorator';

@ApiTags('Customer Data')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, WorkspaceGuard)
@Controller('customer-data')
export class CustomerDataController {
  constructor(private readonly service: CustomerDataService) {}

  @Post('import')
  @ApiOperation({ summary: 'Import customer records' })
  async importData(@WorkspaceId() workspaceId: string, @Body() dto: { records: { name: string; phone: string; email?: string; tags?: string[] }[] }) {
    return this.service.importCustomers(workspaceId, dto.records);
  }

  @Get()
  @ApiOperation({ summary: 'Get imported customers' })
  async getAll(@WorkspaceId() workspaceId: string, @Query('page') page?: number, @Query('responded') responded?: boolean) {
    return this.service.getAll(workspaceId, { page, responded });
  }

  @Post('broadcast')
  @ApiOperation({ summary: 'Create a broadcast campaign' })
  async createBroadcast(@WorkspaceId() workspaceId: string, @Body() dto: { name: string; channel: string; template: string; targetTags?: string[] }) {
    return this.service.createBroadcast(workspaceId, dto);
  }

  @Post('broadcast/:id/execute')
  @ApiOperation({ summary: 'Execute a broadcast campaign' })
  async executeBroadcast(@Param('id') id: string) {
    return this.service.executeBroadcast(id);
  }

  @Get('broadcasts')
  @ApiOperation({ summary: 'Get all broadcast campaigns' })
  async getBroadcasts(@WorkspaceId() workspaceId: string) {
    return this.service.getBroadcasts(workspaceId);
  }

  // --- Throttled WhatsApp drip campaign (ban-safe bulk sender) ---

  @Post('drip/start')
  @ApiOperation({ summary: 'Start a throttled WhatsApp drip campaign (message + photo/PDF links)' })
  async startDrip(
    @WorkspaceId() workspaceId: string,
    @Body()
    dto: {
      name: string;
      message: string;
      imageUrl?: string;
      documentUrl?: string;
      dailyCap?: number;
      batchSize?: number;
      minDelaySec?: number;
      maxDelaySec?: number;
      startHour?: number;
      endHour?: number;
      targetTags?: string[];
    },
  ) {
    return this.service.startDripCampaign(workspaceId, dto);
  }

  @Post('drip/:id/pause')
  @ApiOperation({ summary: 'Pause a drip campaign' })
  async pauseDrip(@Param('id') id: string) {
    return this.service.pauseDripCampaign(id);
  }

  @Post('drip/:id/resume')
  @ApiOperation({ summary: 'Resume a paused drip campaign' })
  async resumeDrip(@Param('id') id: string) {
    return this.service.resumeDripCampaign(id);
  }

  @Get('drip/:id/status')
  @ApiOperation({ summary: 'Get live progress + ETA for a drip campaign' })
  async dripStatus(@WorkspaceId() workspaceId: string, @Param('id') id: string) {
    return this.service.getDripStatus(workspaceId, id);
  }
}
