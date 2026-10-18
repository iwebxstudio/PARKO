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
  private processingPlates = new Set<string>();

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
   * Check-in a vehicle — with auto-charge (prepaid)
   */
  async checkIn(dto: CheckInDto, userId: string) {
    // Validate vehicle type exists
    const vehicleType = await this.prisma.vehicleType.findUnique({
      where: { id: dto.vehicleTypeId },
    });
    if (!vehicleType) {
      throw new BadRequestException('Invalid vehicle type');
    }

    // ── Prevent duplicate check-in: Composite Unique (vehicleType + province + letters + number) ──
    const plateNum = dto.plateNumber?.trim() || null;
    const plateLet = dto.plateLetters?.trim() || null;
    const plateProv = dto.plateProvince?.trim() || null;

    const lockKey = `${dto.vehicleTypeId}-${plateProv}-${plateLet}-${plateNum}`;
    if (this.processingPlates.has(lockKey)) {
      throw new BadRequestException(
        'ກຳລັງປະມວນຜົນລົດຄັນນີ້ຢູ່... ກະລຸນາລໍຖ້າ (Processing...)',
      );
    }
    this.processingPlates.add(lockKey);

    try {
      if (plateNum && plateLet) {
        const existingActive = await this.prisma.parkingTicket.findFirst({
          where: {
            vehicleTypeId: dto.vehicleTypeId,
            plateNumber: plateNum,
            plateLetters: plateLet,
            plateProvince: plateProv,
            status: TicketStatus.ACTIVE,
          },
          include: { vehicleType: true },
        });
        if (existingActive) {
          const fullPlate = [plateProv, plateLet, plateNum]
            .filter(Boolean)
            .join(' ');
          throw new BadRequestException(
            `ປ້າຍລົດ "${fullPlate}" (${existingActive.vehicleType?.label}) ຍັງຈອດຢູ່ (Ticket: ${existingActive.ticketNumber}). ກະລຸນາ Check-out ກ່ອນ!`,
          );
        }
      }

      // Build combined plate string for membership lookup & display
      const combinedPlate = [plateLet, plateNum].filter(Boolean).join(' ');

      // ── Check Membership ──
      let membershipId: string | null = null;
      let isMember = false;

      if (combinedPlate) {
        const activeMembership = await this.prisma.membership.findFirst({
          where: {
            plateNumber: combinedPlate,
            status: 'ACTIVE',
            endDate: { gte: new Date() },
          },
          orderBy: { endDate: 'desc' },
        });

        if (activeMembership) {
          membershipId = activeMembership.id;
          isMember = true;
        }
      }

      // ── Auto-charge: look up pricing rule ──
      const parkingType = dto.parkingType || ParkingType.DAILY;
      let prepaidAmount: number | null = null;
      let isPrepaid = false;

      if (isMember) {
        prepaidAmount = 0;
        isPrepaid = true;
      } else {
        const pricingRule = await this.prisma.pricingRule.findFirst({
          where: { vehicleTypeId: dto.vehicleTypeId, isActive: true },
          orderBy: { createdAt: 'desc' },
        });

        if (pricingRule) {
          switch (parkingType) {
            case ParkingType.DAILY:
              prepaidAmount = Number(pricingRule.dailyRate);
              break;
            case ParkingType.WEEKLY:
              prepaidAmount = Number(pricingRule.weeklyRate);
              break;
            case ParkingType.MONTHLY:
              prepaidAmount = Number(pricingRule.monthlyRate);
              break;
            default:
              // Fallback for legacy HOURLY — no prepaid
              prepaidAmount = dto.prepaidAmount || null;
          }
        }

        // Use explicit prepaidAmount from DTO if provided (override)
        if (dto.prepaidAmount && dto.prepaidAmount > 0) {
          prepaidAmount = Number(dto.prepaidAmount);
        }

        isPrepaid = prepaidAmount !== null && prepaidAmount > 0;
      }

      let ticket: any;
      let ticketNumber = '';

      for (let attempt = 0; attempt < 5; attempt++) {
        ticketNumber = await this.generateTicketNumber();

        // QR code data contains all essential ticket info
        const qrCodeData = JSON.stringify({
          ticketNumber,
          vehicleType: vehicleType.name,
          plateNumber: combinedPlate || null,
          plateProvince: plateProv,
          checkInAt: new Date().toISOString(),
          system: 'PARKO',
        });

        try {
          ticket = await this.prisma.$transaction(async (tx) => {
            const created = await tx.parkingTicket.create({
              data: {
                ticketNumber,
                vehicleTypeId: dto.vehicleTypeId,
                plateNumber: plateNum,
                plateLetters: plateLet,
                plateProvince: plateProv,
                qrCodeData,
                parkingType: parkingType,
                customStart: dto.customStart ? new Date(dto.customStart) : null,
                customEnd: dto.customEnd ? new Date(dto.customEnd) : null,
                prepaidAmount: isPrepaid ? prepaidAmount : null,
                totalAmount: isPrepaid ? prepaidAmount : null,
                checkedInById: userId,
                membershipId: membershipId,
                notes: dto.notes || null,
                paymentStatus: isPrepaid
                  ? PaymentStatus.PAID
                  : PaymentStatus.UNPAID,
              },
              include: {
                vehicleType: true,
                checkedInBy: {
                  select: { id: true, displayName: true },
                },
              },
            });

            // Create payment record for prepaid tickets atomically in the same transaction
            if (isPrepaid && prepaidAmount && prepaidAmount > 0) {
              await tx.payment.create({
                data: {
                  ticketId: created.id,
                  amount: prepaidAmount,
                  paymentMethod: 'CASH',
                  receivedById: userId,
                },
              });
            }

            return created;
          });

          break; // successfully created
        } catch (err: any) {
          if (
            err.code === 'P2002' &&
            err.meta?.target?.includes('ticket_number') &&
            attempt < 4
          ) {
            continue; // retry with fresh ticket number
          }
          throw err;
        }
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
        where: { status: TicketStatus.ACTIVE },
      });

      const capacitySetting = await this.prisma.systemSetting.findUnique({
        where: { key: 'parking_capacity' },
      });

      if (capacitySetting) {
        const capacity = Number((capacitySetting?.value as any)?.limit || 0);
        const threshold = Number(
          (capacitySetting?.value as any)?.threshold || 0.9,
        );
        if (capacity > 0 && activeTickets >= capacity * threshold) {
          this.parkingGateway.broadcastUpdate({
            type: 'CAPACITY_ALERT',
            activeTickets,
            capacity,
            message:
              activeTickets >= capacity
                ? '🚨 ລານຈອດລົດເຕັມແລ້ວ!'
                : `⚠️ ລານຈອດໃກ້ເຕັມ (${activeTickets}/${capacity})`,
          });
        }
      }

      return ticket;
    } finally {
      this.processingPlates.delete(lockKey);
    }
  }

  /**
   * Find ticket by number, plate, or notes for check-out
   */
  async findTicket(identifier: string) {
    const q = identifier.trim();
    if (!q) {
      throw new BadRequestException('ກະລຸນາໃສ່ຂໍ້ມູນຄົ້ນຫາ');
    }

    // Build search conditions for maximum accuracy
    const orConditions: any[] = [
      // 1. Exact ticket number match
      { ticketNumber: q },
      // 2. Plate number contains (e.g., "1234")
      { plateNumber: { contains: q, mode: 'insensitive' } },
      // 3. Plate letters contains (e.g., "ກຂ")
      { plateLetters: { contains: q, mode: 'insensitive' } },
      // 4. Province contains (e.g., "ນະຄອນຫລວງ")
      { plateProvince: { contains: q, mode: 'insensitive' } },
      // 5. Notes contains (e.g., "ລົດສີແດງ", phone number)
      { notes: { contains: q, mode: 'insensitive' } },
      // 6. Member Code match (e.g., "M-0001", "0001")
      { membership: { memberCode: { contains: q, mode: 'insensitive' } } },
      // 7. Member Plate match
      { membership: { plateNumber: { contains: q, mode: 'insensitive' } } },
    ];

    // If input has space, try combined plate search (e.g., "ກຂ 1234")
    const parts = q.split(/\s+/).filter(Boolean);
    if (parts.length >= 2) {
      orConditions.push({
        AND: [
          { plateLetters: { contains: parts[0], mode: 'insensitive' } },
          {
            plateNumber: {
              contains: parts[parts.length - 1],
              mode: 'insensitive',
            },
          },
        ],
      });
    }

    const tickets = await this.prisma.parkingTicket.findMany({
      where: {
        status: TicketStatus.ACTIVE,
        OR: orConditions,
      },
      include: {
        vehicleType: {
          include: {
            pricingRules: true,
          },
        },
        membership: true,
        checkedInBy: {
          select: { id: true, displayName: true },
        },
      },
    });

    if (tickets.length === 0) {
      // Check if it exists but is already completed
      const pastTicket = await this.prisma.parkingTicket.findFirst({
        where: {
          OR: [
            { ticketNumber: q },
            { plateNumber: { contains: q, mode: 'insensitive' } },
            { plateLetters: { contains: q, mode: 'insensitive' } },
            { notes: { contains: q, mode: 'insensitive' } },
          ],
        },
        orderBy: { checkOutAt: 'desc' },
      });

      if (pastTicket && pastTicket.status === TicketStatus.COMPLETED) {
        throw new BadRequestException(
          'ລົດຄັນນີ້ໄດ້ອອກໄປແລ້ວ (Already Checked-out)',
        );
      }

      throw new NotFoundException(
        'ບໍ່ພົບ Ticket ທີ່ກຳລັງຈອດຢູ່ (Active ticket not found)',
      );
    }

    const processedTickets = await Promise.all(
      tickets.map(async (t) => {
        const cost = await this.calculateCost(t);
        return {
          ...t,
          calculatedCost: cost,
          duration: this.calculateDuration(t.checkInAt, new Date()),
        };
      }),
    );

    if (processedTickets.length === 1) {
      return { isMultiple: false, data: processedTickets[0] };
    }

    return { isMultiple: true, data: processedTickets };
  }

  /**
   * Check-out a vehicle
   */
  async checkOut(dto: CheckOutDto, userId: string) {
    const cleanId = dto.identifier.trim();
    const parts = cleanId.split(/\s+/).filter(Boolean);
    const isUuid =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
        cleanId,
      );
    const orConditions: any[] = [
      { ticketNumber: cleanId },
      { plateNumber: cleanId },
      { membership: { memberCode: cleanId } },
      { notes: { contains: cleanId, mode: 'insensitive' } },
    ];
    if (isUuid) {
      orConditions.push({ id: cleanId }, { membershipId: cleanId });
    }
    if (parts.length >= 2) {
      orConditions.push({
        AND: [
          { plateLetters: { contains: parts[0], mode: 'insensitive' } },
          {
            plateNumber: {
              contains: parts[parts.length - 1],
              mode: 'insensitive',
            },
          },
        ],
      });
    }

    const ticket = await this.prisma.parkingTicket.findFirst({
      where: {
        status: TicketStatus.ACTIVE,
        OR: orConditions,
      },
      include: {
        vehicleType: {
          include: {
            pricingRules: true,
          },
        },
        membership: true,
      },
    });

    if (!ticket) {
      throw new NotFoundException('Active ticket not found');
    }

    const calculatedTotal = await this.calculateCost(ticket);
    const totalAmount =
      dto.amountPaid !== undefined ? dto.amountPaid : calculatedTotal;
    const checkOutAt = new Date();

    // Atomic transaction: re-verify active status and update ticket + payment
    const updatedTicket = await this.prisma.$transaction(async (tx) => {
      // Re-query ticket inside transaction to prevent double checkout race condition
      const activeTicket = await tx.parkingTicket.findUnique({
        where: { id: ticket.id },
      });

      if (!activeTicket || activeTicket.status !== TicketStatus.ACTIVE) {
        throw new BadRequestException(
          'ລົດຄັນນີ້ໄດ້ Check-out ໄປແລ້ວ (Ticket already completed)',
        );
      }

      const updated = await tx.parkingTicket.update({
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
          membership: true,
          checkedInBy: { select: { id: true, displayName: true } },
          checkedOutBy: { select: { id: true, displayName: true } },
        },
      });

      // Create payment record atomically in the same transaction
      const paymentAmount =
        dto.amountPaid !== undefined ? dto.amountPaid : totalAmount;
      if (paymentAmount > 0) {
        await tx.payment.create({
          data: {
            ticketId: ticket.id,
            amount: paymentAmount,
            paymentMethod: dto.paymentMethod,
            referenceNumber: dto.referenceNumber || null,
            receivedById: userId,
          },
        });
      }

      return updated;
    });

    this.logger.log(
      `Check-out: ${ticket.ticketNumber} | Amount: ${totalAmount} LAK`,
    );

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
    const membership =
      ticket.membership ||
      (ticket.membershipId
        ? await this.prisma.membership.findUnique({
            where: { id: ticket.membershipId },
          })
        : null);
    const endDateRaw = ticket.customEnd || membership?.endDate;

    // Check if membership or prepaid ticket (CUSTOM, WEEKLY, MONTHLY, or ticket with membershipId)
    if (
      ticket.membershipId ||
      ticket.parkingType === 'CUSTOM' ||
      ticket.parkingType === 'WEEKLY' ||
      ticket.parkingType === 'MONTHLY'
    ) {
      if (endDateRaw) {
        const endDate = new Date(endDateRaw);
        endDate.setHours(23, 59, 59, 999);
        const now = new Date();
        if (now.getTime() > endDate.getTime()) {
          // Overdue past end date! Calculate overdue days
          const diffMs = now.getTime() - endDate.getTime();
          const overdueDays = Math.max(
            1,
            Math.ceil(diffMs / (1000 * 60 * 60 * 24)),
          );

          const pricingRule = await this.prisma.pricingRule.findFirst({
            where: {
              vehicleTypeId: ticket.vehicleTypeId,
              isActive: true,
            },
            orderBy: { createdAt: 'desc' },
          });

          const dailyRate = Number(pricingRule?.dailyRate || 0);
          return Math.round(overdueDays * dailyRate);
        }
      }
      return 0; // Within valid paid period, 0 extra fee
    }

    // If prepaid (weekly/monthly), return prepaid amount
    if (ticket.prepaidAmount !== null && Number(ticket.prepaidAmount) > 0) {
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
  async getActiveTickets(page = 1, limit = 20, vehicleTypeId?: number) {
    const skip = (page - 1) * limit;
    const where: any = { status: TicketStatus.ACTIVE };
    if (vehicleTypeId) {
      where.vehicleTypeId = vehicleTypeId;
    }

    const [tickets, total] = await Promise.all([
      this.prisma.parkingTicket.findMany({
        where,
        skip,
        take: limit,
        orderBy: { checkInAt: 'desc' },
        include: {
          vehicleType: {
            include: {
              pricingRules: true,
            },
          },
          membership: true,
          checkedInBy: { select: { displayName: true } },
        },
      }),
      this.prisma.parkingTicket.count({
        where,
      }),
    ]);

    const ticketsWithCost = await Promise.all(
      tickets.map(async (t) => {
        const calculatedCost = await this.calculateCost(t);
        return {
          ...t,
          calculatedCost,
          duration: this.calculateDuration(t.checkInAt, new Date()),
        };
      }),
    );

    return {
      tickets: ticketsWithCost,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  /**
   * Get all completed/checked out tickets (History)
   */
  async getHistoryTickets(
    page = 1,
    limit = 20,
    vehicleTypeId?: number,
    search?: string,
  ) {
    const skip = (page - 1) * limit;
    const where: any = { status: TicketStatus.COMPLETED };
    if (vehicleTypeId) {
      where.vehicleTypeId = vehicleTypeId;
    }
    if (search && search.trim()) {
      const q = search.trim();
      const parts = q.split(/\s+/).filter(Boolean);
      const orConditions: any[] = [
        { ticketNumber: { contains: q, mode: 'insensitive' } },
        { plateNumber: { contains: q, mode: 'insensitive' } },
        { plateLetters: { contains: q, mode: 'insensitive' } },
        { plateProvince: { contains: q, mode: 'insensitive' } },
        { notes: { contains: q, mode: 'insensitive' } },
      ];
      if (parts.length >= 2) {
        orConditions.push({
          AND: [
            { plateLetters: { contains: parts[0], mode: 'insensitive' } },
            {
              plateNumber: {
                contains: parts[parts.length - 1],
                mode: 'insensitive',
              },
            },
          ],
        });
      }
      where.OR = orConditions;
    }

    const [tickets, total] = await Promise.all([
      this.prisma.parkingTicket.findMany({
        where,
        skip,
        take: limit,
        orderBy: { checkOutAt: 'desc' },
        include: {
          vehicleType: {
            include: {
              pricingRules: true,
            },
          },
          membership: true,
          checkedInBy: { select: { displayName: true } },
          checkedOutBy: { select: { displayName: true } },
        },
      }),
      this.prisma.parkingTicket.count({
        where,
      }),
    ]);

    return {
      tickets,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  /**
   * Delete a parking ticket completely (Admin only)
   */
  async deleteTicket(id: string) {
    const ticket = await this.prisma.parkingTicket.findUnique({
      where: { id },
    });

    if (!ticket) {
      throw new NotFoundException('Ticket not found');
    }

    // First delete any associated payments
    await this.prisma.payment.deleteMany({
      where: { ticketId: id },
    });

    // Then delete the ticket
    await this.prisma.parkingTicket.delete({
      where: { id },
    });

    this.logger.log(`Ticket deleted by Admin: ${ticket.ticketNumber}`);

    // Broadcast refresh so dashboard updates
    this.parkingGateway.broadcastUpdate({ type: 'stats_refresh' });

    return { success: true, message: 'Ticket deleted successfully' };
  }
}
