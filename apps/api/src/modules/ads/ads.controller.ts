import { Controller, Get, Post, Put, Delete, Param, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AdsService } from './ads.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { WorkspaceGuard } from '../../common/guards/workspace.guard';
import { WorkspaceId } from '../../common/decorators/workspace.decorator';
import { Public } from '../../common/decorators/public.decorator';

@ApiTags('Ads & Costs')
@Controller('ads')
export class AdsController {
  constructor(private readonly service: AdsService) {}

  @Public()
  @Get('connection')
  @ApiOperation({ summary: 'Meta ads connection status' })
  connection() {
    return this.service.connectionInfo();
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, WorkspaceGuard)
  @Get('summary')
  @ApiOperation({ summary: 'Ad spend + analytics summary across platforms' })
  summary(@WorkspaceId() workspaceId: string) {
    return this.service.summary(workspaceId);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, WorkspaceGuard)
  @Get('campaigns')
  @ApiOperation({ summary: 'List all ad campaigns / cost entries' })
  list(@WorkspaceId() workspaceId: string) {
    return this.service.list(workspaceId);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, WorkspaceGuard)
  @Post('campaigns')
  @ApiOperation({ summary: 'Add a campaign / cost entry (any platform)' })
  create(@WorkspaceId() workspaceId: string, @Body() dto: any) {
    return this.service.create(workspaceId, dto);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, WorkspaceGuard)
  @Put('campaigns/:id')
  @ApiOperation({ summary: 'Update a campaign / cost entry' })
  update(@Param('id') id: string, @Body() dto: any) {
    return this.service.update(id, dto);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, WorkspaceGuard)
  @Delete('campaigns/:id')
  @ApiOperation({ summary: 'Delete a campaign / cost entry' })
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, WorkspaceGuard)
  @Post('sync-meta')
  @ApiOperation({ summary: 'Pull spend + insights from Meta Ads' })
  syncMeta(@WorkspaceId() workspaceId: string) {
    return this.service.syncMeta(workspaceId);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, WorkspaceGuard)
  @Post('meta/:externalId/status')
  @ApiOperation({ summary: 'Pause or resume a Meta campaign' })
  setMetaStatus(@Param('externalId') externalId: string, @Body() dto: { status: 'ACTIVE' | 'PAUSED' }) {
    return this.service.setMetaStatus(externalId, dto.status);
  }
}
