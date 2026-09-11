import { IsNumber, IsOptional, IsString, IsUrl, Max, Min, MinLength } from 'class-validator';
// IsUrl retained for the optional `link` field below.

export class CreateMetaCampaignDto {
  @IsString()
  @MinLength(3)
  name: string;

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
  @Min(17)
  @Max(80)
  radiusKm?: number;

  @IsOptional()
  @IsNumber()
  lat?: number;

  @IsOptional()
  @IsNumber()
  lng?: number;
}
