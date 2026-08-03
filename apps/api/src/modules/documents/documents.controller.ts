import { Controller, Get, Post, Delete, Param, Body, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { DocumentsService } from './documents.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { WorkspaceGuard } from '../../common/guards/workspace.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { WorkspaceId } from '../../common/decorators/workspace.decorator';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';

@ApiTags('Documents')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, WorkspaceGuard, PermissionsGuard)
@Controller('documents')
export class DocumentsController {
  constructor(private readonly documentsService: DocumentsService) {}

  @Post()
  @RequirePermissions('documents:upload')
  @ApiOperation({ summary: 'Upload a document' })
  async upload(
    @WorkspaceId() workspaceId: string,
    @Body() dto: { leadId?: string; customerId?: string; type: string; name: string; originalName: string; url: string; mimeType: string; size: number; tags?: string[] },
  ) {
    return this.documentsService.upload(workspaceId, dto);
  }

  @Get()
  @RequirePermissions('documents:view')
  @ApiOperation({ summary: 'List documents' })
  async findAll(
    @WorkspaceId() workspaceId: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('type') type?: string,
    @Query('leadId') leadId?: string,
    @Query('customerId') customerId?: string,
    @Query('search') search?: string,
  ) {
    return this.documentsService.findAll(workspaceId, { page, limit, type, leadId, customerId, search });
  }

  @Get('search')
  @RequirePermissions('documents:view')
  @ApiOperation({ summary: 'Search documents by OCR text' })
  async searchByOcr(@WorkspaceId() workspaceId: string, @Query('q') query: string) {
    return this.documentsService.searchByOcr(workspaceId, query);
  }

  @Get(':id')
  @RequirePermissions('documents:view')
  @ApiOperation({ summary: 'Get document details' })
  async findById(@Param('id') id: string, @WorkspaceId() workspaceId: string) {
    return this.documentsService.findById(id, workspaceId);
  }

  @Post(':id/versions')
  @RequirePermissions('documents:upload')
  @ApiOperation({ summary: 'Upload new version' })
  async createVersion(
    @Param('id') id: string,
    @WorkspaceId() workspaceId: string,
    @Body() dto: { url: string; name: string; originalName: string; mimeType: string; size: number },
  ) {
    return this.documentsService.createVersion(id, workspaceId, dto);
  }

  @Delete(':id')
  @RequirePermissions('documents:delete')
  @ApiOperation({ summary: 'Delete document' })
  async delete(@Param('id') id: string, @WorkspaceId() workspaceId: string) {
    return this.documentsService.delete(id, workspaceId);
  }
}
