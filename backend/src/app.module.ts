// ==============================================================================
// PARKO — ໂມດູນຫຼັກຂອງແອັບພລິເຄຊັນ (Root Application Module)
// ເຮັດໜ້າທີ່ເຊື່ອມຕໍ່ທຸກໆ Feature Modules, ລະບົບຄວາມປອດໄພ, Guard ແລະ Interceptor ເຂົ້ານຳກັນ
// ==============================================================================
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';

import configuration from './config/configuration';
import { validate } from './config/env.validation';
import { PrismaModule, HealthModule } from './core';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { ParkingModule } from './modules/parking/parking.module';
import { LostTicketModule } from './modules/lost-ticket/lost-ticket.module';
import { PricingModule } from './modules/pricing/pricing.module';
import { ReportsModule } from './modules/reports/reports.module';
import { AuditModule } from './modules/audit/audit.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { SettingsModule } from './modules/settings/settings.module';
import { FileUploadModule } from './modules/file-upload/file-upload.module';
import { PrinterModule } from './modules/printer/printer.module';
import { AuditInterceptor } from './modules/audit/audit.interceptor';
import { TransformInterceptor } from './common/interceptors';
import { MembershipModule } from './modules/membership/membership.module';

@Module({
  imports: [
    // ໂມດູນຈັດການ Environment Variables ພ້ອມລະບົບກວດສອບຄວາມຖືກຕ້ອງຕັ້ງແຕ່ເລີ່ມຕົ້ນ (Fail-fast Startup Validation)
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
      validate,
    }),

    // ລະບົບຈຳກັດອັດຕາການຮຽກໃຊ້ງານ (Rate Limiting) — 100 ຄຳຮ້ອງຂໍຕໍ່ 60 ວິນາທີ ຕໍ່ 1 IP Address
    ThrottlerModule.forRoot([
      {
        ttl: 60000,
        limit: 100,
      },
    ]),

    // ໃຫ້ບໍລິການໄຟລ໌ static ສຳລັບຮູບພາບທີ່ຖືກອັບໂຫຼດໃນໂຟນເດີ uploads
    ServeStaticModule.forRoot({
      rootPath: join(process.cwd(), 'uploads'),
      serveRoot: '/uploads',
    }),

    // ໂມດູນຫຼັກລະດັບໂຄງສ້າງພື້ນຖານ (Core Infrastructure Modules)
    HealthModule,
    PrismaModule,
    AuthModule,
    UsersModule,

    // ໂມດູນຫຼັກສຳລັບການດຳເນີນງານທາງທຸລະກິດ (Core Business Modules)
    ParkingModule,
    LostTicketModule,
    PricingModule,
    MembershipModule,

    // ໂມດູນສະໜັບສະໜູນການເຮັດວຽກຂອງລະບົບ (Supporting & Utility Modules)
    ReportsModule,
    AuditModule,
    NotificationsModule,
    SettingsModule,
    FileUploadModule,
    PrinterModule,
  ],
  providers: [
    // Guard ລະດັບ Global ສຳລັບປ້ອງກັນການຮຽກໃຊ້ງານຖີ່ເກີນໄປ (Rate Limiting Guard)
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
    // Interceptor ລະດັບ Global ສຳລັບຈັດຮູບແບບຂໍ້ມູນຕອບກັບ (Response Format) ໃຫ້ເປັນມາດຕະຖານດຽວກັນ
    {
      provide: APP_INTERCEPTOR,
      useClass: TransformInterceptor,
    },
    // Interceptor ລະດັບ Global ສຳລັບບັນທຶກປະຫວັດການເຄື່ອນໄຫວ ແລະ ທຸລະກຳ (Audit Logging)
    {
      provide: APP_INTERCEPTOR,
      useClass: AuditInterceptor,
    },
  ],
})
export class AppModule {}
