import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../common/prisma/prisma.service';

const GRAPH = 'https://graph.facebook.com/v21.0';

/**
 * Captures people who comment on your own Facebook Page / Instagram posts and
 * lets you send them one private DM per comment.
 *
 * Two hard limits set by Meta, not by this code:
 *  - A comment does not open a normal messaging window. The private_replies
 *    endpoint must be used instead.
 *  - One private reply per comment, within 7 days of the comment.
 *
 * Commenters do not share a phone number, so these leads carry a profile
 * handle only. They are stored as contactable-by-DM, not callable.
 */
@Injectable()
export class MetaCommentsService {
  private readonly logger = new Logger(MetaCommentsService.name);

  constructor(
    private configService: ConfigService,
    private prisma: PrismaService,
  ) {}

  private get token(): string | undefined {
    return this.configService.get<string>('META_PAGE_ACCESS_TOKEN');
  }

  private get pageId(): string | undefined {
    return this.configService.get<string>('META_PAGE_ID');
  }

  private get igUserId(): string | undefined {
    return this.configService.get<string>('META_IG_USER_ID');
  }

  private requireToken(): string {
    const t = this.token;
    if (!t) {
      throw new BadRequestException(
        'META_PAGE_ACCESS_TOKEN is not set. Needs pages_read_engagement, pages_manage_engagement, ' +
          'and instagram_manage_comments for Instagram.',
      );
    }
    return t;
  }

  private async call<T = any>(
    path: string,
    params: Record<string, string> = {},
    method: 'GET' | 'POST' = 'GET',
  ): Promise<T> {
    const axios = (await import('axios')).default;
    const url = `${GRAPH}/${path.replace(/^\//, '')}`;
    const withToken = { ...params, access_token: this.requireToken() };

    try {
      const res =
        method === 'GET'
          ? await axios.get(url, { params: withToken, timeout: 30000 })
          : await axios.post(url, withToken, { timeout: 30000 });
      return res.data;
    } catch (e: any) {
      const err = e?.response?.data?.error;
      throw new BadRequestException(
        `Meta API error on ${path}: ${err?.message || e.message}` +
          (err?.code ? ` (code ${err.code})` : ''),
      );
    }
  }

  /**
   * Reads recent comments on the Page's posts and on Instagram media,
   * recording each commenter as a lead.
   */
  async syncComments(workspaceId: string, opts?: { limit?: number }) {
    const limit = String(opts?.limit ?? 25);
    const found: any[] = [];
    const errors: string[] = [];

    if (this.pageId) {
      try {
        const posts = await this.call<{ data: any[] }>(`${this.pageId}/posts`, {
          fields: `id,message,created_time,comments.limit(50){id,message,created_time,from{id,name}}`,
          limit,
        });

        for (const post of posts.data || []) {
          for (const c of post.comments?.data || []) {
            found.push({
              platform: 'facebook',
              commentId: c.id,
              postId: post.id,
              text: c.message || '',
              userId: c.from?.id || null,
              userName: c.from?.name || 'Facebook user',
              createdTime: c.created_time,
            });
          }
        }
      } catch (e: any) {
        errors.push(`facebook: ${e.message}`);
      }
    }

    if (this.igUserId) {
      try {
        const media = await this.call<{ data: any[] }>(`${this.igUserId}/media`, {
          fields: `id,caption,timestamp,comments.limit(50){id,text,timestamp,username,from{id,username}}`,
          limit,
        });

        for (const m of media.data || []) {
          for (const c of m.comments?.data || []) {
            found.push({
              platform: 'instagram',
              commentId: c.id,
              postId: m.id,
              text: c.text || '',
              userId: c.from?.id || null,
              userName: c.username || c.from?.username || 'Instagram user',
              createdTime: c.timestamp,
            });
          }
        }
      } catch (e: any) {
        errors.push(`instagram: ${e.message}`);
      }
    }

    if (!this.pageId && !this.igUserId) {
      throw new BadRequestException('Set META_PAGE_ID and/or META_IG_USER_ID in .env');
    }

    // Record commenters as leads, skipping ones already stored.
    const admin = await this.prisma.user.findFirst({
      where: {
        workspaces: { some: { workspaceId } },
        role: { in: ['SUPER_ADMIN', 'BUILDER', 'SALES_MANAGER'] },
      },
      select: { id: true },
    });

    if (!admin) {
      throw new BadRequestException('No admin user in this workspace to attribute leads to');
    }

    let created = 0;
    let skipped = 0;

    for (const c of found) {
      try {
        const exists = await this.prisma.lead.findFirst({
          where: { workspaceId, customFields: { path: ['commentId'], equals: c.commentId } },
          select: { id: true },
        });
        if (exists) {
          skipped++;
          continue;
        }

        const ageDays = (Date.now() - new Date(c.createdTime).getTime()) / 86400000;

        await this.prisma.lead.create({
          data: {
            workspaceId,
            createdById: admin.id,
            name: c.userName,
            // Commenters never expose a phone number.
            phone: '',
            source: c.platform === 'instagram' ? 'INSTAGRAM' : 'FACEBOOK',
            status: 'NEW',
            tags: ['comment', c.platform],
            customFields: {
              commentId: c.commentId,
              postId: c.postId,
              commentText: c.text,
              platformUserId: c.userId,
              platformUserName: c.userName,
              commentedAt: c.createdTime,
              // Private replies are only allowed for 7 days after the comment.
              dmWindowOpen: ageDays < 7,
              contactMethod: 'dm_only',
            } as any,
          },
        });
        created++;
      } catch (e: any) {
        errors.push(`comment ${c.commentId}: ${e.message}`);
      }
    }

    this.logger.log(`Comment sync: ${found.length} comments, ${created} new leads, ${skipped} known`);

    return {
      commentsSeen: found.length,
      leadsCreated: created,
      alreadyKnown: skipped,
      errors: errors.slice(0, 10),
    };
  }

  /**
   * Sends the single private DM Meta allows per comment.
   * Fails if the comment is older than 7 days or already replied to.
   */
  async privateReply(commentId: string, message: string) {
    if (!message?.trim()) {
      throw new BadRequestException('message is required');
    }

    const lead = await this.prisma.lead.findFirst({
      where: { customFields: { path: ['commentId'], equals: commentId } },
    });

    try {
      const res = await this.call(
        `${commentId}/private_replies`,
        { message: message.trim() },
        'POST',
      );

      if (lead) {
        const cf = (lead.customFields || {}) as Record<string, any>;
        await this.prisma.lead.update({
          where: { id: lead.id },
          data: {
            status: 'CONTACTED',
            customFields: { ...cf, dmSentAt: new Date().toISOString(), dmMessage: message } as any,
          },
        });
      }

      return { sent: true, response: res };
    } catch (e: any) {
      // The most common cause by far is the 7-day window having closed.
      throw new BadRequestException(
        `${e.message} — Meta allows one private reply per comment, within 7 days of it being posted.`,
      );
    }
  }

  /** Public reply on the comment thread itself. */
  async publicReply(commentId: string, message: string) {
    if (!message?.trim()) throw new BadRequestException('message is required');
    const res = await this.call(`${commentId}/comments`, { message: message.trim() }, 'POST');
    return { replied: true, response: res };
  }
}
