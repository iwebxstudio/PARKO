// ==============================================================================
// PARKO — ໂມດູນຄວບຄຸມການກວດສອບສະຖານະລະບົບ (Health Controller)
// Endpoint ສຳລັບການກວດສອບຄວາມພ້ອມໃຊ້ງານຂອງລະບົບ API ແລະ ການເຊື່ອມຕໍ່ຖານຂໍ້ມູນ (Docker Healthcheck)
// ==============================================================================
import { Controller, Get, ServiceUnavailableException } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { PrismaService } from '../database/prisma.service';

@ApiTags('Health')
@Controller()
export class HealthController {
  constructor(private prisma: PrismaService) {}

  @Get('health')
  @ApiOperation({ summary: 'Health check endpoint' })
  async check() {
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      return {
        status: 'ok',
        timestamp: new Date().toISOString(),
        db: 'connected',
      };
    } catch {
      throw new ServiceUnavailableException({
        status: 'error',
        timestamp: new Date().toISOString(),
        db: 'disconnected',
      });
    }
  }
}
