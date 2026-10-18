// ==============================================================================
// PARKO — ໂມດູນລະບົບສະມາຊິກ (Membership Module)
// ຈັດການການລົງທະບຽນ ແລະ ໃຫ້ບໍລິການລະບົບສະມາຊິກຈອດລົດ (ລາຍອາທິດ, ລາຍເດືອນ, ລາຍວັນ)
// ==============================================================================
import { Module } from '@nestjs/common';
import { MembershipService } from './membership.service';
import { MembershipController } from './membership.controller';
import { PrismaModule } from '../../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [MembershipController],
  providers: [MembershipService],
  exports: [MembershipService],
})
export class MembershipModule {}
