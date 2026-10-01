import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { ConfigService } from '@nestjs/config';
import { WhatsAppBotService } from './whatsapp-bot.service';

/**
 * Keeps the WhatsApp bridge session warm.
 *
 * The bridge "reaps" (drops) sessions it considers idle to free Chromium slots.
 * When the anandi-park session is reaped, WhatsApp still reports "connected" but
 * the bot silently stops processing/replying to messages — the exact
 * "connected but no replies" symptom.
 *
 * This cron pings the session every few minutes:
 *  - a cheap status check keeps the session active (not idle), and
 *  - if the session is NOT connected, it re-starts it so it reconnects on its
 *    own without anyone touching the VPS.
 */
@Injectable()
export class WhatsAppKeepaliveService {
  private readonly logger = new Logger(WhatsAppKeepaliveService.name);

  constructor(
    private readonly bot: WhatsAppBotService,
    private readonly configService: ConfigService,
  ) {}

  private get enabled(): boolean {
    // Only run if the bridge is configured (secret present).
    return Boolean(this.configService.get<string>('VPS_WHATSAPP_SECRET'));
  }

  @Cron(CronExpression.EVERY_5_MINUTES, { name: 'whatsappKeepAlive' })
  async keepAlive() {
    if (!this.enabled) return;

    try {
      const status: any = await this.bot.getVpsStatus();
      const state = (status?.status || status?.data?.status || '').toLowerCase();

      // A status call itself touches the session so the reaper sees it as
      // active. If it's clearly not connected, nudge it back up.
      if (state && state !== 'connected') {
        this.logger.warn(`WhatsApp session not connected (status: ${state}); re-starting to keep it alive.`);
        await this.bot.startVpsSession();
      }
    } catch (e: any) {
      // Bridge unreachable — try a start anyway; never throw from a cron.
      this.logger.warn(`Keep-alive status check failed: ${e?.message || e}. Attempting restart.`);
      try {
        await this.bot.startVpsSession();
      } catch {
        /* bridge down; next cycle will retry */
      }
    }
  }
}
