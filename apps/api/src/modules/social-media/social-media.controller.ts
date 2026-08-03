import { Controller, Get, Post, Put, Param, Body, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { SocialMediaService } from './social-media.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { WorkspaceGuard } from '../../common/guards/workspace.guard';
import { WorkspaceId } from '../../common/decorators/workspace.decorator';

@ApiTags('Social Media')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, WorkspaceGuard)
@Controller('social-media')
export class SocialMediaController {
  constructor(private readonly service: SocialMediaService) {}

  @Post('generate')
  @ApiOperation({ summary: 'Generate social media content with AI' })
  async generate(@WorkspaceId() workspaceId: string, @Body() dto: { platform: string; topic: string; style?: string }) {
    return this.service.generateContent(workspaceId, dto);
  }

  @Get('posts')
  @ApiOperation({ summary: 'Get all posts' })
  async getPosts(@WorkspaceId() workspaceId: string, @Query('status') status?: string) {
    return this.service.getPosts(workspaceId, status);
  }

  @Put(':id/schedule')
  @ApiOperation({ summary: 'Schedule a post' })
  async schedule(@Param('id') id: string, @Body() dto: { scheduledAt: string }) {
    return this.service.schedulePost(id, dto.scheduledAt);
  }

  @Post(':id/publish')
  @ApiOperation({ summary: 'Publish a post now' })
  async publish(@Param('id') id: string) {
    return this.service.publishPost(id);
  }
}
