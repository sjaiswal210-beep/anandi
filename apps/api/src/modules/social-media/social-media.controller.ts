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
  @ApiOperation({ summary: 'Generate social media caption + AI ad image' })
  async generate(
    @WorkspaceId() workspaceId: string,
    @Body() dto: { platform: string; topic: string; style?: string; withImage?: boolean },
  ) {
    return this.service.generateContent(workspaceId, dto);
  }

  @Post('generate-image')
  @ApiOperation({ summary: 'Generate AI ad image(s) without creating a post' })
  async generateImage(
    @Body() dto: { topic: string; platform?: string; style?: string; headline?: string; count?: number },
  ) {
    return this.service.generateAdImage(dto);
  }

  @Post(':id/image')
  @ApiOperation({ summary: 'Generate or regenerate the ad image for a post' })
  async postImage(@Param('id') id: string, @Body() dto: { style?: string; prompt?: string }) {
    return this.service.generateImageForPost(id, dto);
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
