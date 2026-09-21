import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { ConfigService } from '@nestjs/config';
import { AdsService } from './ads.service';

/**
 * Automatically syncs Meta ad spend + insights into the dashboard on a schedule
 * so campaign performance (spend, clicks, leads) stays current WITHOUT anyone
 * clicking "Sync Meta". Pulls the whole ad account, so ads created directly in
 * Ads Manager are picked up too.
 *
 * No-op if Meta isn't configured (no token / ad account).
 */
@Injectable()
export class AdsSyncCronService {
  private readonly logger = new Logger(AdsSyncCronService.name);

  // Single-project deployment — the workspace the dashboard reads.
  private readonly workspaceId = 'cmsai8kh50001rapl8ioxehxe';

  constructor(
    private readonly configService: ConfigService,
    private readonly ads: AdsService,
  ) {}

  private get enabled(): boolean {
    return Boolean(
      (this.configService.get<string>('META_PAGE_ACCESS_TOKEN') ||
        this.configService.get<string>('META_AD_ACCESS_TOKEN')) &&
        this.configService.get<string>('META_AD_ACCOUNT_ID'),
    );
  }

  @Cron(CronExpression.EVERY_30_MINUTES, { name: 'metaAdSpendSync' })
  async sync() {
    if (!this.enabled) return; // Meta not connected → skip silently

    try {
      const res: any = await this.ads.syncMeta(this.workspaceId);
      if (res?.error) {
        this.logger.warn(`Meta ad spend sync error: ${res.error}`);
      } else {
        this.logger.log(`Meta ad spend sync: ${res?.synced ?? 0} campaign(s) updated.`);
      }
    } catch (e: any) {
      this.logger.warn(`Meta ad spend sync failed: ${e?.message || e}`);
    }
  }
}
