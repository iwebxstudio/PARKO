// ==============================================================================
// PARKO — ອອບເຈັກສົ່ງຕໍ່ຂໍ້ມູນສຳລັບລະບົບສະມາຊິກ (Membership DTOs)
// ກຳນົດກົດລະບຽບການກວດສອບຂໍ້ມູນການສະໝັກສະມາຊິກ ແລະ ການອັບເດດຂໍ້ມູນສະມາຊິກ
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
import { MemberType, MemberStatus, PaymentMethod } from '@prisma/client';

export class CreateMembershipDto {
  @ApiProperty({ description: 'Vehicle type ID' })
  @IsInt()
  @IsNotEmpty()
  vehicleTypeId: number;

  @ApiPropertyOptional({ description: 'Plate number' })
  @IsString()
  @IsOptional()
  plateNumber?: string;

  @ApiPropertyOptional({ description: 'Plate province' })
  @IsString()
  @IsOptional()
  plateProvince?: string;

  @ApiPropertyOptional({ description: 'Plate letters (ຕົວອັກສອນ)' })
  @IsString()
  @IsOptional()
  plateLetters?: string;

  @ApiProperty({ enum: MemberType })
  @IsEnum(MemberType)
  memberType: MemberType;

  @ApiProperty({ description: 'Start date' })
  @IsDateString()
  startDate: string;

  @ApiProperty({ description: 'End date' })
  @IsDateString()
  endDate: string;

  @ApiProperty({ description: 'Amount paid' })
  @IsNumber()
  @Min(0)
  paidAmount: number;

  @ApiPropertyOptional({ enum: PaymentMethod })
  @IsEnum(PaymentMethod)
  @IsOptional()
  paymentMethod?: PaymentMethod;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  notes?: string;
}

export class UpdateMembershipDto {
  @ApiPropertyOptional({ enum: MemberStatus })
  @IsEnum(MemberStatus)
  @IsOptional()
  status?: MemberStatus;

  @ApiPropertyOptional()
  @IsDateString()
  @IsOptional()
  endDate?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  notes?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  plateNumber?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  plateProvince?: string;

  @ApiPropertyOptional()
  @IsInt()
  @IsOptional()
  vehicleTypeId?: number;
}
