import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../common/prisma/prisma.service';
import { WhatsAppBotService } from '../whatsapp-bot/whatsapp-bot.service';

/**
 * Throttled "drip" sender for bulk WhatsApp campaigns.
 *
 * WHY THIS EXISTS
 * ---------------
 * We have ~3000 imported leads and want to send each a message + a photo + a
 * document. Blasting 3000 messages from an unofficial Baileys bridge is the
 * fastest way to get the number (+91 8007107799) BANNED. WhatsApp flags high
 * volume from cold contacts almost immediately.
 *
 * So instead of a blast, this service drips messages out slowly:
 *   - a small randomized batch per hour,
 *   - only during local business hours,
 *   - a hard DAILY CAP (default 60/day — the bridge's own cap),
 *   - randomized gaps between each send,
 *   - auto-PAUSE the moment the bridge errors (session dropped / rate limited),
 * so 3000 leads naturally spread over several weeks.
 *
 * The bridge has NO media route, so sendMessageWithMedia() falls back to
 * text + public links (photo + PDF hosted on anandipark.in). That is expected.
 *
 * A campaign is "live" when its status is 'sending'. Its metadata holds the
 * message template, media URLs, daily cap, batch size, business-hour window,
 * and the per-day sent counter. Pausing just flips status to 'paused'.
 */
@Injectable()
export class BroadcastDripService {
  private readonly logger = new Logger(BroadcastDripService.name);
  private running = false;

  // Conservative defaults. Can be overridden per-campaign via metadata.
  private readonly DEFAULTS = {
    dailyCap: 60, // matches the bridge's own daily cap
    batchSize: 8, // messages per hourly tick
    minDelayMs: 25_000, // 25s min gap between sends
    maxDelayMs: 75_000, // 75s max gap between sends
    startHour: 10, // 10:00 local (IST)
    endHour: 19, // stop initiating sends at 19:00 local
  };

  constructor(
    private readonly prisma: PrismaService,
    private readonly bot: WhatsAppBotService,
    private readonly configService: ConfigService,
  ) {}

  private get enabled(): boolean {
    return Boolean(this.configService.get<string>('VPS_WHATSAPP_SECRET'));
  }

  /** Current hour in IST (UTC+5:30), regardless of server timezone. */
  private istHour(): number {
    const nowUtcMs = Date.now();
    const istMs = nowUtcMs + 5.5 * 60 * 60 * 1000;
    return new Date(istMs).getUTCHours();
  }

  /** IST calendar day key, e.g. "2026-09-11", for the per-day counter. */
  private istDayKey(): string {
    const istMs = Date.now() + 5.5 * 60 * 60 * 1000;
    return new Date(istMs).toISOString().slice(0, 10);
  }

  private rnd(min: number, max: number): number {
    return Math.floor(min + Math.random() * (max - min));
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((r) => setTimeout(r, ms));
  }

  /**
   * Runs every hour. Finds campaigns with status 'sending' and drips a small
   * randomized batch to not-yet-sent leads, respecting the daily cap and the
   * business-hour window.
   */
  @Cron(CronExpression.EVERY_HOUR, { name: 'broadcastDrip' })
  async tick() {
    if (!this.enabled || this.running) return;
    this.running = true;
    try {
      const campaigns = await this.prisma.broadcastCampaign.findMany({
        where: { status: 'sending', channel: 'whatsapp' },
      });
      for (const campaign of campaigns) {
        await this.processCampaign(campaign).catch((e) =>
          this.logger.error(`Campaign ${campaign.id} failed: ${e?.message || e}`),
        );
      }
    } finally {
      this.running = false;
    }
  }

