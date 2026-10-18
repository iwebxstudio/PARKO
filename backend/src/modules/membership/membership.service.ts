// ============================================
// PARKO — Membership Service
// ============================================
import {
  Injectable,
  NotFoundException,
  Logger,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateMembershipDto, UpdateMembershipDto } from './dto';
import { MemberStatus } from '@prisma/client';

@Injectable()
export class MembershipService {
  private readonly logger = new Logger(MembershipService.name);
  private processingPlates = new Set<string>();

  constructor(private prisma: PrismaService) {}

  private async generateMemberCode(): Promise<string> {
    const allMembers = await this.prisma.membership.findMany({
      select: { memberCode: true },
    });
    let maxNum = 0;
    for (const m of allMembers) {
      if (m.memberCode) {
        const match = m.memberCode.match(/(\d+)/);
        if (match) {
          const num = parseInt(match[1], 10);
          if (num > maxNum) maxNum = num;
        }
      }
    }
    let nextNum = maxNum + 1;
    let memberCode = `M-${nextNum.toString().padStart(5, '0')}`;
    while (await this.prisma.membership.findUnique({ where: { memberCode } })) {
      nextNum++;
      memberCode = `M-${nextNum.toString().padStart(5, '0')}`;
    }
    return memberCode;
  }

  private async generateTicketNumber(): Promise<string> {
    let ticketNumber = '';
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

  async create(dto: CreateMembershipDto, userId: string) {
    // Validate vehicle type
    const vehicleType = await this.prisma.vehicleType.findUnique({
      where: { id: dto.vehicleTypeId },
    });

    if (!vehicleType) {
      throw new BadRequestException('Invalid vehicle type');
    }

    // ── Composite Unique check (vehicleType + province + letters + plateNumber) ──
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
            status: 'ACTIVE',
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

      // Build combined plate for membership storage (backward compat)
      const combinedPlate = [plateLet, plateNum].filter(Boolean).join(' ');

      let parkingType: 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'CUSTOM' = 'CUSTOM';
      if (dto.memberType === 'WEEKLY') {
        parkingType = 'WEEKLY';
      } else if (dto.memberType === 'MONTHLY') {
        parkingType = 'MONTHLY';
      } else if (dto.notes?.includes('(ຝາກລາຍວັນ)')) {
        parkingType = 'DAILY';
      } else {
        parkingType = 'CUSTOM';
      }

      let result: any;
      for (let attempt = 0; attempt < 5; attempt++) {
        const memberCode = await this.generateMemberCode();
        const ticketNumber = await this.generateTicketNumber();
        const qrCodeData = JSON.stringify({
          ticketNumber,
          vehicleType: vehicleType.name,
          plateNumber: combinedPlate || null,
          plateProvince: plateProv,
          checkInAt: new Date().toISOString(),
          system: 'PARKO',
        });

        try {
          result = await this.prisma.$transaction(async (tx) => {
            const membership = await tx.membership.create({
              data: {
                memberCode,
                plateNumber: combinedPlate || dto.plateNumber || '',
                plateProvince: plateProv,
                vehicleTypeId: dto.vehicleTypeId,
                memberType: dto.memberType,
                startDate: new Date(dto.startDate),
                endDate: new Date(dto.endDate),
                paidAmount: dto.paidAmount,
                paymentMethod: dto.paymentMethod || 'CASH',
                notes: dto.notes,
                createdById: userId,
                status: MemberStatus.ACTIVE,
              },
              include: {
                vehicleType: true,
                createdBy: {
                  select: { id: true, displayName: true },
                },
              },
            });

            const ticket = await tx.parkingTicket.create({
              data: {
                ticketNumber,
                vehicleTypeId: dto.vehicleTypeId,
                plateNumber: plateNum,
                plateLetters: plateLet,
                plateProvince: plateProv,
                qrCodeData,
                parkingType,
                customEnd: new Date(dto.endDate),
                prepaidAmount: dto.paidAmount || 0,
                totalAmount: dto.paidAmount || 0,
                checkedInById: userId,
                membershipId: membership.id,
                paymentStatus: 'PAID',
                notes: dto.notes || null,
              },
              include: {
                vehicleType: true,
                checkedInBy: {
                  select: { id: true, displayName: true },
                },
              },
            });

            // Create payment record for prepaid amount in the same transaction
            if (dto.paidAmount && Number(dto.paidAmount) > 0) {
              await tx.payment.create({
                data: {
                  ticketId: ticket.id,
                  amount: dto.paidAmount,
                  paymentMethod: dto.paymentMethod || 'CASH',
                  receivedById: userId,
                },
              });
            }

            return { membership, ticket };
          });

          this.logger.log(
            `Created membership ${memberCode} for plate ${combinedPlate} + auto check-in (Ticket: ${ticketNumber})`,
          );
          break;
        } catch (err: any) {
          if (err.code === 'P2002' && attempt < 4) {
            continue;
          }
          throw err;
        }
      }

      return result;
    } finally {
      this.processingPlates.delete(lockKey);
    }
  }

