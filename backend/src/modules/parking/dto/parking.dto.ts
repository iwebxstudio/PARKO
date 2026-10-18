// ==============================================================================
// PARKO — ອອບເຈັກສົ່ງຕໍ່ຂໍ້ມູນສຳລັບລະບົບຈອດລົດ (Parking DTOs)
// ກຳນົດກົດລະບຽບການກວດສອບຂໍ້ມູນການເຂົ້າຈອດ (Check-in) ແລະ ການອອກຈາກລານຈອດ (Check-out)
// ==============================================================================
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsInt,
  IsEnum,
  IsDateString,
  IsNumber,
  Min,
} from 'class-validator';
import { ParkingType, PaymentMethod, PaymentStatus } from '@prisma/client';

export class CheckInDto {
  @ApiProperty({ example: 1, description: 'Vehicle type ID' })
  @IsInt()
  vehicleTypeId: number;

  @ApiPropertyOptional({ example: '1234', description: 'Plate number' })
  @IsString()
  @IsOptional()
  plateNumber?: string;

  @ApiPropertyOptional({ example: 'ນວ', description: 'Plate province/letters' })
  @IsString()
  @IsOptional()
  plateProvince?: string;

  @ApiPropertyOptional({
    example: 'AB',
    description: 'Plate letters (ຕົວອັກສອນ)',
  })
  @IsString()
  @IsOptional()
  plateLetters?: string;

  @ApiPropertyOptional({ enum: ParkingType, default: ParkingType.HOURLY })
  @IsEnum(ParkingType)
  @IsOptional()
  parkingType?: ParkingType;

  @ApiPropertyOptional({
    description: 'Custom start date for weekly/monthly parking',
  })
  @IsDateString()
  @IsOptional()
  customStart?: string;

  @ApiPropertyOptional({
    description: 'Custom end date for weekly/monthly parking',
  })
  @IsDateString()
  @IsOptional()
  customEnd?: string;

  @ApiPropertyOptional({ description: 'Prepaid amount for long-term parking' })
  @IsNumber()
  @IsOptional()
  @Min(0)
  prepaidAmount?: number;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  notes?: string;
}

export class CheckOutDto {
  @ApiProperty({ description: 'Ticket number or plate number to search' })
  @IsString()
  @IsNotEmpty()
  identifier: string;

  @ApiProperty({ enum: PaymentMethod })
  @IsEnum(PaymentMethod)
  paymentMethod: PaymentMethod;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  referenceNumber?: string;

  @ApiPropertyOptional()
  @IsNumber()
  @IsOptional()
  @Min(0)
  amountPaid?: number;

  @ApiPropertyOptional({ enum: PaymentStatus })
  @IsEnum(PaymentStatus)
  @IsOptional()
  paymentStatus?: PaymentStatus;
}

export class SearchTicketDto {
  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  ticketNumber?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  plateNumber?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  status?: string;

  @ApiPropertyOptional()
  @IsDateString()
  @IsOptional()
  dateFrom?: string;

  @ApiPropertyOptional()
  @IsDateString()
  @IsOptional()
  dateTo?: string;
}
