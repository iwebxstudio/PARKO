// ==============================================================================
// PARKO — ໂມດູນກວດສອບສະຖານະລະບົບ (Health Module)
// ເຮັດໜ້າທີ່ລົງທະບຽນ Controller ສຳລັບການກວດສອບສະຖານະຄວາມພ້ອມໃຊ້ງານຂອງລະບົບ
// ==============================================================================
import { Module } from '@nestjs/common';
import { HealthController } from './health.controller';
import { PrismaModule } from '../database/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [HealthController],
})
export class HealthModule {}
