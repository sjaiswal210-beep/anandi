import { IsNumber, IsOptional, IsString, IsUrl, Max, Min, MinLength } from 'class-validator';

export class CreateMetaCampaignDto {
  @IsString()
  @MinLength(3)
  name: string;

  /** Daily budget in account currency major units (e.g. 500 = ₹500/day). */
  @IsNumber()
  @Min(100)
  dailyBudget: number;

  /** Publicly reachable image URL — Meta fetches it when building the creative. */
  @IsUrl({ require_protocol: true })
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
