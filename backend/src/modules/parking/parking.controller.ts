// ============================================
// PARKO — Parking Controller
// Check-in, check-out, and dashboard endpoints
// ============================================
import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  UseGuards,
  Param,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { Role } from '@prisma/client';
import { ParkingService } from './parking.service';
import { CheckInDto, CheckOutDto } from './dto';
import { CurrentUser, Roles } from '../../common/decorators';
import { RolesGuard } from '../../common/guards';

@ApiTags('Parking')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@Controller('parking')
export class ParkingController {
  constructor(private parkingService: ParkingService) {}

  @Post('check-in')
  @ApiOperation({ summary: 'Check-in a vehicle' })
  checkIn(@Body() dto: CheckInDto, @CurrentUser() user: any) {
    return this.parkingService.checkIn(dto, user.id);
  }

  @Get('find/:identifier')
  @ApiOperation({ summary: 'Find ticket by number or plate for checkout' })
  findTicket(@Param('identifier') identifier: string) {
    return this.parkingService.findTicket(identifier);
  }

  @Post('check-out')
  @ApiOperation({ summary: 'Check-out a vehicle' })
  checkOut(@Body() dto: CheckOutDto, @CurrentUser() user: any) {
    return this.parkingService.checkOut(dto, user.id);
  }

  @Get('dashboard')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Get dashboard statistics (Admin)' })
  getDashboardStats() {
    return this.parkingService.getDashboardStats();
  }

  @Get('active')
  @ApiOperation({ summary: 'Get all active/parked tickets' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  getActiveTickets(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.parkingService.getActiveTickets(
      parseInt(String(page)) || 1,
      parseInt(String(limit)) || 20,
    );
  }

  @Get('recent')
  @ApiOperation({ summary: 'Get recent parking activity' })
  @ApiQuery({ name: 'limit', required: false })
  getRecentActivity(@Query('limit') limit?: string) {
    return this.parkingService.getRecentActivity(parseInt(String(limit)) || 10);
  }

  @Post('delete/:id')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Delete a ticket (Admin only)' })
  deleteTicket(@Param('id') id: string) {
    return this.parkingService.deleteTicket(id);
  }
}
