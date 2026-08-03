import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { ReportsService } from './reports.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { WorkspaceGuard } from '../../common/guards/workspace.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { WorkspaceId } from '../../common/decorators/workspace.decorator';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';

@ApiTags('Reports')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, WorkspaceGuard, PermissionsGuard)
@Controller('reports')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get('sales')
  @RequirePermissions('reports:view')
  @ApiOperation({ summary: 'Sales report' })
  async getSalesReport(
    @WorkspaceId() workspaceId: string,
    @Query('period') period: string = 'monthly',
  ) {
    return this.reportsService.getSalesReport(workspaceId, period);
  }

  @Get('leads')
  @RequirePermissions('reports:view')
  @ApiOperation({ summary: 'Leads report' })
  async getLeadsReport(
    @WorkspaceId() workspaceId: string,
    @Query('period') period: string = 'monthly',
    @Query('groupBy') groupBy: string = 'status',
  ) {
    return this.reportsService.getLeadsReport(workspaceId, period, groupBy);
  }

  @Get('properties')
  @RequirePermissions('reports:view')
  @ApiOperation({ summary: 'Property report' })
  async getPropertyReport(@WorkspaceId() workspaceId: string) {
    return this.reportsService.getPropertyReport(workspaceId);
  }

  @Get('agents')
  @RequirePermissions('reports:view')
  @ApiOperation({ summary: 'Agent performance report' })
  async getAgentPerformance(
    @WorkspaceId() workspaceId: string,
    @Query('period') period: string = 'monthly',
  ) {
    return this.reportsService.getAgentPerformance(workspaceId, period);
  }

  @Get('marketing')
  @RequirePermissions('marketing:view')
  @ApiOperation({ summary: 'Marketing report' })
  async getMarketingReport(
    @WorkspaceId() workspaceId: string,
    @Query('period') period: string = 'monthly',
  ) {
    return this.reportsService.getMarketingReport(workspaceId, period);
  }
}
