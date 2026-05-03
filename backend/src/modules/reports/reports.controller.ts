import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { Role } from '@prisma/client';
import { ReportsService } from './reports.service';
import { Roles } from '../../common/decorators';
import { RolesGuard } from '../../common/guards';

@ApiTags('Reports')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Roles(Role.ADMIN)
@Controller('reports')
export class ReportsController {
  constructor(private reportsService: ReportsService) {}

  @Get('revenue')
  @ApiOperation({ summary: 'Get revenue report' })
  @ApiQuery({ name: 'period', enum: ['daily', 'monthly', 'yearly'] })
  @ApiQuery({ name: 'dateFrom', required: false })
  @ApiQuery({ name: 'dateTo', required: false })
  getRevenue(
    @Query('period') period: 'daily' | 'monthly' | 'yearly',
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo') dateTo?: string,
  ) {
    return this.reportsService.getRevenueReport(period || 'daily', dateFrom, dateTo);
  }

  @Get('vehicles')
  @ApiOperation({ summary: 'Get vehicle count report' })
  @ApiQuery({ name: 'period', enum: ['daily', 'monthly', 'yearly'] })
  @ApiQuery({ name: 'dateFrom', required: false })
  @ApiQuery({ name: 'dateTo', required: false })
  @ApiQuery({ name: 'type', enum: ['in', 'out'], required: false })
  getVehicles(
    @Query('period') period: 'daily' | 'monthly' | 'yearly',
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo') dateTo?: string,
    @Query('type') type?: 'in' | 'out',
  ) {
    return this.reportsService.getVehicleReport(period || 'daily', dateFrom, dateTo, type || 'in');
  }

  @Get('dashboard-stats')
  @ApiOperation({ summary: 'Get comprehensive dashboard statistics' })
  getDashboardStats() {
    return this.reportsService.getDashboardStats();
  }

  @Get('export')
  @ApiOperation({ summary: 'Get raw data for export (PDF/Excel)' })
  @ApiQuery({ name: 'dateFrom', required: true })
  @ApiQuery({ name: 'dateTo', required: true })
  getExportData(
    @Query('dateFrom') dateFrom: string,
    @Query('dateTo') dateTo: string,
  ) {
    return this.reportsService.getExportData(dateFrom, dateTo);
  }
}
