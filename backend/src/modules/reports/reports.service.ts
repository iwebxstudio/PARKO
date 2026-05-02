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
  async getVehicleReport(period: 'daily' | 'monthly' | 'yearly', dateFrom?: string, dateTo?: string) {
    const from = dateFrom ? new Date(dateFrom) : new Date(new Date().setDate(new Date().getDate() - 30));
    const to = dateTo ? new Date(dateTo) : new Date();

    const tickets = await this.prisma.parkingTicket.findMany({
      where: { checkInAt: { gte: from, lte: to } },
      include: { vehicleType: true },
      orderBy: { checkInAt: 'asc' },
    });

    const grouped = new Map<string, { total: number; byType: Record<string, number> }>();

    for (const ticket of tickets) {
      let key: string;
      const d = new Date(ticket.checkInAt);
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
}
