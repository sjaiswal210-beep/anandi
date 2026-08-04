import { Controller, Get, Post, Body, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { MetaLeadsService } from './meta-leads.service';
import { MetaCommentsService } from './meta-comments.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { WorkspaceGuard } from '../../common/guards/workspace.guard';
import { WorkspaceId } from '../../common/decorators/workspace.decorator';
import { Public } from '../../common/decorators/public.decorator';

@ApiTags('Meta Lead Ads')
@Controller('meta')
export class MetaLeadsController {
  constructor(
    private readonly leads: MetaLeadsService,
    private readonly comments: MetaCommentsService,
  ) {}

  // Public so setup can be checked from a browser. Reports config state only,
  // never the token itself.
  @Public()
  @Get('diagnostics')
  @ApiOperation({ summary: 'Check the Meta token, page and available lead forms' })
  async diagnostics() {
    return this.leads.diagnostics();
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, WorkspaceGuard)
  @Get('forms')
  @ApiOperation({ summary: 'List lead forms on the Page' })
  async forms() {
    return this.leads.listForms();
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, WorkspaceGuard)
  @Post('poll-leads')
  @ApiOperation({ summary: 'Fetch new Lead Ads submissions into the CRM' })
  async pollLeads(
    @WorkspaceId() workspaceId: string,
    @Body() dto: { sinceHours?: number; formId?: string },
  ) {
    return this.leads.pollLeads(workspaceId, dto);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, WorkspaceGuard)
  @Post('sync-comments')
  @ApiOperation({ summary: 'Record people who commented on your posts as leads' })
  async syncComments(@WorkspaceId() workspaceId: string, @Body() dto: { limit?: number }) {
    return this.comments.syncComments(workspaceId, dto);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, WorkspaceGuard)
  @Post('private-reply')
  @ApiOperation({ summary: 'Send the one DM Meta allows per comment (7-day limit)' })
  async privateReply(@Body() dto: { commentId: string; message: string }) {
    return this.comments.privateReply(dto.commentId, dto.message);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, WorkspaceGuard)
  @Post('public-reply')
  @ApiOperation({ summary: 'Reply publicly on a comment thread' })
  async publicReply(@Body() dto: { commentId: string; message: string }) {
    return this.comments.publicReply(dto.commentId, dto.message);
  }
}
