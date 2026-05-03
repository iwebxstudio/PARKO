// ============================================
// PARKO — Reports Service
// Statistics & export (PDF/Excel)
// ============================================
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { TicketStatus } from '@prisma/client';

@Injectable()
export class ReportsService {
  constructor(private prisma: PrismaService) {}

  /**
   * Get revenue report by period
   */
  async getRevenueReport(period: 'daily' | 'monthly' | 'yearly', dateFrom?: string, dateTo?: string) {
    const from = dateFrom ? new Date(dateFrom) : new Date(new Date().setDate(new Date().getDate() - 30));
    const to = dateTo ? new Date(dateTo) : new Date();

    const payments = await this.prisma.payment.findMany({
      where: { paidAt: { gte: from, lte: to } },
      include: { ticket: { include: { vehicleType: true } } },
      orderBy: { paidAt: 'asc' },
    });

    // Aggregate by period
    const grouped = new Map<string, { total: number; count: number; byType: Record<string, number> }>();

    for (const payment of payments) {
      let key: string;
      const d = new Date(payment.paidAt);
      switch (period) {
        case 'daily': key = d.toISOString().split('T')[0]; break;
        case 'monthly': key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`; break;
        case 'yearly': key = String(d.getFullYear()); break;
      }

      if (!grouped.has(key)) grouped.set(key, { total: 0, count: 0, byType: {} });
      const entry = grouped.get(key)!;
      entry.total += Number(payment.amount);
      entry.count++;
      const typeName = payment.ticket?.vehicleType?.label || 'Unknown';
      entry.byType[typeName] = (entry.byType[typeName] || 0) + Number(payment.amount);
    }

    return {
      period,
      dateRange: { from: from.toISOString(), to: to.toISOString() },
      data: Array.from(grouped.entries()).map(([key, val]) => ({ date: key, ...val })),
      summary: {
        totalRevenue: payments.reduce((sum, p) => sum + Number(p.amount), 0),
        totalTransactions: payments.length,
        currency: 'LAK',
      },
    };
  }

  /**
   * Get vehicle count report
   */
  async getVehicleReport(period: 'daily' | 'monthly' | 'yearly', dateFrom?: string, dateTo?: string, type: 'in' | 'out' = 'in') {
    const from = dateFrom ? new Date(dateFrom) : new Date(new Date().setDate(new Date().getDate() - 30));
    const to = dateTo ? new Date(dateTo) : new Date();

    const whereClause = type === 'out' 
      ? { checkOutAt: { gte: from, lte: to }, status: 'COMPLETED' as TicketStatus }
      : { checkInAt: { gte: from, lte: to } };

    const tickets = await this.prisma.parkingTicket.findMany({
      where: whereClause,
      include: { vehicleType: true },
      orderBy: type === 'out' ? { checkOutAt: 'asc' } : { checkInAt: 'asc' },
    });

    const grouped = new Map<string, { total: number; byType: Record<string, number> }>();

    for (const ticket of tickets) {
      let key: string;
      const dateToUse = type === 'out' ? ticket.checkOutAt! : ticket.checkInAt;
      const d = new Date(dateToUse);
      switch (period) {
        case 'daily': key = d.toISOString().split('T')[0]; break;
        case 'monthly': key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`; break;
        case 'yearly': key = String(d.getFullYear()); break;
      }

      if (!grouped.has(key)) grouped.set(key, { total: 0, byType: {} });
      const entry = grouped.get(key)!;
      entry.total++;
      const typeName = ticket.vehicleType?.label || 'Unknown';
      entry.byType[typeName] = (entry.byType[typeName] || 0) + 1;
    }

    return {
      period,
      dateRange: { from: from.toISOString(), to: to.toISOString() },
      data: Array.from(grouped.entries()).map(([key, val]) => ({ date: key, ...val })),
      summary: { totalVehicles: tickets.length },
    };
  }

