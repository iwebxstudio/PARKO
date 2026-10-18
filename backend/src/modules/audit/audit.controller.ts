import { Controller, Get, Delete, Query, UseGuards } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { Role } from '@prisma/client';
import { AuditService } from './audit.service';
import { Roles } from '../../common/decorators';
import { RolesGuard } from '../../common/guards';

@ApiTags('Audit')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Roles(Role.ADMIN)
@Controller('audit')
export class AuditController {
  constructor(private auditService: AuditService) {}

  @Get()
  @ApiOperation({ summary: 'Get audit logs (Admin only)' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  @ApiQuery({ name: 'userId', required: false })
  @ApiQuery({ name: 'entityType', required: false })
  @ApiQuery({ name: 'dateFrom', required: false })
  @ApiQuery({ name: 'dateTo', required: false })
  findAll(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('userId') userId?: string,
    @Query('entityType') entityType?: string,
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo') dateTo?: string,
  ) {
    return this.auditService.findAll(
      parseInt(String(page)) || 1,
      parseInt(String(limit)) || 50,
      { userId, entityType, dateFrom, dateTo },
    );
  }

  @Delete('old')
  @ApiOperation({
    summary:
      'Delete audit logs older than a specific number of months (default 3)',
  })
  @ApiQuery({ name: 'months', required: false, type: Number })
  deleteOldLogs(@Query('months') months?: string) {
    const monthsNum = months ? parseInt(months) : 3;
    return this.auditService.deleteOldLogs(monthsNum);
  }

  @Delete('all')
  @ApiOperation({ summary: 'Delete all audit logs' })
  deleteAllLogs() {
    return this.auditService.deleteAllLogs();
  }
}
