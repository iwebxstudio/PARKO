// ==============================================================================
// PARKO — ບໍລິການຈັດການກໍລະນີປີ້ເສຍ (Lost Ticket Service)
// ຈັດການຂະບວນການບັນທຶກຫຼັກຖານປີ້ເສຍ, ປັບປ່ຽນສະຖານະປີ້ ແລະ ຄິດໄລ່ຄ່າປັບໃໝຜ່ານ Transaction
// ==============================================================================
import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateLostTicketDto, ResolveLostTicketDto } from './dto';
import { TicketStatus } from '@prisma/client';

@Injectable()
export class LostTicketService {
  private readonly logger = new Logger(LostTicketService.name);

  constructor(private prisma: PrismaService) {}

  /**
   * ສ້າງລາຍການແຈ້ງປີ້ເສຍໃໝ່ ພ້ອມຮູບພາບຫຼັກຖານລົດ, ຄົນຂັບ ແລະ ບັດປະຈຳຕົວ
   */
  async create(dto: CreateLostTicketDto, staffId: string) {
    // ກວດສອບເບິ່ງວ່າປີ້ຈອດລົດໝາຍເລກນີ້ມີຢູ່ໃນລະບົບແທ້ຫຼືບໍ່
    const ticket = await this.prisma.parkingTicket.findUnique({
      where: { id: dto.ticketId },
    });

    if (!ticket) throw new NotFoundException('Ticket not found');

    // ດຳເນີນການແບບ Transaction: ປ່ຽນສະຖານະປີ້ເປັນ LOST ແລະ ສ້າງຂໍ້ມູນ Lost Ticket Case
    const lostCase = await this.prisma.$transaction(async (tx) => {
      await tx.parkingTicket.update({
        where: { id: dto.ticketId },
        data: { status: TicketStatus.LOST },
      });

      return tx.lostTicketCase.create({
        data: {
          ticketId: dto.ticketId,
          staffId,
          notes: dto.notes,
          vehiclePhotoUrl: dto.vehiclePhotoUrl || null,
          driverPhotoUrl: dto.driverPhotoUrl || null,
          idCardPhotoUrl: dto.idCardPhotoUrl || null,
          penaltyAmount: dto.penaltyAmount || 0,
        },
        include: {
          ticket: { include: { vehicleType: true } },
          staff: { select: { displayName: true } },
        },
      });
    });

    this.logger.warn(
      `Lost ticket case created: ${ticket.ticketNumber} by ${staffId}`,
    );
    return lostCase;
  }

  /**
   * ດຶງລາຍການກໍລະນີປີ້ເສຍທັງໝົດ ພ້ອມຮອງຮັບການຄົ້ນຫາ ແລະ ແບ່ງໜ້າ (Pagination)
   */
  async findAll(page = 1, limit = 20, search?: string) {
    const skip = (page - 1) * limit;
    const where: any = {};

    if (search && search.trim()) {
      const q = search.trim();
      where.OR = [
        { ticket: { ticketNumber: { contains: q, mode: 'insensitive' } } },
        { ticket: { plateNumber: { contains: q, mode: 'insensitive' } } },
        { ticket: { plateLetters: { contains: q, mode: 'insensitive' } } },
        { ticket: { plateProvince: { contains: q, mode: 'insensitive' } } },
        { notes: { contains: q, mode: 'insensitive' } },
        { staff: { displayName: { contains: q, mode: 'insensitive' } } },
        { staff: { username: { contains: q, mode: 'insensitive' } } },
      ];
    }

    const [cases, total] = await Promise.all([
      this.prisma.lostTicketCase.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          ticket: { include: { vehicleType: true } },
          staff: { select: { id: true, displayName: true, username: true } },
          resolvedBy: { select: { id: true, displayName: true, username: true } },
        },
      }),
      this.prisma.lostTicketCase.count({ where }),
    ]);

    return {
      cases,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  /**
   * ລຶບຂໍ້ມູນກໍລະນີປີ້ເສຍອອກຈາກລະບົບ (ອະນຸຍາດສະເພາະ ADMIN ເທົ່ານັ້ນ)
   */
  async remove(id: string) {
    const existing = await this.prisma.lostTicketCase.findUnique({
      where: { id },
    });
    if (!existing) throw new NotFoundException('Lost ticket case not found');

    await this.prisma.lostTicketCase.delete({
      where: { id },
    });
    return { success: true, message: 'Case deleted successfully' };
  }

  /**
   * ດຶງຂໍ້ມູນລາຍລະອຽດຂອງກໍລະນີປີ້ເສຍຕາມ ID
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
   * ແກ້ໄຂ/ປິດກໍລະນີປີ້ເສຍ (Resolve) ພ້ອມທັງເກັບຄ່າປັບໃໝ ແລະ ປ່ຽນສະຖານະປີ້ເປັນ COMPLETED
   */
  async resolve(id: string, dto: ResolveLostTicketDto, resolvedById: string) {
    const lostCase = await this.findOne(id);

    // ດຳເນີນການແບບ Transaction: ອັບເດດຜົນການແກ້ໄຂ, ປິດປີ້ຈອດລົດ ແລະ ບັນທຶກການຊຳລະເງິນຄ່າປັບ
    const updated = await this.prisma.$transaction(async (tx) => {
      const caseRecord = await tx.lostTicketCase.update({
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

      // ຖ້າຫາກແກ້ໄຂສຳເລັດ (RESOLVED) ຈະທຳການປິດປີ້ຈອດລົດ ແລະ ບັນທຶກການຊຳລະເງິນຄ່າປັບໃໝ
      if (dto.resolution === 'RESOLVED') {
        const penalty = dto.penaltyAmount || 0;
        await tx.parkingTicket.update({
          where: { id: lostCase.ticketId },
          data: {
            status: TicketStatus.COMPLETED,
            checkOutAt: new Date(),
            totalAmount: penalty,
            paymentStatus: penalty > 0 ? 'PAID' : 'WAIVED',
          },
        });

        if (penalty > 0) {
          await tx.payment.create({
            data: {
              ticketId: lostCase.ticketId,
              amount: penalty,
              paymentMethod: 'CASH',
              receivedById: resolvedById,
            },
          });
        }
      }

      return caseRecord;
    });

    this.logger.log(`Lost ticket case ${id} resolved: ${dto.resolution}`);
    return updated;
  }
}
