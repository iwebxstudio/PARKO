// ==============================================================================
// PARKO — ໂມດູນ Prisma (Prisma Module)
// ໂມດູນຈັດການຖານຂໍ້ມູນລະດັບ Global ທີ່ສາມາດຮຽກໃຊ້ງານໄດ້ຈາກທຸກ Service
// ==============================================================================
import { Global, Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';

@Global()
@Module({
  providers: [PrismaService],
  exports: [PrismaService],
})
export class PrismaModule {}
