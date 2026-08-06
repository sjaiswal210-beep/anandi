import { Controller, Post, Get, Body, Query, Res, Logger } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiExcludeEndpoint } from '@nestjs/swagger';
import { Response } from 'express';
import { VobizService } from './vobiz.service';
import { PrismaService } from '../../common/prisma/prisma.service';
import { Public } from '../../common/decorators/public.decorator';

/**
 * Vobiz XML webhook endpoints.
 * These are called by Vobiz when a call connects, when DTMF is received,
 * and when the call hangs up. They must be @Public() since Vobiz has no
 * auth token — it's an inbound webhook from their platform.
 */
@ApiTags('AI Calling – Vobiz Webhooks')
@Controller('ai-calling/vobiz')
export class VobizController {
  private readonly logger = new Logger(VobizController.name);

  constructor(
    private readonly vobiz: VobizService,
    private readonly prisma: PrismaService,
  ) {}

  /**
   * Vobiz hits this when the outbound call is answered.
   * We return XML that either plays a pre-recorded audio or TTS,
   * and gathers 1 digit from the user.
   */
  @Public()
  @Post('answer')
  @ApiOperation({ summary: 'Vobiz answer_url — returns XML for the call' })
  async answer(@Body() body: any, @Res() res: Response) {
    this.logger.log(`Call answered: ${JSON.stringify(body).slice(0, 300)}`);

    const callUuid = body?.CallUUID || body?.call_uuid || '';

    // Find the call record by provider call ID to know which script to play.
    const callRecord = callUuid
      ? await this.prisma.callRecord.findFirst({
          where: { providerCallId: callUuid },
        })
      : null;

    // If we have a pre-generated audio URL, play it. Otherwise TTS the script.
    let xml: string;
    const audioUrl = (callRecord?.script || '').match(/^https?:\/\//)?.[0]
      ? callRecord!.script!
      : null;

    if (audioUrl) {
      xml = this.vobiz.buildPlayAndGatherXml({ audioUrl });
    } else {
      // Default Anandi Park pitch in Hindi.
      const script =
        callRecord?.script ||
        'Namaste! Main Anandi Park se bol raha hoon. Bakori, Wagholi Pune mein premium residential plots ' +
          'available hain, starting atharah lakh se. Clear titles, ready for registration. ' +
          'Agar aapko site visit karna hai toh please 1 dabaiye. Dhanyavaad.';

      xml = this.vobiz.buildSpeakAndGatherXml({
        text: script,
        language: 'hi-IN',
        voice: 'WOMAN',
      });
    }

    // Update call status.
    if (callRecord) {
      await this.prisma.callRecord.update({
        where: { id: callRecord.id },
        data: { status: 'connected' },
      });
    }

    res.set('Content-Type', 'application/xml');
    res.send(xml);
  }

  /**
   * Stateless "speak custom text" endpoint. Vobiz fetches this over GET and
   * we return VobizXML that speaks the text passed in the query string.
   * Text and language travel in the URL so no DB lookup or state is needed.
   */
  @Public()
  @Get('say')
  @ApiOperation({ summary: 'Vobiz answer_url that speaks custom text (TTS)' })
  say(@Res() res: Response, @Query('text') text: string, @Query('lang') lang?: string) {
    const language = lang || 'hi-IN';
    const safe = (text || 'Namaste, Anandi Park se sampark karne ke liye dhanyavaad.')
      .replace(/&/g, 'and')
      .replace(/[<>"]/g, ' ')
      .slice(0, 900);

    const xml =
      '<?xml version="1.0" encoding="UTF-8"?>\n' +
      '<Response>\n' +
      `  <Speak voice="WOMAN" language="${language}" loop="1">${safe}</Speak>\n` +
      '  <Hangup/>\n' +
      '</Response>';

    res.set('Content-Type', 'application/xml');
    res.send(xml);
  }

  /**
   * Vobiz posts the gathered digit here.
   */
  @Public()
  @Post('gather')
  @ApiOperation({ summary: 'Vobiz gather callback — DTMF digit received' })
  async gather(@Body() body: any, @Res() res: Response) {
    const digit = String(body?.Digits || body?.digits || '');
    const callUuid = body?.CallUUID || body?.call_uuid || '';

    this.logger.log(`DTMF received: digit=${digit} uuid=${callUuid}`);

    // Update call record with the response.
    if (callUuid) {
      const intent = digit === '1' ? 'interested' : 'not_interested';
      const nextAction = digit === '1' ? 'schedule_visit' : 'none';

      await this.prisma.callRecord.updateMany({
        where: { providerCallId: callUuid },
        data: {
          intentDetected: intent,
          nextAction,
          transcript: `Lead pressed ${digit}. ${intent === 'interested' ? 'Wants site visit.' : 'Declined.'}`,
        },
      });

      // If interested, mark the lead as QUALIFIED.
      if (digit === '1') {
        const record = await this.prisma.callRecord.findFirst({
          where: { providerCallId: callUuid },
          select: { leadId: true },
        });
        if (record?.leadId) {
          await this.prisma.lead.update({
            where: { id: record.leadId },
            data: { status: 'QUALIFIED' },
          });
        }
      }
    }

    const xml = this.vobiz.buildAfterGatherXml(digit);
    res.set('Content-Type', 'application/xml');
    res.send(xml);
  }

  /**
   * Hangup callback — call ended.
   */
  @Public()
  @Post('hangup')
  @ApiExcludeEndpoint()
  async hangup(@Body() body: any) {
    const callUuid = body?.CallUUID || body?.call_uuid || '';
    const duration = Number(body?.Duration || body?.duration || 0);
    const status = body?.CallStatus || body?.call_status || 'completed';

    this.logger.log(`Call ended: uuid=${callUuid} duration=${duration}s status=${status}`);

    if (callUuid) {
      const finalStatus =
        status === 'no-answer' || status === 'busy' || status === 'failed'
          ? status
          : 'completed';

      await this.prisma.callRecord.updateMany({
        where: { providerCallId: callUuid },
        data: {
          status: finalStatus,
          duration,
          completedAt: new Date(),
        },
      });
    }
  }
}
