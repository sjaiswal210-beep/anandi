import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { DashboardService } from './dashboard.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { WorkspaceGuard } from '../../common/guards/workspace.guard';
import { WorkspaceId } from '../../common/decorators/workspace.decorator';

@ApiTags('Dashboard')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, WorkspaceGuard)
@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('metrics')
  @ApiOperation({ summary: 'Get dashboard metrics' })
  async getMetrics(@WorkspaceId() workspaceId: string) {
    return this.dashboardService.getMetrics(workspaceId);
  }

  @Get('live-stats')
  @ApiOperation({ summary: 'Real-time counts: leads by source, plots, channels' })
  async getLiveStats(@WorkspaceId() workspaceId: string) {
    return this.dashboardService.getLiveStats(workspaceId);
  }

  @Get('revenue-chart')
  @ApiOperation({ summary: 'Get revenue chart data' })
  async getRevenueChart(
    @WorkspaceId() workspaceId: string,
    @Query('period') period?: string,
  ) {
    return this.dashboardService.getRevenueChart(workspaceId, period);
  }

  @Get('lead-pipeline')
  @ApiOperation({ summary: 'Get lead pipeline data' })
  async getLeadPipeline(@WorkspaceId() workspaceId: string) {
    return this.dashboardService.getLeadPipeline(workspaceId);
  }

  @Get('top-agents')
  @ApiOperation({ summary: 'Get top performing agents' })
  async getTopAgents(@WorkspaceId() workspaceId: string) {
    return this.dashboardService.getTopAgents(workspaceId);
  }
}
