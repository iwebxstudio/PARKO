// ============================================
// PARKO — Lost Ticket Service
// Handles lost ticket cases with evidence
// ============================================
import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateLostTicketDto, ResolveLostTicketDto } from './dto';
import { TicketStatus } from '@prisma/client';

@Injectable()
export class LostTicketService {
  private readonly logger = new Logger(LostTicketService.name);

  constructor(private prisma: PrismaService) {}

  /**
   * Create a lost ticket case
   */
  async create(dto: CreateLostTicketDto, staffId: string) {
    // Verify ticket exists
    const ticket = await this.prisma.parkingTicket.findUnique({
      where: { id: dto.ticketId },
    });

    if (!ticket) throw new NotFoundException('Ticket not found');

    // Mark ticket as LOST
    await this.prisma.parkingTicket.update({
      where: { id: dto.ticketId },
      data: { status: TicketStatus.LOST },
    });

    const lostCase = await this.prisma.lostTicketCase.create({
      data: {
        ticketId: dto.ticketId,
        staffId,
        notes: dto.notes,
        vehiclePhotoUrl: dto.vehiclePhotoUrl || null,
        driverPhotoUrl: dto.driverPhotoUrl || null,
        idCardPhotoUrl: dto.idCardPhotoUrl || null,
      },
      include: {
        ticket: { include: { vehicleType: true } },
        staff: { select: { displayName: true } },
      },
    });

    this.logger.warn(`Lost ticket case created: ${ticket.ticketNumber} by ${staffId}`);
    return lostCase;
  }

  /**
   * Get all lost ticket cases
   */
  async findAll(page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const [cases, total] = await Promise.all([
      this.prisma.lostTicketCase.findMany({
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          ticket: { include: { vehicleType: true } },
          staff: { select: { displayName: true } },
          resolvedBy: { select: { displayName: true } },
        },
      }),
      this.prisma.lostTicketCase.count(),
    ]);

    return {
      cases,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  /**
   * Get a single lost ticket case
   */
  async findOne(id: string) {
    const lostCase = await this.prisma.lostTicketCase.findUnique({
      where: { id },
      include: {
        ticket: { include: { vehicleType: true } },
        staff: { select: { displayName: true } },
        resolvedBy: { select: { displayName: true } },
      },
    });

    if (!lostCase) throw new NotFoundException('Lost ticket case not found');
    return lostCase;
  }

  /**
   * Resolve a lost ticket case
   */
  async resolve(id: string, dto: ResolveLostTicketDto, resolvedById: string) {
    const lostCase = await this.findOne(id);

    const updated = await this.prisma.lostTicketCase.update({
      where: { id },
      data: {
        resolution: dto.resolution,
        penaltyAmount: dto.penaltyAmount || 0,
        resolvedAt: new Date(),
        resolvedById,
      },
      include: {
        ticket: { include: { vehicleType: true } },
        staff: { select: { displayName: true } },
        resolvedBy: { select: { displayName: true } },
      },
    });

    // If resolved, complete the ticket
    if (dto.resolution === 'RESOLVED') {
      await this.prisma.parkingTicket.update({
        where: { id: lostCase.ticketId },
        data: {
          status: TicketStatus.COMPLETED,
          checkOutAt: new Date(),
          totalAmount: dto.penaltyAmount || 0,
          paymentStatus: 'PAID',
        },
      });
    }

    this.logger.log(`Lost ticket case ${id} resolved: ${dto.resolution}`);
    return updated;
  }
}
