// ============================================
// PARKO — Lost Ticket DTOs
// ============================================
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, IsEnum, IsNumber, Min } from 'class-validator';
import { LostTicketResolution } from '@prisma/client';

export class CreateLostTicketDto {
  @ApiProperty({ description: 'Ticket ID (UUID)' })
  @IsString()
  @IsNotEmpty()
  ticketId: string;

  @ApiProperty({ description: 'Notes about the incident' })
  @IsString()
  @IsNotEmpty()
  notes: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  vehiclePhotoUrl?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  driverPhotoUrl?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  idCardPhotoUrl?: string;
}

export class ResolveLostTicketDto {
  @ApiProperty({ enum: LostTicketResolution })
  @IsEnum(LostTicketResolution)
  resolution: LostTicketResolution;

  @ApiPropertyOptional()
  @IsNumber()
  @IsOptional()
  @Min(0)
  penaltyAmount?: number;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  notes?: string;
}