  /**
   * Export data as JSON (frontend generates PDF/Excel)
   */
  async getExportData(dateFrom: string, dateTo: string) {
    const from = new Date(dateFrom);
    const to = new Date(dateTo);

    const [tickets, payments] = await Promise.all([
      this.prisma.parkingTicket.findMany({
        where: { checkInAt: { gte: from, lte: to } },
        include: {
          vehicleType: true,
          checkedInBy: { select: { displayName: true } },
          checkedOutBy: { select: { displayName: true } },
        },
        orderBy: { checkInAt: 'desc' },
      }),
      this.prisma.payment.findMany({
        where: { paidAt: { gte: from, lte: to } },
        include: {
          ticket: { include: { vehicleType: true } },
          receivedBy: { select: { displayName: true } },
        },
        orderBy: { paidAt: 'desc' },
      }),
    ]);

    return { tickets, payments, dateRange: { from: from.toISOString(), to: to.toISOString() }, currency: 'LAK' };
  }

  /**
   * Get comprehensive stats for dashboard
   */
  async getDashboardStats() {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfYear = new Date(now.getFullYear(), 0, 1);

    // Vehicles - In (checkInAt)
    const inToday = await this.prisma.parkingTicket.count({ where: { checkInAt: { gte: startOfToday } } });
    const inMonth = await this.prisma.parkingTicket.count({ where: { checkInAt: { gte: startOfMonth } } });
    const inYear = await this.prisma.parkingTicket.count({ where: { checkInAt: { gte: startOfYear } } });
    const inAll = await this.prisma.parkingTicket.count();
    const parked = await this.prisma.parkingTicket.count({ where: { status: 'ACTIVE' } });

    // Vehicles - Out (checkOutAt)
    const outToday = await this.prisma.parkingTicket.count({ where: { checkOutAt: { gte: startOfToday }, status: 'COMPLETED' } });
    const outMonth = await this.prisma.parkingTicket.count({ where: { checkOutAt: { gte: startOfMonth }, status: 'COMPLETED' } });
    const outYear = await this.prisma.parkingTicket.count({ where: { checkOutAt: { gte: startOfYear }, status: 'COMPLETED' } });
    const outAll = await this.prisma.parkingTicket.count({ where: { status: 'COMPLETED' } });

    // Revenue (paidAt)
    const revTodayAgg = await this.prisma.payment.aggregate({ _sum: { amount: true }, where: { paidAt: { gte: startOfToday } } });
    const revMonthAgg = await this.prisma.payment.aggregate({ _sum: { amount: true }, where: { paidAt: { gte: startOfMonth } } });
    const revYearAgg = await this.prisma.payment.aggregate({ _sum: { amount: true }, where: { paidAt: { gte: startOfYear } } });
    const revAllAgg = await this.prisma.payment.aggregate({ _sum: { amount: true } });

    // Vehicle types breakdown (Active / Parked)
    const activeGrouped = await this.prisma.parkingTicket.groupBy({
      by: ['vehicleTypeId'],
      where: { status: 'ACTIVE' },
      _count: { id: true },
    });

    const vehicleTypes = await this.prisma.vehicleType.findMany();
    const typeBreakdown = activeGrouped.map(g => {
      const vType = vehicleTypes.find(t => t.id === g.vehicleTypeId);
      return {
        id: vType?.id || g.vehicleTypeId,
        name: vType?.name || 'Unknown',
        label: vType?.label || 'Unknown',
        count: g._count.id
      };
    }).sort((a, b) => b.count - a.count);

    return {
      vehicles: {
        parked,
        in: { today: inToday, month: inMonth, year: inYear, all: inAll },
        out: { today: outToday, month: outMonth, year: outYear, all: outAll },
        byType: typeBreakdown
      },
      revenue: {
        today: Number(revTodayAgg._sum.amount || 0),
        month: Number(revMonthAgg._sum.amount || 0),
        year: Number(revYearAgg._sum.amount || 0),
        all: Number(revAllAgg._sum.amount || 0),
      }
    };
  }
}
