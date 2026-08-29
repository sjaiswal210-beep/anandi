import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { promises as fs } from 'fs';
import * as path from 'path';

/**
 * Generates voice audio from text using Sarvam TTS (Bulbul v2).
 * Falls back to Vobiz's built-in <Speak> if Sarvam key is not set.
 */
@Injectable()
export class TtsService {
  private readonly logger = new Logger(TtsService.name);

  constructor(private configService: ConfigService) {}

  private get sarvamKey(): string | undefined {
    return this.configService.get<string>('SARVAM_API_KEY');
  }

  private get uploadDir(): string {
    const appRoot = process.cwd().includes(`apps${path.sep}api`)
      ? process.cwd().replace(/[/\\]apps[/\\]api.*/, '')
      : process.cwd().replace(/[/\\]dist.*/, '');
    return path.join(appRoot, 'uploads', 'tts');
  }

  get isConfigured(): boolean {
    return Boolean(this.sarvamKey);
  }

  /**
   * Generate a human-sounding WAV from text using Sarvam TTS.
   * Returns the public URL path to the generated audio.
   */
  async generate(dto: {
    text: string;
    language?: string;
    speaker?: string;
    pace?: number;
  }): Promise<{ url: string; filePath: string; duration?: number }> {
    if (!this.sarvamKey) {
      throw new BadRequestException(
        'SARVAM_API_KEY is not set in .env. Get a free key from dashboard.sarvam.ai.',
      );
    }

    if (!dto.text?.trim() || dto.text.trim().length < 10) {
      throw new BadRequestException('Script must be at least 10 characters.');
    }

    const text = dto.text.trim().slice(0, 2000);
    const lang = dto.language || 'hi-IN';

    // Map short codes to Sarvam language codes
    const langMap: Record<string, string> = {
      'hi-IN': 'hi-IN',
      'mr-IN': 'mr-IN',
      'en-IN': 'en-IN',
      'hi': 'hi-IN',
      'mr': 'mr-IN',
      'en': 'en-IN',
    };
    const targetLang = langMap[lang] || 'hi-IN';
    const speaker = dto.speaker || 'shreya';

    // Language-specific pacing defaults (Marathi is best at 1.2x, Hindi/others at 1.0x)
    const defaultPace = targetLang === 'mr-IN' ? 1.2 : 1.0;
    const pace = dto.pace !== undefined ? dto.pace : defaultPace;

    const axios = (await import('axios')).default;

    try {
      const res = await axios.post(
        'https://api.sarvam.ai/text-to-speech',
        {
          inputs: [text],
          target_language_code: targetLang,
          speaker,
          model: 'bulbul:v3',
          pace,
        },
        {
          headers: { 'api-subscription-key': this.sarvamKey },
          timeout: 60000,
        },
      );

      const audioB64 = res.data?.audios?.[0];
      if (!audioB64) {
        throw new BadRequestException('Sarvam returned no audio data.');
      }

      const buf = Buffer.from(audioB64, 'base64');
      const fileName = `voice-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}.wav`;
      await fs.mkdir(this.uploadDir, { recursive: true });
      const filePath = path.join(this.uploadDir, fileName);
      await fs.writeFile(filePath, buf);

      this.logger.log(`TTS generated: ${fileName} (${Math.round(buf.length / 1024)} KB)`);

      return {
        url: `/uploads/tts/${fileName}`,
        filePath,
      };
    } catch (e: any) {
      const detail = e?.response?.data?.error?.message || e?.message || 'Unknown error';
      this.logger.error(`Sarvam TTS failed: ${detail}`);
      throw new BadRequestException(`Voice generation failed: ${detail}`);
    }
  }

  /** List previously generated voice files. */
  async listGenerated(): Promise<{ name: string; url: string; size: number }[]> {
    try {
      const files = await fs.readdir(this.uploadDir);
      const wavFiles = files.filter((f) => f.startsWith('voice-') && f.endsWith('.wav'));
      const results = await Promise.all(
        wavFiles.map(async (f) => {
          const stat = await fs.stat(path.join(this.uploadDir, f));
          return { name: f, url: `/uploads/tts/${f}`, size: stat.size };
        }),
      );
      return results.sort((a, b) => b.name.localeCompare(a.name)); // newest first
    } catch {
      return [];
    }
  }
}
