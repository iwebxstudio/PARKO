// ============================================
// PARKO — Parking Service
// Core business logic: check-in, check-out, pricing
// ============================================
import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CheckInDto, CheckOutDto } from './dto';
import { TicketStatus, PaymentStatus, ParkingType } from '@prisma/client';
import { ParkingGateway } from './parking.gateway';

@Injectable()
export class ParkingService {
  private readonly logger = new Logger(ParkingService.name);

  constructor(
    private prisma: PrismaService,
    private parkingGateway: ParkingGateway,
  ) {}

  /**
   * Generate a unique 5-digit ticket number
   */
  private async generateTicketNumber(): Promise<string> {
    let ticketNumber: string = '';
    let exists = true;

    while (exists) {
      ticketNumber = String(Math.floor(10000 + Math.random() * 90000));
      const existing = await this.prisma.parkingTicket.findUnique({
        where: { ticketNumber },
      });
      exists = !!existing;
    }

    return ticketNumber;
  }

  /**
   * Check-in a vehicle
   */
  async checkIn(dto: CheckInDto, userId: string) {
    // Validate vehicle type exists
    const vehicleType = await this.prisma.vehicleType.findUnique({
      where: { id: dto.vehicleTypeId },
    });
    if (!vehicleType) {
      throw new BadRequestException('Invalid vehicle type');
    }

    const ticketNumber = await this.generateTicketNumber();

    // QR code data contains all essential ticket info
    const qrCodeData = JSON.stringify({
      ticketNumber,
      vehicleType: vehicleType.name,
      plateNumber: dto.plateNumber || null,
      checkInAt: new Date().toISOString(),
      system: 'PARKO',
    });

    const ticket = await this.prisma.parkingTicket.create({
      data: {
        ticketNumber,
        vehicleTypeId: dto.vehicleTypeId,
        plateNumber: dto.plateNumber || null,
        plateProvince: dto.plateProvince || null,
        qrCodeData,
        parkingType: dto.parkingType || ParkingType.HOURLY,
        customStart: dto.customStart ? new Date(dto.customStart) : null,
        customEnd: dto.customEnd ? new Date(dto.customEnd) : null,
        prepaidAmount: dto.prepaidAmount || null,
        checkedInById: userId,
        notes: dto.notes || null,
        paymentStatus: dto.prepaidAmount ? PaymentStatus.PAID : PaymentStatus.UNPAID,
      },
      include: {
        vehicleType: true,
        checkedInBy: {
          select: { id: true, displayName: true },
        },
      },
    });

    // If prepaid, create payment record
    if (dto.prepaidAmount) {
      await this.prisma.payment.create({
        data: {
          ticketId: ticket.id,
          amount: dto.prepaidAmount,
          paymentMethod: 'CASH',
          receivedById: userId,
        },
      });
    }

    this.logger.log(`Check-in: ${ticketNumber} | Type: ${vehicleType.name}`);

    // Broadcast real-time update
    this.parkingGateway.broadcastUpdate({
      type: 'CHECK_IN',
      ticket: {
        ticketNumber: ticket.ticketNumber,
        vehicleType: ticket.vehicleType.name,
        plateNumber: ticket.plateNumber,
        checkInAt: ticket.checkInAt,
      },
    });

    // Soft Limit check
    const activeTickets = await this.prisma.parkingTicket.count({
      where: { status: TicketStatus.ACTIVE }
    });
    
    const capacitySetting = await this.prisma.systemSetting.findUnique({
      where: { key: 'parking_capacity' }
    });
    
    if (capacitySetting) {
      const capacity = Number((capacitySetting.value as any)?.limit || 0);
      const threshold = Number((capacitySetting.value as any)?.threshold || 0.9);
      if (capacity > 0 && activeTickets >= capacity * threshold) {
        this.parkingGateway.broadcastUpdate({
          type: 'CAPACITY_ALERT',
          activeTickets,
          capacity,
          message: activeTickets >= capacity 
            ? '🚨 ลานจอดรถเต็มแล้ว!' 
            : `⚠️ ความจุลานจอดใกล้เต็ม (${activeTickets}/${capacity})`,
        });
      }
    }

    return ticket;
  }

  /**
   * Find ticket by number or plate for check-out
   */
  async findTicket(identifier: string) {
    const ticket = await this.prisma.parkingTicket.findFirst({
      where: {
        status: TicketStatus.ACTIVE,
        OR: [
          { ticketNumber: identifier },
          { plateNumber: identifier },
        ],
      },
      include: {
        vehicleType: true,
        checkedInBy: {
          select: { id: true, displayName: true },
        },
      },
    });

    if (!ticket) {
      throw new NotFoundException('Active ticket not found');
    }

    // Calculate current cost
    const cost = await this.calculateCost(ticket);

    return {
      ...ticket,
      calculatedCost: cost,
      duration: this.calculateDuration(ticket.checkInAt, new Date()),
    };
  }

