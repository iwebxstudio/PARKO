import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  ParseUUIDPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { Role } from '@prisma/client';
import { PricingService } from './pricing.service';
import { CreatePricingRuleDto, UpdatePricingRuleDto } from './dto';
import { Roles } from '../../common/decorators';
import { RolesGuard } from '../../common/guards';

@ApiTags('Pricing')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Controller('pricing')
export class PricingController {
  constructor(private pricingService: PricingService) {}

  @Get('vehicle-types')
  @ApiOperation({ summary: 'Get all vehicle types' })
  getVehicleTypes() {
    return this.pricingService.getVehicleTypes();
  }

  @Post()
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Create pricing rule (Admin)' })
  create(@Body() dto: CreatePricingRuleDto) {
    return this.pricingService.create(dto);
  }

  @Get('rate')
  @ApiOperation({ summary: 'Get rate for a vehicle type + parking type' })
  getRate(
    @Query('vehicleTypeId') vehicleTypeId: string,
    @Query('parkingType') parkingType: string,
  ) {
    return this.pricingService.getRate(
      parseInt(vehicleTypeId) || 1,
      parkingType || 'DAILY',
    );
  }

  @Get()
  @ApiOperation({ summary: 'Get all pricing rules' })
  findAll() {
    return this.pricingService.findAll();
  }

  @Patch(':id')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Update pricing rule (Admin)' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdatePricingRuleDto,
  ) {
    return this.pricingService.update(id, dto);
  }

  @Delete(':id')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Delete pricing rule (Admin)' })
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.pricingService.remove(id);
  }
}
