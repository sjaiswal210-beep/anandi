import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { ConfigService } from '@nestjs/config';
import { MetaLeadsService } from './meta-leads.service';

/**
 * Automatically pulls Meta Lead-Ad submissions into the CRM on a schedule, so
 * native "instant form" leads sync without anyone clicking "poll" in the
 * dashboard.
 *
 * Meta lead APIs need a Page token with `leads_retrieval`. If that scope isn't
 * granted, or no lead form exists, pollLeads just returns errors/zero — this
 * cron logs and moves on, so it's a safe no-op until Meta is fully set up.
 */
@Injectable()
export class MetaLeadsCronService {
  private readonly logger = new Logger(MetaLeadsCronService.name);

  // Single-project deployment — same hardcoded workspace the dashboard reads.
  private readonly workspaceId = 'cmsai8kh50001rapl8ioxehxe';

  constructor(
    private readonly configService: ConfigService,
    private readonly metaLeads: MetaLeadsService,
  ) {}

  private get enabled(): boolean {
    // Only run if a Meta token is configured; otherwise it's pointless.
    return Boolean(this.configService.get<string>('META_PAGE_ACCESS_TOKEN'));
  }

  @Cron(CronExpression.EVERY_30_MINUTES, { name: 'metaLeadPoll' })
  async poll() {
    if (!this.enabled) return; // no token → skip silently

    try {
      // Look back a bit further than the interval to be safe against gaps.
      const res = await this.metaLeads.pollLeads(this.workspaceId, { sinceHours: 2 });
      if (res.ingested > 0) {
        this.logger.log(
          `Meta lead poll: ${res.ingested} new lead(s) ingested (${res.skipped} already known).`,
        );
      } else if ((res.errors?.length ?? 0) > 0) {
        // Most common cause: token missing leads_retrieval, or no lead form yet.
        this.logger.warn(`Meta lead poll returned errors: ${res.errors!.join(' | ')}`);
      }
    } catch (e: any) {
      this.logger.warn(`Meta lead poll failed: ${e?.message || e}`);
    }
  }
}