  async findAll() {
    return this.prisma.membership.findMany({
      include: {
        vehicleType: {
          include: {
            pricingRules: true,
          },
        },
        createdBy: {
          select: { displayName: true },
        },
        tickets: {
          where: { status: 'ACTIVE' },
          select: {
            id: true,
            ticketNumber: true,
            checkInAt: true,
            customEnd: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const membership = await this.prisma.membership.findUnique({
      where: { id },
      include: {
        vehicleType: true,
        createdBy: { select: { displayName: true } },
        tickets: {
          take: 10,
          orderBy: { checkInAt: 'desc' },
          select: {
            ticketNumber: true,
            checkInAt: true,
            checkOutAt: true,
            status: true,
          },
        },
      },
    });

    if (!membership) {
      throw new NotFoundException('Membership not found');
    }

    return membership;
  }

  async update(id: string, dto: UpdateMembershipDto) {
    const existing = await this.prisma.membership.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException('Membership not found');
    }

    return this.prisma.membership.update({
      where: { id },
      data: {
        status: dto.status,
        endDate: dto.endDate ? new Date(dto.endDate) : undefined,
        notes: dto.notes,
        plateNumber: dto.plateNumber,
        plateProvince: dto.plateProvince,
        vehicleTypeId: dto.vehicleTypeId,
      },
      include: { vehicleType: true },
    });
  }

  async cancel(id: string) {
    const existing = await this.prisma.membership.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException('Membership not found');
    }

    return this.prisma.membership.update({
      where: { id },
      data: { status: MemberStatus.CANCELLED },
    });
  }

  async remove(id: string) {
    const existing = await this.prisma.membership.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException('Membership not found');
    }

    return this.prisma.membership.delete({
      where: { id },
    });
  }

  /**
   * Check if a plate number has an active membership.
   * Auto-expires memberships if their end date has passed.
   */
  async checkByPlate(plateNumber: string) {
    if (!plateNumber || plateNumber.trim() === '') {
      return { isMember: false };
    }

    const memberships = await this.prisma.membership.findMany({
      where: {
        plateNumber: plateNumber,
        status: MemberStatus.ACTIVE,
      },
      orderBy: { endDate: 'desc' },
      include: {
        vehicleType: true,
      },
    });

    if (memberships.length === 0) {
      return { isMember: false };
    }

    const now = new Date();

    // Find the first active one that hasn't expired
    for (const membership of memberships) {
      if (membership.endDate < now) {
        // Auto-expire
        await this.prisma.membership.update({
          where: { id: membership.id },
          data: { status: MemberStatus.EXPIRED },
        });
        continue;
      }

      // Found valid active membership
      return {
        isMember: true,
        membership,
      };
    }

    return { isMember: false };
  }
}
