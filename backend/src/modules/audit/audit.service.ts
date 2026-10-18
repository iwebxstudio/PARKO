// ============================================
// PARKO — Audit Service
// Query audit logs
// ============================================
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class AuditService {
  constructor(private prisma: PrismaService) {}

  async findAll(
    page = 1,
    limit = 50,
    filters?: {
      userId?: string;
      entityType?: string;
      dateFrom?: string;
      dateTo?: string;
    },
  ) {
    const skip = (page - 1) * limit;
    const where: any = {};

    if (filters?.userId) where.userId = filters.userId;
    if (filters?.entityType) where.entityType = filters.entityType;
    if (filters?.dateFrom || filters?.dateTo) {
      where.createdAt = {};
      if (filters.dateFrom) where.createdAt.gte = new Date(filters.dateFrom);
      if (filters.dateTo) where.createdAt.lte = new Date(filters.dateTo);
    }

    const [logs, total] = await Promise.all([
      this.prisma.auditLog.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: { user: { select: { displayName: true, username: true } } },
      }),
      this.prisma.auditLog.count({ where }),
    ]);

    return {
      logs,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  async deleteOldLogs(months: number = 3) {
    const date = new Date();
    date.setMonth(date.getMonth() - months);

    const result = await this.prisma.auditLog.deleteMany({
      where: {
        createdAt: {
          lt: date,
        },
      },
    });

    return {
      message: `Deleted ${result.count} logs older than ${months} months`,
      deletedCount: result.count,
    };
  }

  async deleteAllLogs() {
    const result = await this.prisma.auditLog.deleteMany({});
    return {
      message: `Deleted all ${result.count} logs`,
      deletedCount: result.count,
    };
  }
}
