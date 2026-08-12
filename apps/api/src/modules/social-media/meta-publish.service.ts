import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

const GRAPH = 'https://graph.facebook.com/v21.0';

/**
 * Publishes posts to Facebook Page and Instagram Business accounts via the
 * Graph API. Works end-to-end once the .env holds:
 *
 *   META_PAGE_ID            — numeric Facebook Page ID
 *   META_PAGE_ACCESS_TOKEN  — Page token with pages_manage_posts,
 *                             pages_read_engagement, instagram_basic,
 *                             instagram_content_publish
 *   META_IG_USER_ID         — Instagram Business account ID (from /me/accounts
 *                             → ig_user_id)
 *
 * Instagram media publishing is a two-step dance: first you create a container
 * giving Meta the image URL, then you publish the container. Meta needs to be
 * able to fetch the image over HTTPS, so we expose it via the API domain.
 */
@Injectable()
export class MetaPublishService {
  private readonly logger = new Logger(MetaPublishService.name);

  constructor(private configService: ConfigService) {}

  // ─────────── Config accessors ───────────

  private get token(): string | undefined {
    return this.configService.get<string>('META_PAGE_ACCESS_TOKEN');
  }

  private get pageId(): string | undefined {
    return this.configService.get<string>('META_PAGE_ID');
  }

  private get igUserId(): string | undefined {
    return this.configService.get<string>('META_IG_USER_ID');
  }

  /** The public base URL where uploads are reachable by Meta's scrapers. */
  private get publicBase(): string {
    return (
      this.configService.get<string>('API_PUBLIC_URL') ||
      'https://api.anandipark.in'
    );
  }

  // ─────────── Diagnostics ───────────

  diagnostics() {
    return {
      pageId: this.pageId ?? null,
      igUserId: this.igUserId ?? null,
      tokenSet: Boolean(this.token),
      publicBase: this.publicBase,
      ready: Boolean(this.token && this.pageId),
      igReady: Boolean(this.token && this.igUserId),
    };
  }

  // ─────────── Helpers ───────────

  private requireToken(): string {
    if (!this.token) {
      throw new BadRequestException(
        'META_PAGE_ACCESS_TOKEN not set. Add it to .env with pages_manage_posts permission.',
      );
    }
    return this.token;
  }

  private async post<T = any>(path: string, body: Record<string, unknown>): Promise<T> {
    const axios = (await import('axios')).default;
    const url = `${GRAPH}/${path.replace(/^\//, '')}`;
    try {
      const res = await axios.post(url, body, {
        params: { access_token: this.requireToken() },
        timeout: 60000,
      });
      return res.data;
    } catch (e: any) {
      const msg = e?.response?.data?.error?.message || e.message;
      this.logger.error(`Meta publish error on ${path}: ${msg}`);
      throw new BadRequestException(`Meta API: ${msg}`);
    }
  }

  /** Turns a local uploads path into a fully qualified HTTPS URL Meta can fetch. */
  resolveImageUrl(localPath: string): string {
    // localPath looks like "/uploads/social/ad-xxx.jpg" (relative to the API).
    // Strip any leading slash to avoid double-slash.
    const clean = localPath.replace(/^\//, '');
    return `${this.publicBase}/${clean}`;
  }

  // ─────────── Facebook Page publish ───────────

  /**
   * Posts a photo + caption to the Facebook Page.
   * Returns the published post ID.
   */
  async publishToFacebook(opts: {
    caption: string;
    imageUrl: string;
  }): Promise<{ id: string; url: string }> {
    const pageId = this.pageId;
    if (!pageId) {
      throw new BadRequestException('META_PAGE_ID not set in .env');
    }

    const data = await this.post<{ id: string; post_id?: string }>(`${pageId}/photos`, {
      url: opts.imageUrl,
      caption: opts.caption,
      published: true,
    });

    const postId = data.post_id || data.id;
    return {
      id: postId,
      url: `https://facebook.com/${postId}`,
    };
  }

  // ─────────── Instagram publish ───────────

  /**
   * Two-step Instagram publish:
   *  1. Create a media container (Meta fetches and caches the image).
   *  2. Publish the container.
   */
  async publishToInstagram(opts: {
    caption: string;
    imageUrl: string;
  }): Promise<{ id: string; url: string }> {
    const igId = this.igUserId;
    if (!igId) {
      throw new BadRequestException(
        'META_IG_USER_ID not set in .env. Link your Instagram Business account to the Page, ' +
          'then add the Instagram Business ID.',
      );
    }

    // Step 1: create container
    const container = await this.post<{ id: string }>(`${igId}/media`, {
      image_url: opts.imageUrl,
      caption: opts.caption,
    });

    // Meta needs a moment to process the image (~5-15s). Poll until ready.
    await this.waitForContainer(container.id);

    // Step 2: publish
    const publish = await this.post<{ id: string }>(`${igId}/media_publish`, {
      creation_id: container.id,
    });

    return {
      id: publish.id,
      url: `https://instagram.com/p/${publish.id}`, // approximate; IG doesn't return permalink in this call
    };
  }

  /**
   * Polls a container until its status is FINISHED. IG can take up to 30-60s
   * for large images, but our 1080px JPGs are quick.
   */
  private async waitForContainer(containerId: string, maxAttempts = 15): Promise<void> {
    const axios = (await import('axios')).default;
    for (let i = 0; i < maxAttempts; i++) {
      await new Promise((r) => setTimeout(r, 3000));
      try {
        const res = await axios.get(`${GRAPH}/${containerId}`, {
          params: { fields: 'status_code', access_token: this.requireToken() },
          timeout: 15000,
        });
        const status = res.data.status_code;
        if (status === 'FINISHED') return;
        if (status === 'ERROR') {
          throw new Error('Instagram rejected the media container');
        }
      } catch (e: any) {
        if (e.message.includes('rejected')) throw e;
        // network flake, keep trying
      }
    }
    throw new BadRequestException('Instagram media container did not finish processing in time');
  }

  // ─────────── Unified publish ───────────

  /**
   * Publishes to one or both platforms based on what's configured.
   * Returns platform-keyed results.
   */
  async publish(opts: {
    platform: string;
    caption: string;
    localImagePath: string;
  }): Promise<{
    facebook?: { id: string; url: string; error?: string };
    instagram?: { id: string; url: string; error?: string };
  }> {
    const imageUrl = this.resolveImageUrl(opts.localImagePath);
    const result: Record<string, any> = {};
    const platform = opts.platform.toUpperCase();

    if (platform === 'FACEBOOK' || platform === 'BOTH') {
      try {
        result.facebook = await this.publishToFacebook({
          caption: opts.caption,
          imageUrl,
        });
      } catch (e: any) {
        result.facebook = { id: '', url: '', error: e.message };
      }
    }

    if (platform === 'INSTAGRAM' || platform === 'BOTH') {
      try {
        result.instagram = await this.publishToInstagram({
          caption: opts.caption,
          imageUrl,
        });
      } catch (e: any) {
        result.instagram = { id: '', url: '', error: e.message };
      }
    }

    // Default: match platform name
    if (!result.facebook && !result.instagram) {
      if (this.pageId) {
        try {
          result.facebook = await this.publishToFacebook({
            caption: opts.caption,
            imageUrl,
          });
        } catch (e: any) {
          result.facebook = { id: '', url: '', error: e.message };
        }
      }
      if (this.igUserId) {
        try {
          result.instagram = await this.publishToInstagram({
            caption: opts.caption,
            imageUrl,
          });
        } catch (e: any) {
          result.instagram = { id: '', url: '', error: e.message };
        }
      }
    }

    return result;
  }
}
