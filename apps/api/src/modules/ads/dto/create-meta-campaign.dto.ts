import { IsIn, IsNumber, IsOptional, IsString, IsUrl, Matches, Max, Min, MinLength } from 'class-validator';
// IsUrl retained for the optional `link` field below.

export class CreateMetaCampaignDto {
  @IsString()
  @MinLength(3)
  name: string;

  /**
   * Which kind of Meta ad to create. All run through the Marketing API; they
   * differ in objective, placement, and destination/CTA:
   *  - facebook : lead ad, Facebook placement
   *  - instagram: lead ad, Instagram placement
   *  - whatsapp : Click-to-WhatsApp (opens a chat with the business number)
   *  - website  : traffic ad to the website
   */
  @IsOptional()
  @IsIn(['facebook', 'instagram', 'whatsapp', 'website'])
  adType?: 'facebook' | 'instagram' | 'whatsapp' | 'website';

  /** WhatsApp destination number (digits only) — required for adType=whatsapp. */
  @IsOptional()
  @Matches(/^\d{10,15}$/, { message: 'whatsappNumber must be 10–15 digits, e.g. 917558444117' })
  whatsappNumber?: string;

  /**
   * Meta instant lead-form id. When set (facebook/instagram ads), the ad uses
   * Meta's native in-app lead form instead of linking to the website. Leads are
   * then synced by the poll cron (needs leads_retrieval on the token).
   */
  @IsOptional()
  @IsString()
  leadFormId?: string;

  /** Daily budget in account currency major units (e.g. 500 = ₹500/day). */
  @IsNumber()
  @Min(100)
  dailyBudget: number;

  /**
   * Image for the creative. Either a full https URL, or a relative /uploads/...
   * path from the social image generator (resolved against API_PUBLIC_URL).
   * Meta fetches the image server-side, so it must resolve to a public https URL.
   */
  @IsString()
  @MinLength(1)
  imageUrl: string;

  @IsString()
  @MinLength(10)
  caption: string;

  @IsOptional()
  @IsString()
  headline?: string;

  @IsOptional()
  @IsUrl({ require_protocol: true })
  link?: string;

  @IsOptional()
  @IsNumber()
  @Min(24)
  @Max(80)
  radiusKm?: number;

  @IsOptional()
  @IsNumber()
  lat?: number;

  @IsOptional()
  @IsNumber()
  lng?: number;
}
