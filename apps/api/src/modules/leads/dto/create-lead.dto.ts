import { IsString, IsEmail, IsOptional, IsNumber, IsBoolean, IsArray, IsEnum, Min, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateLeadDto {
  @ApiProperty({ example: 'Rahul Sharma' })
  @IsString()
  @MinLength(2)
  name: string;

  @ApiProperty({ example: '9876543210' })
  @IsString()
  @MinLength(10)
  phone: string;

  @ApiProperty({ example: 'rahul@example.com', required: false })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  alternatePhone?: string;

  @ApiProperty({ enum: ['WEBSITE', 'WHATSAPP', 'FACEBOOK', 'INSTAGRAM', 'GOOGLE_ADS', 'REFERRAL', 'WALK_IN', 'COLD_CALL', 'EMAIL', 'OTHER'], required: false })
  @IsOptional()
  @IsEnum(['WEBSITE', 'WHATSAPP', 'FACEBOOK', 'INSTAGRAM', 'GOOGLE_ADS', 'REFERRAL', 'WALK_IN', 'COLD_CALL', 'EMAIL', 'OTHER'])
  source?: string;

  @ApiProperty({ example: 5000000, required: false })
  @IsOptional()
  @IsNumber()
  @Min(0)
  budget?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  preferredLocation?: string;

  @ApiProperty({ enum: ['PLOT', 'FLAT', 'VILLA', 'COMMERCIAL', 'FARM_LAND', 'STORE', 'PENTHOUSE', 'DUPLEX', 'ROW_HOUSE'], required: false })
  @IsOptional()
  @IsEnum(['PLOT', 'FLAT', 'VILLA', 'COMMERCIAL', 'FARM_LAND', 'STORE', 'PENTHOUSE', 'DUPLEX', 'ROW_HOUSE'])
  preferredPropertyType?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  timeline?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsBoolean()
  loanRequired?: boolean;

  @ApiProperty({ type: [String], required: false })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  assignedToId?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  customFields?: Record<string, unknown>;
}
