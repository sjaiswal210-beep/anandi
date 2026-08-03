import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { LeadsService } from './leads.service';
import { CreateLeadDto } from './dto/create-lead.dto';
import { UpdateLeadDto } from './dto/update-lead.dto';
import { QueryLeadsDto } from './dto/query-leads.dto';
import { BulkAssignDto } from './dto/bulk-assign.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { WorkspaceGuard } from '../../common/guards/workspace.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { WorkspaceId } from '../../common/decorators/workspace.decorator';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';

@ApiTags('Leads')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, WorkspaceGuard, PermissionsGuard)
@Controller('leads')
export class LeadsController {
  constructor(private readonly leadsService: LeadsService) {}

  @Post()
  @RequirePermissions('leads:create')
  @ApiOperation({ summary: 'Create a new lead' })
  async create(
    @WorkspaceId() workspaceId: string,
    @CurrentUser('id') userId: string,
    @Body() dto: CreateLeadDto,
  ) {
    return this.leadsService.create(workspaceId, userId, dto);
  }

  @Get()
  @RequirePermissions('leads:view')
  @ApiOperation({ summary: 'Get all leads with pagination and filters' })
  async findAll(
    @WorkspaceId() workspaceId: string,
    @Query() query: QueryLeadsDto,
  ) {
    return this.leadsService.findAll(workspaceId, query);
  }

  @Get('stats')
  @RequirePermissions('leads:view')
  @ApiOperation({ summary: 'Get lead statistics' })
  async getStats(@WorkspaceId() workspaceId: string) {
    return this.leadsService.getStats(workspaceId);
  }

  @Get(':id')
  @RequirePermissions('leads:view')
  @ApiOperation({ summary: 'Get lead by ID' })
  async findById(
    @Param('id') id: string,
    @WorkspaceId() workspaceId: string,
  ) {
    return this.leadsService.findById(id, workspaceId);
  }

  @Put(':id')
  @RequirePermissions('leads:edit')
  @ApiOperation({ summary: 'Update a lead' })
  async update(
    @Param('id') id: string,
    @WorkspaceId() workspaceId: string,
    @CurrentUser('id') userId: string,
    @Body() dto: UpdateLeadDto,
  ) {
    return this.leadsService.update(id, workspaceId, userId, dto);
  }

  @Delete(':id')
  @RequirePermissions('leads:delete')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete a lead' })
  async delete(
    @Param('id') id: string,
    @WorkspaceId() workspaceId: string,
  ) {
    return this.leadsService.delete(id, workspaceId);
  }

  @Post('bulk/assign')
  @RequirePermissions('leads:assign')
  @ApiOperation({ summary: 'Bulk assign leads to an agent' })
  async bulkAssign(
    @WorkspaceId() workspaceId: string,
    @Body() dto: BulkAssignDto,
  ) {
    return this.leadsService.bulkAssign(workspaceId, dto.ids, dto.assignedToId);
  }

  @Post('bulk/status')
  @RequirePermissions('leads:edit')
  @ApiOperation({ summary: 'Bulk update lead status' })
  async bulkUpdateStatus(
    @WorkspaceId() workspaceId: string,
    @Body() dto: { ids: string[]; status: string },
  ) {
    return this.leadsService.bulkUpdateStatus(workspaceId, dto.ids, dto.status);
  }

  @Post('import')
  @RequirePermissions('leads:import')
  @ApiOperation({ summary: 'Import leads from CSV/Excel data' })
  async importLeads(
    @WorkspaceId() workspaceId: string,
    @CurrentUser('id') userId: string,
    @Body() dto: { leads: CreateLeadDto[] },
  ) {
    return this.leadsService.importLeads(workspaceId, userId, dto.leads);
  }
}
