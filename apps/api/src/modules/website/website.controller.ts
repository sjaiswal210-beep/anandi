import { Controller, Get, Post, Put, Param, Body, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { WebsiteService } from './website.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { WorkspaceGuard } from '../../common/guards/workspace.guard';
import { WorkspaceId } from '../../common/decorators/workspace.decorator';
import { Public } from '../../common/decorators/public.decorator';

@ApiTags('Website')
@Controller('website')
export class WebsiteController {
  constructor(private readonly websiteService: WebsiteService) {}

  // Admin endpoints
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, WorkspaceGuard)
  @Get('config')
  @ApiOperation({ summary: 'Get website configuration' })
  async getConfig(@WorkspaceId() workspaceId: string) {
    return this.websiteService.getConfig(workspaceId);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, WorkspaceGuard)
  @Post('config')
  @ApiOperation({ summary: 'Create or update website config' })
  async createOrUpdate(@WorkspaceId() workspaceId: string, @Body() dto: any) {
    return this.websiteService.createOrUpdate(workspaceId, dto);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, WorkspaceGuard)
  @Post('publish')
  @ApiOperation({ summary: 'Publish website' })
  async publish(@WorkspaceId() workspaceId: string) {
    return this.websiteService.publish(workspaceId);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, WorkspaceGuard)
  @Post('unpublish')
  @ApiOperation({ summary: 'Unpublish website' })
  async unpublish(@WorkspaceId() workspaceId: string) {
    return this.websiteService.unpublish(workspaceId);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, WorkspaceGuard)
  @Get('templates')
  @ApiOperation({ summary: 'Get available page templates' })
  async getTemplates() {
    return this.websiteService.getPageTemplates();
  }

  // Public endpoints
  @Public()
  @Get('public/:subdomain')
  @ApiOperation({ summary: 'Get public website data' })
  async getPublicWebsite(@Param('subdomain') subdomain: string) {
    return this.websiteService.getPublicWebsite(subdomain);
  }

  @Public()
  @Post('public/:subdomain/inquiry')
  @ApiOperation({ summary: 'Submit an inquiry from public website' })
  async submitInquiry(
    @Param('subdomain') subdomain: string,
    @Body() dto: { name: string; phone: string; email?: string; message?: string; propertyId?: string; source?: string },
  ) {
    return this.websiteService.submitInquiry(subdomain, dto);
  }
}
