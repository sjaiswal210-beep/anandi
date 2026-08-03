import { Controller, Get, Post, Put, Param, Body, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { VisitsService } from './visits.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { WorkspaceGuard } from '../../common/guards/workspace.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { WorkspaceId } from '../../common/decorators/workspace.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';

@ApiTags('Site Visits')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, WorkspaceGuard, PermissionsGuard)
@Controller('visits')
export class VisitsController {
  constructor(private readonly visitsService: VisitsService) {}

  @Post()
  @RequirePermissions('visits:create')
  @ApiOperation({ summary: 'Schedule a site visit' })
  async create(
    @WorkspaceId() workspaceId: string,
    @Body() dto: { leadId: string; propertyId?: string; agentId: string; scheduledAt: string; driverName?: string; driverPhone?: string; pickupAddress?: string; notes?: string },
  ) {
    return this.visitsService.create(workspaceId, dto);
  }

  @Get()
  @RequirePermissions('visits:view')
  @ApiOperation({ summary: 'List site visits' })
  async findAll(
    @WorkspaceId() workspaceId: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('status') status?: string,
    @Query('agentId') agentId?: string,
    @Query('date') date?: string,
  ) {
    return this.visitsService.findAll(workspaceId, { page, limit, status, agentId, date });
  }

  @Get('today')
  @RequirePermissions('visits:view')
  @ApiOperation({ summary: "Get today's schedule" })
  async getTodaySchedule(
    @WorkspaceId() workspaceId: string,
    @Query('agentId') agentId?: string,
  ) {
    return this.visitsService.getTodaySchedule(workspaceId, agentId);
  }

  @Get('calendar')
  @RequirePermissions('visits:view')
  @ApiOperation({ summary: 'Get calendar view for a month' })
  async getCalendarView(
    @WorkspaceId() workspaceId: string,
    @Query('month') month: number,
    @Query('year') year: number,
  ) {
    return this.visitsService.getCalendarView(workspaceId, month, year);
  }

  @Get(':id')
  @RequirePermissions('visits:view')
  @ApiOperation({ summary: 'Get visit details' })
  async findById(@Param('id') id: string, @WorkspaceId() workspaceId: string) {
    return this.visitsService.findById(id, workspaceId);
  }

  @Put(':id/status')
  @RequirePermissions('visits:manage')
  @ApiOperation({ summary: 'Update visit status' })
  async updateStatus(
    @Param('id') id: string,
    @WorkspaceId() workspaceId: string,
    @Body() dto: { status: string },
  ) {
    return this.visitsService.updateStatus(id, workspaceId, dto.status);
  }

  @Post(':id/feedback')
  @RequirePermissions('visits:manage')
  @ApiOperation({ summary: 'Add visit feedback' })
  async addFeedback(
    @Param('id') id: string,
    @WorkspaceId() workspaceId: string,
    @Body() dto: { feedback: string; rating?: number; photos?: string[] },
  ) {
    return this.visitsService.addFeedback(id, workspaceId, dto);
  }

  @Put(':id/reschedule')
  @RequirePermissions('visits:manage')
  @ApiOperation({ summary: 'Reschedule a visit' })
  async reschedule(
    @Param('id') id: string,
    @WorkspaceId() workspaceId: string,
    @Body() dto: { scheduledAt: string },
  ) {
    return this.visitsService.reschedule(id, workspaceId, dto.scheduledAt);
  }
}
