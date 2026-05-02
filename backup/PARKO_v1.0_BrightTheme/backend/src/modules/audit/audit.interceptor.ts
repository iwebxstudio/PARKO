// ============================================
// PARKO — Audit Interceptor
// Automatically logs all CUD operations
// ============================================
import {
  Injectable, NestInterceptor, ExecutionContext, CallHandler, Logger,
} from '@nestjs/common';
import { Observable, tap } from 'rxjs';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class AuditInterceptor implements NestInterceptor {
  private readonly logger = new Logger(AuditInterceptor.name);

  constructor(private prisma: PrismaService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const method = request.method;

    // Only log modifying operations
    if (['GET', 'HEAD', 'OPTIONS'].includes(method)) {
      return next.handle();
    }

    const user = request.user;

    return next.handle().pipe(
      tap(async (responseData) => {
        try {
          const handler = context.getHandler().name;
          const controller = context.getClass().name;

          await this.prisma.auditLog.create({
            data: {
              userId: user?.id || null,
              action: `${method} ${handler}`,
              entityType: controller.replace('Controller', ''),
              entityId: request.params?.id || null,
              oldData: Prisma.JsonNull,
              newData: typeof responseData === 'object' ? (responseData as Prisma.InputJsonValue) : Prisma.JsonNull,
              ipAddress: request.ip || request.connection?.remoteAddress,
              userAgent: request.headers['user-agent'] || null,
            },
          });
        } catch (err: any) {
          this.logger.error(`Audit log failed: ${err.message}`);
        }
      }),
    );
  }
}
