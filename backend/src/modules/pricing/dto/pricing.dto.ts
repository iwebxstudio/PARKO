// ============================================
// PARKO — Pricing DTOs
// ============================================
import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import {
  IsInt,
  IsEnum,
  IsNumber,
  IsOptional,
  IsBoolean,
  IsDateString,
  Min,
} from 'class-validator';
import { ParkingType } from '@prisma/client';

export class CreatePricingRuleDto {
  @ApiProperty({ example: 1 })
  @IsInt()
  vehicleTypeId: number;

  @ApiProperty({ enum: ParkingType })
  @IsEnum(ParkingType)
  pricingType: ParkingType;

  @ApiPropertyOptional({ example: 0 })
  @IsNumber()
  @IsOptional()
  @Min(0)
  basePrice?: number;

  @ApiPropertyOptional({ example: 5000 })
  @IsNumber()
  @IsOptional()
  @Min(0)
  hourlyRate?: number;

  @ApiPropertyOptional({ example: 30000 })
  @IsNumber()
  @IsOptional()
  @Min(0)
  dailyRate?: number;

  @ApiPropertyOptional({ example: 150000 })
  @IsNumber()
  @IsOptional()
  @Min(0)
  weeklyRate?: number;

  @ApiPropertyOptional({ example: 500000 })
  @IsNumber()
  @IsOptional()
  @Min(0)
  monthlyRate?: number;

  @ApiPropertyOptional({ example: 5000000 })
  @IsNumber()
  @IsOptional()
  @Min(0)
  yearlyRate?: number;

  @ApiPropertyOptional({ example: 15 })
  @IsInt()
  @IsOptional()
  @Min(0)
  freeMinutes?: number;

  @ApiPropertyOptional()
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @ApiPropertyOptional()
  @IsDateString()
  @IsOptional()
  effectiveFrom?: string;

  @ApiPropertyOptional()
  @IsDateString()
  @IsOptional()
  effectiveTo?: string;
}

export class UpdatePricingRuleDto extends PartialType(CreatePricingRuleDto) {}