  /**
   * Check-out a vehicle
   */
  async checkOut(dto: CheckOutDto, userId: string) {
    const ticket = await this.prisma.parkingTicket.findFirst({
      where: {
        status: TicketStatus.ACTIVE,
        OR: [
          { ticketNumber: dto.identifier },
          { plateNumber: dto.identifier },
        ],
      },
      include: {
        vehicleType: true,
      },
    });

    if (!ticket) {
      throw new NotFoundException('Active ticket not found');
    }

    const totalAmount = await this.calculateCost(ticket);
    const checkOutAt = new Date();

    // Update ticket
    const updatedTicket = await this.prisma.parkingTicket.update({
      where: { id: ticket.id },
      data: {
        status: TicketStatus.COMPLETED,
        checkOutAt,
        totalAmount,
        paymentStatus: dto.paymentStatus || PaymentStatus.PAID,
        checkedOutById: userId,
      },
      include: {
        vehicleType: true,
        checkedInBy: { select: { id: true, displayName: true } },
        checkedOutBy: { select: { id: true, displayName: true } },
      },
    });

    // Create payment record
    await this.prisma.payment.create({
      data: {
        ticketId: ticket.id,
        amount: dto.amountPaid || totalAmount,
        paymentMethod: dto.paymentMethod,
        referenceNumber: dto.referenceNumber || null,
        receivedById: userId,
      },
    });

    this.logger.log(`Check-out: ${ticket.ticketNumber} | Amount: ${totalAmount} LAK`);

    // Broadcast real-time update
    this.parkingGateway.broadcastUpdate({
      type: 'CHECK_OUT',
      ticket: {
        ticketNumber: ticket.ticketNumber,
        vehicleType: ticket.vehicleType.name,
        plateNumber: ticket.plateNumber,
        checkOutAt,
        totalAmount,
      },
    });

    return {
      ...updatedTicket,
      totalAmount,
      duration: this.calculateDuration(ticket.checkInAt, checkOutAt),
    };
  }

  /**
   * Calculate parking cost based on pricing rules
   */
  private async calculateCost(ticket: any): Promise<number> {
    // If prepaid (weekly/monthly), return prepaid amount
    if (ticket.prepaidAmount) {
      return Number(ticket.prepaidAmount);
    }

    const pricingRule = await this.prisma.pricingRule.findFirst({
      where: {
        vehicleTypeId: ticket.vehicleTypeId,
        isActive: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!pricingRule) {
      return 0;
    }

    const checkIn = new Date(ticket.checkInAt);
    const checkOut = new Date();
    const diffMs = checkOut.getTime() - checkIn.getTime();
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.ceil(diffMs / (1000 * 60 * 60));
    const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

    // Free period
    if (diffMinutes <= pricingRule.freeMinutes) {
      return 0;
    }

    let cost = Number(pricingRule.basePrice);

    switch (ticket.parkingType) {
      case ParkingType.HOURLY:
        cost += diffHours * Number(pricingRule.hourlyRate);
        break;
      case ParkingType.DAILY:
        cost += diffDays * Number(pricingRule.dailyRate);
        break;
      case ParkingType.WEEKLY:
        cost = Number(pricingRule.weeklyRate);
        break;
      case ParkingType.MONTHLY:
        cost = Number(pricingRule.monthlyRate);
        break;
      default:
        cost += diffHours * Number(pricingRule.hourlyRate);
    }

    return Math.round(cost);
  }

  /**
   * Calculate human-readable duration
   */
  private calculateDuration(checkIn: Date, checkOut: Date) {
    const diffMs = checkOut.getTime() - new Date(checkIn).getTime();
    const hours = Math.floor(diffMs / (1000 * 60 * 60));
    const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    return { hours, minutes, formatted: `${hours}h ${minutes}m` };
  }

  /**
   * Get parking statistics for dashboard
   */
  async getDashboardStats() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [
      activeCount,
      todayCheckIns,
      todayCheckOuts,
      todayRevenue,
      vehicleTypeStats,
    ] = await Promise.all([
      // Currently parked vehicles
      this.prisma.parkingTicket.count({
        where: { status: TicketStatus.ACTIVE },
      }),
      // Today's check-ins
      this.prisma.parkingTicket.count({
        where: { checkInAt: { gte: today } },
      }),
      // Today's check-outs
      this.prisma.parkingTicket.count({
        where: {
          checkOutAt: { gte: today },
          status: TicketStatus.COMPLETED,
        },
      }),
      // Today's revenue
      this.prisma.payment.aggregate({
        where: { paidAt: { gte: today } },
        _sum: { amount: true },
      }),
      // Vehicles by type (active)
      this.prisma.parkingTicket.groupBy({
        by: ['vehicleTypeId'],
        where: { status: TicketStatus.ACTIVE },
        _count: true,
      }),
    ]);

    // Get vehicle type names
    const vehicleTypes = await this.prisma.vehicleType.findMany();
    const typeMap = new Map(vehicleTypes.map((vt) => [vt.id, vt]));

    const vehicleBreakdown = vehicleTypeStats.map((stat) => ({
      vehicleType: typeMap.get(stat.vehicleTypeId)?.label || 'Unknown',
      icon: typeMap.get(stat.vehicleTypeId)?.icon || '🚗',
      count: stat._count,
    }));

    return {
      activeVehicles: activeCount,
      todayCheckIns,
      todayCheckOuts,
      todayRevenue: Number(todayRevenue._sum.amount || 0),
      vehicleBreakdown,
      currency: 'LAK',
    };
  }

  /**
   * Get recent activity
   */
  async getRecentActivity(limit = 10) {
    return this.prisma.parkingTicket.findMany({
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        vehicleType: true,
        checkedInBy: { select: { displayName: true } },
        checkedOutBy: { select: { displayName: true } },
      },
    });
  }

  /**
   * Get all active tickets
   */
  async getActiveTickets(page = 1, limit = 20) {
    const skip = (page - 1) * limit;

    const [tickets, total] = await Promise.all([
      this.prisma.parkingTicket.findMany({
        where: { status: TicketStatus.ACTIVE },
        skip,
        take: limit,
        orderBy: { checkInAt: 'desc' },
        include: {
          vehicleType: true,
          checkedInBy: { select: { displayName: true } },
        },
      }),
      this.prisma.parkingTicket.count({
        where: { status: TicketStatus.ACTIVE },
      }),
    ]);

    return {
      tickets,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }
}
