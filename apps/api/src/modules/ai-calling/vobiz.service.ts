import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

/**
 * Vobiz telephony integration.
 *
 * Vobiz uses the same API pattern as Plivo:
 *   POST https://api.vobiz.ai/api/v1/Account/{authId}/Call/
 *   Headers: X-Auth-ID, X-Auth-Token
 *
 * When the call connects, Vobiz hits our answer_url and we respond with
 * Voice XML telling it what to do (play audio, speak, gather digits, etc.).
 */
@Injectable()
export class VobizService {
  private readonly logger = new Logger(VobizService.name);
  private readonly baseUrl = 'https://api.vobiz.ai/api/v1';

  constructor(private configService: ConfigService) {}

  get authId(): string | undefined {
    return this.configService.get<string>('VOBIZ_AUTH_ID');
  }

  private get authToken(): string | undefined {
    return this.configService.get<string>('VOBIZ_AUTH_TOKEN');
  }

  get fromNumber(): string | undefined {
    return this.configService.get<string>('VOBIZ_FROM_NUMBER');
  }

  get isConfigured(): boolean {
    return Boolean(this.authId && this.authToken && this.fromNumber);
  }

  /** The public URL the VPS serves; Vobiz calls back here when the call connects. */
  private get callbackBase(): string {
    return this.configService.get<string>('VOBIZ_CALLBACK_URL') ||
      this.configService.get<string>('API_URL') ||
      'http://147.93.169.183:4000';
  }

  private requireConfig() {
    if (!this.authId || !this.authToken) {
      throw new BadRequestException(
        'VOBIZ_AUTH_ID and VOBIZ_AUTH_TOKEN must be set in .env. ' +
          'Sign up at console.vobiz.ai and copy credentials from the dashboard.',
      );
    }
    if (!this.fromNumber) {
      throw new BadRequestException(
        'VOBIZ_FROM_NUMBER must be set in .env. Buy a number from the Vobiz console DID section.',
      );
    }
  }