  private async processCampaign(campaign: any) {
    const meta = (campaign.metadata || {}) as Record<string, any>;
    const cfg = {
      dailyCap: Number(meta.dailyCap) || this.DEFAULTS.dailyCap,
      batchSize: Number(meta.batchSize) || this.DEFAULTS.batchSize,
      minDelayMs: Number(meta.minDelayMs) || this.DEFAULTS.minDelayMs,
      maxDelayMs: Number(meta.maxDelayMs) || this.DEFAULTS.maxDelayMs,
      startHour: meta.startHour != null ? Number(meta.startHour) : this.DEFAULTS.startHour,
      endHour: meta.endHour != null ? Number(meta.endHour) : this.DEFAULTS.endHour,
      imageUrl: meta.imageUrl as string | undefined,
      documentUrl: meta.documentUrl as string | undefined,
    };

    // Business-hours gate (IST).
    const hour = this.istHour();
    if (hour < cfg.startHour || hour >= cfg.endHour) {
      this.logger.log(`Campaign ${campaign.id}: outside business hours (IST ${hour}:00), skipping.`);
      return;
    }

    // Daily cap gate — reset counter on a new IST day.
    const dayKey = this.istDayKey();
    const sentDay = meta.sentDay === dayKey ? Number(meta.sentToday) || 0 : 0;
    const remainingToday = cfg.dailyCap - sentDay;
    if (remainingToday <= 0) {
      this.logger.log(`Campaign ${campaign.id}: daily cap (${cfg.dailyCap}) reached, skipping.`);
      return;
    }

    // Pre-flight: make sure the bridge session is actually connected. If not,
    // skip this tick (keepalive will restore it) rather than burning attempts.
    const status: any = await this.bot.getVpsStatus().catch(() => null);
    const state = (status?.status || status?.data?.status || '').toLowerCase();
    if (state && state !== 'connected') {
      this.logger.warn(`Campaign ${campaign.id}: bridge not connected (${state}), skipping tick.`);
      return;
    }

    const take = Math.min(cfg.batchSize, remainingToday);
    const leads = await this.prisma.customerImport.findMany({
      where: { workspaceId: campaign.workspaceId, broadcastSent: false },
      orderBy: { createdAt: 'asc' },
      take,
    });

    if (leads.length === 0) {
      // Nothing left — mark the campaign complete.
      await this.prisma.broadcastCampaign.update({
        where: { id: campaign.id },
        data: { status: 'completed', completedAt: new Date() },
      });
      this.logger.log(`Campaign ${campaign.id}: no leads left, marked completed.`);
      return;
    }

    let sentThisTick = 0;
    let runningSentDay = sentDay;

    for (const lead of leads) {
      const message = this.renderTemplate(campaign.template, lead);
      let result: { sent: boolean; via: string; error?: string };
      try {
        result = await this.bot.sendMessageWithMedia(lead.phone, message, {
          imageUrl: cfg.imageUrl,
          documentUrl: cfg.documentUrl,
        });
      } catch (e: any) {
        result = { sent: false, via: 'text', error: e?.message || String(e) };
      }

      if (result.sent) {
        await this.prisma.customerImport.update({
          where: { id: lead.id },
          data: {
            broadcastSent: true,
            broadcastChannel: 'whatsapp',
            metadata: { ...(lead.metadata as object), lastBroadcastAt: new Date().toISOString(), campaignId: campaign.id, via: result.via },
          },
        });
        sentThisTick++;
        runningSentDay++;
      } else {
        // A send failure usually means the session dropped or we're being rate
        // limited. AUTO-PAUSE immediately to protect the number.
        this.logger.error(`Campaign ${campaign.id}: send failed (${result.error}); auto-pausing campaign.`);
        await this.persistProgress(campaign.id, meta, dayKey, runningSentDay, sentThisTick, 'paused', result.error);
        return;
      }

      // Stop if we hit the daily cap mid-batch.
      if (runningSentDay >= cfg.dailyCap) break;

      // Randomized human-like delay before the next send.
      await this.sleep(this.rnd(cfg.minDelayMs, cfg.maxDelayMs));
    }

    await this.persistProgress(campaign.id, meta, dayKey, runningSentDay, sentThisTick, 'sending');
    this.logger.log(`Campaign ${campaign.id}: sent ${sentThisTick} this tick (${runningSentDay}/${cfg.dailyCap} today).`);
  }

  /** Persists per-day counter + totals + optional status change on the campaign. */
  private async persistProgress(
    campaignId: string,
    meta: Record<string, any>,
    dayKey: string,
    sentToday: number,
    sentThisTick: number,
    status: 'sending' | 'paused',
    lastError?: string,
  ) {
    const newMeta: Record<string, any> = {
      ...meta,
      sentDay: dayKey,
      sentToday,
      lastTickAt: new Date().toISOString(),
    };
    if (lastError) newMeta.lastError = lastError;

    await this.prisma.broadcastCampaign.update({
      where: { id: campaignId },
      data: {
        status,
        sentCount: { increment: sentThisTick },
        metadata: newMeta,
      },
    });
  }

  /**
   * Renders a template with simple {{name}} / {{phone}} placeholders.
   * Falls back to a friendly default if name is missing.
   */
  private renderTemplate(template: string, lead: { name?: string; phone: string }): string {
    const name = (lead.name || '').trim();
    return template
      .replace(/\{\{\s*name\s*\}\}/gi, name || 'Namaste')
      .replace(/\{\{\s*phone\s*\}\}/gi, lead.phone);
  }
}
