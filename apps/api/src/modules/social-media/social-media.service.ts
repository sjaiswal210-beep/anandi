import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../common/prisma/prisma.service';
import { SocialImageService } from './social-image.service';
import { MetaPublishService } from './meta-publish.service';

const PROJECT_BLURB =
  'Anandi Park - Premium residential plots by Yuvraj Gade & Rajan Kute Developers, ' +
  'starting ₹18 Lakh, Bakori, Wagholi, Pune. Clear titles, ready for registration. ' +
  'Do not mention RERA or NA.';

@Injectable()
export class SocialMediaService {
  private readonly logger = new Logger(SocialMediaService.name);
  private geminiModel: any = null;

  constructor(
    private prisma: PrismaService,
    private configService: ConfigService,
    private imageService: SocialImageService,
    private metaPublish: MetaPublishService,
  ) {
    this.initGemini();
  }

  private async initGemini() {
    try {
      const { GoogleGenerativeAI } = await import('@google/generative-ai');
      const apiKey = this.configService.get<string>('GEMINI_API_KEY');
      if (apiKey) {
        const genAI = new GoogleGenerativeAI(apiKey);
        this.geminiModel = genAI.getGenerativeModel({ model: this.configService.get<string>('GEMINI_MODEL', 'gemini-flash-latest') });
      }
    } catch (e) { this.logger.error('Gemini init failed'); }
  }

  async generateContent(
    workspaceId: string,
    dto: { platform: string; topic: string; style?: string; withImage?: boolean },
  ) {
    const prompt = `Create a ${dto.platform} post for a real estate plotting project.
Topic: ${dto.topic}
Style: ${dto.style || 'professional, engaging'}
Project: ${PROJECT_BLURB}

Return a JSON object with:
- caption: The post caption with emojis (max 300 chars for Instagram, 500 for Facebook)
- hashtags: Array of 10 relevant hashtags
- imagePrompt: A description for an AI image generator (photorealistic property marketing)
- headline: A short punchy headline of at most 6 words to render on the ad image
- bestTime: Best time to post (IST)
- contentType: image/carousel/reel`;

    let content = { caption: '', hashtags: [] as string[], imagePrompt: '', headline: '', bestTime: '10:00 AM IST', contentType: 'image' };

    if (this.geminiModel) {
      try {
        const result = await this.geminiModel.generateContent(prompt);
        const text = result.response.text();
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (jsonMatch) content = JSON.parse(jsonMatch[0]);
        else content.caption = text;
      } catch (e: any) {
        content.caption = `🏡 ${dto.topic}\n\nAnandi Park - Premium residential plots by Yuvraj Gade & Rajan Kute Developers\n💰 Starting ₹18 Lakh\n📍 Bakori, Wagholi, Pune\n✅ Clear titles | Ready for registration\n\nBook your site visit today!\n📞 Call now`;
        content.hashtags = ['#AnandiPark', '#ResidentialPlots', '#PuneRealEstate', '#PlotForSale', '#Investment', '#WagholiPlots', '#LandForSale', '#DreamPlot', '#PunePlots', '#PuneEast'];
      }
    }

    // Generate the ad creative. A failure here must not lose the caption,
    // so the post is still saved and the reason is reported back.
    const mediaUrls: string[] = [];
    let imageError: string | null = null;
    let imageModel: string | null = null;

    if (dto.withImage !== false) {
      try {
        const img = await this.imageService.generateAdImage({
          topic: dto.topic,
          platform: dto.platform,
          style: dto.style,
          headline: content.headline,
          prompt: content.imagePrompt
            ? `${this.imageService.buildAdPrompt({ topic: dto.topic, platform: dto.platform, style: dto.style, headline: content.headline })}\n\nADDITIONAL DIRECTION: ${content.imagePrompt}`
            : undefined,
        });
        mediaUrls.push(img.url);
        imageModel = img.model;
      } catch (e: any) {
        imageError = e?.message || 'Image generation failed';
        this.logger.warn(`Ad image generation failed: ${imageError}`);
      }
    }

    const post = await this.prisma.socialPost.create({
      data: {
        workspaceId,
        platform: dto.platform,
        content: content.caption,
        hashtags: content.hashtags,
        mediaUrls,
        status: 'draft',
        adapterResponse: {
          imagePrompt: content.imagePrompt || null,
          headline: content.headline || null,
          bestTime: content.bestTime || null,
          contentType: content.contentType || 'image',
          imageModel,
          imageError,
        } as any,
      },
    });

    return { post, generated: content, imageError };
  }

  /** Generates (or regenerates) the ad image for an existing post. */
  async generateImageForPost(id: string, opts?: { style?: string; prompt?: string }) {
    const post = await this.prisma.socialPost.findUnique({ where: { id } });
    if (!post) throw new NotFoundException(`Post ${id} not found`);

    const meta = (post.adapterResponse || {}) as Record<string, any>;

    const img = await this.imageService.generateAdImage({
      topic: post.content?.slice(0, 200) || 'Anandi Park residential plots',
      platform: post.platform,
      style: opts?.style,
      headline: meta.headline || undefined,
      prompt: opts?.prompt || undefined,
    });

    return this.prisma.socialPost.update({
      where: { id },
      data: {
        // Newest first, keeping earlier variations available.
        mediaUrls: [img.url, ...(post.mediaUrls || [])].slice(0, 6),
        adapterResponse: { ...meta, imageModel: img.model, imageError: null, lastImagePrompt: img.prompt } as any,
      },
    });
  }

  /** Standalone ad image generation, not attached to a post. */
  async generateAdImage(dto: { topic: string; platform?: string; style?: string; headline?: string; count?: number }) {
    if (dto.count && dto.count > 1) {
      return this.imageService.generateVariations(dto, dto.count);
    }
    const img = await this.imageService.generateAdImage(dto);
    return { images: [{ url: img.url, model: img.model }], errors: [] };
  }

  async getPosts(workspaceId: string, status?: string) {
    return this.prisma.socialPost.findMany({
      where: { workspaceId, ...(status && { status }) },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
  }

  async schedulePost(id: string, scheduledAt: string) {
    return this.prisma.socialPost.update({
      where: { id },
      data: { status: 'scheduled', scheduledAt: new Date(scheduledAt) },
    });
  }

  async publishPost(id: string) {
    const post = await this.prisma.socialPost.findUnique({ where: { id } });
    if (!post) throw new NotFoundException(`Post ${id} not found`);

    const hasImage = post.mediaUrls?.length > 0;
    const caption = [
      post.content,
      '', // blank line before hashtags
      ...(post.hashtags || []).map((h: string) => (h.startsWith('#') ? h : `#${h}`)),
    ]
      .join('\n')
      .trim();

    let publishResult: any = { stub: true };

    if (hasImage) {
      const localImage = post.mediaUrls[0]; // e.g. "/uploads/social/ad-xxx.jpg"
      try {
        publishResult = await this.metaPublish.publish({
          platform: post.platform,
          caption,
          localImagePath: localImage,
        });
      } catch (err: any) {
        this.logger.error(`Publish failed for post ${id}: ${err.message}`);
        publishResult = { error: err.message };
      }
    } else {
      // No image — text-only posts aren't supported on IG; fall back to FB.
      publishResult = { error: 'No image attached. Instagram requires an image.' };
    }

    return this.prisma.socialPost.update({
      where: { id },
      data: {
        status: publishResult.error ? 'draft' : 'published',
        publishedAt: publishResult.error ? undefined : new Date(),
        adapterResponse: publishResult as any,
      },
    });
  }
}