  /**
   * Places a single outbound call.
   * answer_url points to our XML webhook; when Vobiz connects, it fetches
   * XML instructions (play audio, gather input, etc.).
   */
  async makeCall(dto: {
    to: string;
    answerUrl?: string;
    callbackUrl?: string;
    callbackMethod?: string;
    machineDetection?: boolean;
  }): Promise<{ callUuid: string; status: string; raw: any }> {
    this.requireConfig();

    const axios = (await import('axios')).default;
    const to = this.normaliseNumber(dto.to);
    const from = this.fromNumber!;

    // Default: our own XML endpoint that plays the TTS audio and gathers DTMF.
    const answerUrl =
      dto.answerUrl || `${this.callbackBase}/api/v1/ai-calling/vobiz/answer`;

    const url = `${this.baseUrl}/Account/${this.authId}/Call/`;

    try {
      const res = await axios.post(
        url,
        {
          from,
          to,
          answer_url: answerUrl,
          answer_method: 'POST',
          hangup_url: `${this.callbackBase}/api/v1/ai-calling/vobiz/hangup`,
          hangup_method: 'POST',
          ring_timeout: 30,
          ...(dto.machineDetection && { machine_detection: 'true' }),
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'X-Auth-ID': this.authId!,
            'X-Auth-Token': this.authToken!,
          },
          timeout: 30000,
        },
      );

      const data = res.data;
      const callUuid =
        data?.request_uuid || data?.call_uuid || data?.requestUuid || '';
      this.logger.log(`Call placed to ${to}: uuid=${callUuid}`);

      return { callUuid, status: 'initiated', raw: data };
    } catch (e: any) {
      const detail = e?.response?.data || e.message;
      this.logger.error(`Vobiz call failed to ${to}: ${JSON.stringify(detail)}`);
      throw new BadRequestException(
        `Vobiz call failed: ${JSON.stringify(detail)}`,
      );
    }
  }

  /**
   * Place calls to a list of numbers in sequence (with a small gap so as not
   * to exceed Vobiz's CPS limit).
   */
  async bulkCall(
    numbers: string[],
    answerUrl?: string,
  ): Promise<{ placed: number; failed: number; results: any[] }> {
    const results: any[] = [];
    let placed = 0;
    let failed = 0;

    for (const number of numbers) {
      try {
        const r = await this.makeCall({ to: number, answerUrl });
        results.push({ number, callUuid: r.callUuid, status: 'placed' });
        placed++;
      } catch (e: any) {
        results.push({ number, error: e.message, status: 'failed' });
        failed++;
      }
      // 1 second gap to stay within typical CPS limits.
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }

    return { placed, failed, results };
  }

  /**
   * Generates the VobizXML that plays an audio file and gathers 1 digit.
   * This is what answer_url returns when Vobiz connects the call.
   */
  buildPlayAndGatherXml(opts: {
    audioUrl: string;
    gatherAction?: string;
    language?: string;
    voice?: string;
    fallbackText?: string;
  }): string {
    const action =
      opts.gatherAction ||
      `${this.callbackBase}/api/v1/ai-calling/vobiz/gather`;

    return [
      '<?xml version="1.0" encoding="UTF-8"?>',
      '<Response>',
      `  <Gather action="${action}" method="POST" numDigits="1" timeout="8">`,
      `    <Play>${opts.audioUrl}</Play>`,
      '  </Gather>',
      '  <!-- If no input, play again then hang up -->',
      `  <Play>${opts.audioUrl}</Play>`,
      '  <Hangup/>',
      '</Response>',
    ].join('\n');
  }

  /** Same as above, but TTS instead of a file. */
  buildSpeakAndGatherXml(opts: {
    text: string;
    language?: string;
    voice?: string;
    gatherAction?: string;
  }): string {
    const action =
      opts.gatherAction ||
      `${this.callbackBase}/api/v1/ai-calling/vobiz/gather`;
    const voice = opts.voice || 'WOMAN';
    const lang = opts.language || 'hi-IN';

    return [
      '<?xml version="1.0" encoding="UTF-8"?>',
      '<Response>',
      `  <Gather action="${action}" method="POST" numDigits="1" timeout="8">`,
      `    <Speak voice="${voice}" language="${lang}" loop="1">${this.escapeXml(opts.text)}</Speak>`,
      '  </Gather>',
      `  <Speak voice="${voice}" language="${lang}" loop="1">${this.escapeXml(opts.text)}</Speak>`,
      '  <Hangup/>',
      '</Response>',
    ].join('\n');
  }

  /** After the user presses a digit. */
  buildAfterGatherXml(digit: string): string {
    if (digit === '1') {
      return [
        '<?xml version="1.0" encoding="UTF-8"?>',
        '<Response>',
        '  <Speak voice="WOMAN" language="hi-IN">',
        '    Dhanyavaad. Humare team se aapko jaldi call aayega site visit schedule karne ke liye. Namaste.',
        '  </Speak>',
        '  <Hangup/>',
        '</Response>',
      ].join('\n');
    }

    return [
      '<?xml version="1.0" encoding="UTF-8"?>',
      '<Response>',
      '  <Speak voice="WOMAN" language="hi-IN">',
      '    Dhanyavaad. Aap hamein kisi bhi samay call kar sakte hain. Namaste.',
      '  </Speak>',
      '  <Hangup/>',
      '</Response>',
    ].join('\n');
  }

  private normaliseNumber(phone: string): string {
    let clean = phone.replace(/[^\d+]/g, '');
    // Indian mobile: ensure +91 prefix.
    if (/^\d{10}$/.test(clean)) clean = '+91' + clean;
    else if (/^91\d{10}$/.test(clean)) clean = '+' + clean;
    else if (!clean.startsWith('+')) clean = '+' + clean;
    return clean;
  }

  private escapeXml(s: string): string {
    return s
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }
}
