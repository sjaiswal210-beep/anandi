import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../common/prisma/prisma.service';

@Injectable()
export class SocialMediaService {
  private readonly logger = new Logger(SocialMediaService.name);
  private geminiModel: any = null;

  constructor(private prisma: PrismaService, private configService: ConfigService) {
    this.initGemini();
  }

  private async initGemini() {
    try {
      const { GoogleGenerativeAI } = await import('@google/generative-ai');
      const apiKey = this.configService.get<string>('GEMINI_API_KEY');
      if (apiKey) {
        const genAI = new GoogleGenerativeAI(apiKey);
        this.geminiModel = genAI.getGenerativeModel({ model: this.configService.get<string>('GEMINI_MODEL', 'gemini-2.5-flash') });
      }
    } catch (e) { this.logger.error('Gemini init failed'); }
  }

  async generateContent(workspaceId: string, dto: { platform: string; topic: string; style?: string }) {
    const prompt = `Create a ${dto.platform} post for a real estate plotting project.
Topic: ${dto.topic}
Style: ${dto.style || 'professional, engaging'}
Project: Anandi Park - Premium NA plots by Yuraj & Rajan Developers, starting ₹15 Lakh, Pune area, RERA registered.

Return a JSON object with:
- caption: The post caption with emojis (max 300 chars for Instagram, 500 for Facebook)
- hashtags: Array of 10 relevant hashtags
- imagePrompt: A description for an AI image generator (photorealistic property marketing)
- bestTime: Best time to post (IST)
- contentType: image/carousel/reel`;

    let content = { caption: '', hashtags: [] as string[], imagePrompt: '', bestTime: '10:00 AM IST', contentType: 'image' };

    if (this.geminiModel) {
      try {
        const result = await this.geminiModel.generateContent(prompt);
        const text = result.response.text();
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (jsonMatch) content = JSON.parse(jsonMatch[0]);
        else content.caption = text;
      } catch (e: any) {
        content.caption = `🏡 ${dto.topic}\n\nAnandi Park - Premium NA plots by Yuraj & Rajan Developers\n💰 Starting ₹15 Lakh\n📍 Pune, Maharashtra\n✅ RERA registered | Clear titles\n\nBook your site visit today!\n📞 Call now`;
        content.hashtags = ['#AnandiPark', '#NAPlots', '#PuneRealEstate', '#PlotForSale', '#Investment', '#YurajRajanDevelopers', '#LandForSale', '#DreamPlot', '#PunePlots', '#RERARegistered'];
      }
    }

    // Store the post
    const post = await this.prisma.socialPost.create({
      data: {
        workspaceId,
        platform: dto.platform,
        content: content.caption,
        hashtags: content.hashtags,
        mediaUrls: [`https://picsum.photos/seed/${Date.now()}/1080/1080`],
        status: 'draft',
      },
    });

    return { post, generated: content };
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
    // Stub: In production, this calls Meta Graph API
    this.logger.log(`Publishing post ${id} via adapter (stub)`);
    return this.prisma.socialPost.update({
      where: { id },
      data: { status: 'published', publishedAt: new Date(), adapterResponse: { stub: true, message: 'Published via stub adapter' } },
    });
  }
}
