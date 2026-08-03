import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { promises as fs } from 'fs';
import * as path from 'path';

/**
 * Generates advertising images for the plotting project using Gemini's
 * native image models.
 *
 * Uses the REST endpoint rather than the SDK so the model name and the
 * responseModalities config can be controlled exactly — the installed
 * @google/generative-ai SDK predates image output.
 */
@Injectable()
export class SocialImageService {
  private readonly logger = new Logger(SocialImageService.name);

  // Tried in order. The account's key may not have access to all of them,
  // so a 404/403 on one falls through to the next.
  private readonly candidateModels = [
    'gemini-3.1-flash-image',
    'gemini-2.5-flash-image',
    'gemini-2.5-flash-image-preview',
    'gemini-2.0-flash-preview-image-generation',
  ];

  // Remembered after the first success so later calls skip the probing.
  private workingModel: string | null = null;

  constructor(private configService: ConfigService) {}

  private get apiKey(): string | undefined {
    return this.configService.get<string>('GEMINI_API_KEY');
  }

  private get models(): string[] {
    const override = this.configService.get<string>('GEMINI_IMAGE_MODEL');
    if (this.workingModel) return [this.workingModel];
    return override ? [override, ...this.candidateModels] : this.candidateModels;
  }

  /** Where generated images live on disk. */
  private get uploadDir(): string {
    const appRoot = process.cwd().includes(`apps${path.sep}api`)
      ? process.cwd().replace(/[/\\]apps[/\\]api.*/, '')
      : process.cwd().replace(/[/\\]dist.*/, '');
    return path.join(appRoot, 'uploads', 'social');
  }

  /**
   * Builds an ad-style prompt anchored to the real project details so the
   * output is usable marketing material rather than generic stock imagery.
   */
  buildAdPrompt(input: {
    topic: string;
    platform?: string;
    style?: string;
    headline?: string;
  }): string {
    const square = (input.platform || '').toUpperCase() === 'INSTAGRAM';

    return [
      'Create a photorealistic real estate advertisement image.',
      '',
      'PROJECT: Anandi Park — premium NA residential plots (land plotting project)',
      'DEVELOPER: Yuvraj Gade & Rajan Kute Developers',
      'LOCATION: Village Bakori, Wagholi-Bakori Road, Taluka Haveli, Pune, Maharashtra, India',
      'SELLING POINTS: RERA registered, clear titles, gated layout, wide internal roads,',
      'ready for construction, prices from Rs 15 Lakh',
      '',
      `AD FOCUS: ${input.topic}`,
      input.headline ? `HEADLINE TEXT TO RENDER: "${input.headline}"` : '',
      '',
      'VISUAL DIRECTION:',
      '- Aerial or eye-level view of a well-planned Indian plotted land development',
      '- Demarcated empty residential plots with paved internal roads and boundary markers',
      '- Lush green surroundings, clear blue sky, warm golden-hour light',
      '- A few modern under-construction Indian homes at the edges for aspiration',
      '- Clean, premium, trustworthy brochure aesthetic',
      `- ${square ? 'Square 1:1 composition for Instagram' : 'Landscape 16:9 composition for Facebook'}`,
      `- Style: ${input.style || 'bright, premium, professional real estate marketing'}`,
      '',
      'RULES:',
      '- Photorealistic, not illustration or cartoon',
      '- Any text must be spelled correctly in English and kept minimal',
      '- Do not invent a logo or a fake RERA number',
      '- No watermarks, no stock-photo branding, no distorted text',
    ]
      .filter(Boolean)
      .join('\n');
  }

  /**
   * Generates one image and writes it to disk.
   * Returns a URL path served by the API under /uploads.
   */
  async generateAdImage(input: {
    topic: string;
    platform?: string;
    style?: string;
    headline?: string;
    prompt?: string;
  }): Promise<{ url: string; filePath: string; model: string; prompt: string }> {
    if (!this.apiKey) {
      throw new BadRequestException(
        'GEMINI_API_KEY is not set, so ad images cannot be generated.',
      );
    }

    const prompt = input.prompt?.trim() || this.buildAdPrompt(input);
    const axios = (await import('axios')).default;

    const failures: string[] = [];

    for (const model of this.models) {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;

      try {
        const res = await axios.post(
          url,
          {
            contents: [{ role: 'user', parts: [{ text: prompt }] }],
            generationConfig: { responseModalities: ['TEXT', 'IMAGE'] },
          },
          {
            headers: {
              'Content-Type': 'application/json',
              'x-goog-api-key': this.apiKey,
            },
            timeout: 120000,
          },
        );

        const parts = res.data?.candidates?.[0]?.content?.parts ?? [];
        const imagePart = parts.find(
          (p: any) => p?.inlineData?.data || p?.inline_data?.data,
        );
        const inline = imagePart?.inlineData || imagePart?.inline_data;

        if (!inline?.data) {
          failures.push(`${model}: responded without image data`);
          continue;
        }

        const mime: string = inline.mimeType || inline.mime_type || 'image/png';
        const ext = mime.includes('jpeg') ? 'jpg' : 'png';
        const fileName = `ad-${Date.now().toString(36)}-${Math.random()
          .toString(36)
          .slice(2, 7)}.${ext}`;

        await fs.mkdir(this.uploadDir, { recursive: true });
        const filePath = path.join(this.uploadDir, fileName);
        await fs.writeFile(filePath, Buffer.from(inline.data, 'base64'));

        this.workingModel = model;
        this.logger.log(`Generated ad image with ${model}: ${fileName}`);

        return {
          url: `/uploads/social/${fileName}`,
          filePath,
          model,
          prompt,
        };
      } catch (e: any) {
        const status = e?.response?.status;
        const detail =
          e?.response?.data?.error?.message || e?.message || 'unknown error';
        failures.push(`${model}: ${status ?? ''} ${detail}`.trim());

        // A quota/permission problem will repeat on every model — stop early.
        if (status === 429) {
          throw new BadRequestException(
            `Gemini image quota exceeded. Image models are a paid tier. Detail: ${detail}`,
          );
        }
      }
    }

    this.logger.warn(`All image models failed:\n${failures.join('\n')}`);
    throw new BadRequestException(
      `Could not generate an image. Tried ${this.models.length} model(s). ` +
        `Gemini image generation needs billing enabled on the API key. Details: ${failures.join(' | ')}`,
    );
  }

  /** Generates several variations of the same ad concept. */
  async generateVariations(
    input: { topic: string; platform?: string; style?: string; headline?: string },
    count = 3,
  ) {
    const results: { url: string; model: string }[] = [];
    const errors: string[] = [];

    for (let i = 0; i < Math.min(count, 4); i++) {
      try {
        const r = await this.generateAdImage(input);
        results.push({ url: r.url, model: r.model });
      } catch (e: any) {
        errors.push(e?.message || 'failed');
        break; // don't burn quota once one fails
      }
    }

    if (results.length === 0) {
      throw new BadRequestException(errors[0] || 'Image generation failed');
    }

    return { images: results, errors };
  }
}
