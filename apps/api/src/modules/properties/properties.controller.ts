import { Controller, Get, Post, Put, Delete, Param, Body, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { PropertiesService } from './properties.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { WorkspaceGuard } from '../../common/guards/workspace.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { WorkspaceId } from '../../common/decorators/workspace.decorator';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';

@ApiTags('Properties')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, WorkspaceGuard, PermissionsGuard)
@Controller('properties')
export class PropertiesController {
  constructor(private readonly propertiesService: PropertiesService) {}

  @Post()
  @RequirePermissions('properties:create')
  @ApiOperation({ summary: 'Create property' })
  async create(@WorkspaceId() workspaceId: string, @Body() dto: any) {
    return this.propertiesService.create(workspaceId, dto);
  }

  @Get()
  @RequirePermissions('properties:view')
  @ApiOperation({ summary: 'List properties with filters' })
  async findAll(
    @WorkspaceId() workspaceId: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('search') search?: string,
    @Query('type') type?: string,
    @Query('status') status?: string,
    @Query('city') city?: string,
    @Query('minPrice') minPrice?: number,
    @Query('maxPrice') maxPrice?: number,
    @Query('bedrooms') bedrooms?: number,
    @Query('projectId') projectId?: string,
    @Query('sortBy') sortBy?: string,
    @Query('sortOrder') sortOrder?: string,
  ) {
    return this.propertiesService.findAll(workspaceId, { page, limit, search, type, status, city, minPrice, maxPrice, bedrooms, projectId, sortBy, sortOrder });
  }

  @Get('projects')
  @RequirePermissions('properties:view')
  @ApiOperation({ summary: 'List all projects' })
  async getProjects(@WorkspaceId() workspaceId: string) {
    return this.propertiesService.getProjects(workspaceId);
  }

  @Post('projects')
  @RequirePermissions('properties:create')
  @ApiOperation({ summary: 'Create a project' })
  async createProject(@WorkspaceId() workspaceId: string, @Body() dto: any) {
    return this.propertiesService.createProject(workspaceId, dto);
  }

  @Get('inventory/:projectId')
  @RequirePermissions('properties:view')
  @ApiOperation({ summary: 'Get visual inventory for a project' })
  async getInventory(@WorkspaceId() workspaceId: string, @Param('projectId') projectId: string) {
    return this.propertiesService.getInventory(workspaceId, projectId);
  }

  @Get(':id')
  @RequirePermissions('properties:view')
  @ApiOperation({ summary: 'Get property details' })
  async findById(@Param('id') id: string, @WorkspaceId() workspaceId: string) {
    return this.propertiesService.findById(id, workspaceId);
  }

  @Put(':id')
  @RequirePermissions('properties:edit')
  @ApiOperation({ summary: 'Update property' })
  async update(@Param('id') id: string, @WorkspaceId() workspaceId: string, @Body() dto: any) {
    return this.propertiesService.update(id, workspaceId, dto);
  }

  @Delete(':id')
  @RequirePermissions('properties:delete')
  @ApiOperation({ summary: 'Delete property' })
  async delete(@Param('id') id: string, @WorkspaceId() workspaceId: string) {
    return this.propertiesService.delete(id, workspaceId);
  }

  @Put('units/:unitId/status')
  @RequirePermissions('properties:edit')
  @ApiOperation({ summary: 'Update unit status' })
  async updateUnitStatus(@Param('unitId') unitId: string, @Body() dto: { status: string }) {
    return this.propertiesService.updateUnitStatus(unitId, dto.status);
  }
}
