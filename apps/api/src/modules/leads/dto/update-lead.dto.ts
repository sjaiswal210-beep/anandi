import { PartialType } from '@nestjs/swagger';
import { IsOptional, IsEnum, IsNumber, Min, Max, IsDateString, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { CreateLeadDto } from './create-lead.dto';

export class UpdateLeadDto extends PartialType(CreateLeadDto) {
  @ApiProperty({ enum: ['NEW', 'CONTACTED', 'QUALIFIED', 'NEGOTIATION', 'WON', 'LOST', 'JUNK'], required: false })
  @IsOptional()
  @IsEnum(['NEW', 'CONTACTED', 'QUALIFIED', 'NEGOTIATION', 'WON', 'LOST', 'JUNK'])
  status?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  score?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsDateString()
  nextFollowUpAt?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  lostReason?: string;
}
