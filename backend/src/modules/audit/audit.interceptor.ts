// ==============================================================================
// PARKO — ຕົວດັກຈັບບັນທຶກປະຫວັດການດຳເນີນງານ (Audit Interceptor)
// ບັນທຶກປະຫວັດການປ່ຽນແປງຂໍ້ມູນ (Create, Update, Delete) ລົງຖານຂໍ້ມູນແບບອັດຕະໂນມັດ ພ້ອມຕັດຂໍ້ມູນລັບ
// ==============================================================================
import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable, tap } from 'rxjs';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

const SENSITIVE_KEYS = new Set([
  'password',
  'passwordhash',
  'password_hash',
  'accesstoken',
  'refreshtoken',
  'token',
  'access_token',
  'refresh_token',
  'secret',
  'authorization',
  'currentpassword',
  'newpassword',
]);

function redactSensitiveData(obj: any, depth = 0): any {
  if (depth > 5 || obj === null || obj === undefined) return obj;
  if (typeof obj !== 'object') return obj;

  if (Array.isArray(obj)) {
    return obj.map((item) => redactSensitiveData(item, depth + 1));
  }

  const sanitized: Record<string, any> = {};
  for (const [key, val] of Object.entries(obj)) {
    if (SENSITIVE_KEYS.has(key.toLowerCase())) {
      sanitized[key] = '[REDACTED]';
    } else if (typeof val === 'object' && val !== null) {
      sanitized[key] = redactSensitiveData(val, depth + 1);
    } else {
      sanitized[key] = val;
    }
  }
  return sanitized;
}

@Injectable()
export class AuditInterceptor implements NestInterceptor {
  private readonly logger = new Logger(AuditInterceptor.name);

  constructor(private prisma: PrismaService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const method = request.method;

    // ບັນທຶກສະເພາະຄຳຮ້ອງຂໍທີ່ມີການດັດແກ້ຂໍ້ມູນເທົ່ານັ້ນ (ຂ້າມ GET, HEAD, OPTIONS)
    if (['GET', 'HEAD', 'OPTIONS'].includes(method)) {
      return next.handle();
    }

    const user = request.user;

    return next.handle().pipe(
      tap((responseData) => {
        void this.logAudit(context, request, user, method, responseData);
      }),
    );
  }

  private async logAudit(
    context: ExecutionContext,
    request: any,
    user: any,
    method: string,
    responseData: any,
  ): Promise<void> {
    try {
      const handler = context.getHandler().name;
      const controller = context.getClass().name;

      // ດຶງຂໍ້ມູນ ແລະ ຈັດຮູບແບບ IP Address ຕົວຈິງຂອງ Client (ຮອງຮັບ Reverse Proxy Headers)
      const forwardedHeader = request.headers['x-forwarded-for'];
      const rawForwarded = Array.isArray(forwardedHeader)
        ? forwardedHeader[0]
        : forwardedHeader;
      const rawIp =
        rawForwarded?.split(',')[0]?.trim() ||
        (request.headers['x-real-ip'] as string) ||
        request.ip ||
        request.connection?.remoteAddress ||
        '';

      let cleanIp = rawIp.replace(/^::ffff:/i, '').trim();
      if (
        cleanIp === '::1' ||
        cleanIp === 'localhost' ||
        /^172\.(1[6-9]|2[0-9]|3[0-1])\.\d+\.\d+$/.test(cleanIp)
      ) {
        cleanIp = '127.0.0.1';
      }

      const sanitizedData =
        typeof responseData === 'object' && responseData !== null
          ? redactSensitiveData(responseData)
          : Prisma.JsonNull;

      await this.prisma.auditLog.create({
        data: {
          userId: user?.id || null,
          action: `${method} ${handler}`,
          entityType: controller.replace('Controller', ''),
          entityId: request.params?.id || null,
          oldData: Prisma.JsonNull,
          newData: sanitizedData,
          ipAddress: cleanIp || null,
          userAgent: request.headers['user-agent'] || null,
        },
      });
    } catch (err: any) {
      this.logger.error(`Audit log failed: ${err.message}`);
    }
  }
}
