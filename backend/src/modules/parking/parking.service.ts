// ============================================
// ລະບົບ PARKO — Parking Service (ການບໍລິການຄຸ້ມຄອງບ່ອນຈອດລົດ)
// ໂຄງສ້າງຫຼັກຂອງລະບົບທຸລະກິດ: ການບັນທຶກລົດເຂົ້າ (Check-in), ລົດອອກ (Check-out), ແລະ ການຄິດໄລ່ຄ່າທຳນຽມ
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
   * ສ້າງເລກປີ້ລົດ 5 ຫຼັກແບບສຸ່ມທີ່ບໍ່ຊ້ຳກັນ (Unique 5-digit ticket number)
   * ໂດຍລະບົບຈະກວດສອບກັບຖານຂໍ້ມູນຈົນກວ່າຈະໝັ້ນໃຈວ່າເລກປີ້ຍັງບໍ່ເຄີຍມີມາກ່ອນ
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
   * ບັນທຶກລົດເຂົ້າບ່ອນຈອດ (Check-in) ພ້ອມກັບການຄິດໄລ່ ແລະ ເກັບເງິນລ່ວງໜ້າ (Auto-charge Prepaid)
   */
  async checkIn(dto: CheckInDto, userId: string) {
    // ກວດສອບຄວາມຖືກຕ້ອງວ່າປະເພດພາຫະນະ (Vehicle Type) ທີ່ລະບຸມານັ້ນ ມີຢູ່ໃນຖານຂໍ້ມູນແທ້ຫຼືບໍ່
    const vehicleType = await this.prisma.vehicleType.findUnique({
      where: { id: dto.vehicleTypeId },
    });
    if (!vehicleType) {
      throw new BadRequestException('Invalid vehicle type');
    }

    // ── ປ້ອງກັນການນຳລົດເຂົ້າຊ້ຳຊ້ອນ: ໃຊ້ລະບົບລັອກຄ່າປະສົມ (Composite Unique: ປະເພດລົດ + ແຂວງ + ໝວດອັກສອນ + ເລກທະບຽນ) ──
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

      // ສ້າງຂໍ້ຄວາມປ້າຍທະບຽນລົດແບບລວມ (Combined Plate) ເພື່ອໃຊ້ໃນການຄົ້ນຫາສະມາຊິກ ແລະ ສະແດງຜົນ
      const combinedPlate = [plateLet, plateNum].filter(Boolean).join(' ');

      // ── ກວດສອບສະຖານະສະມາຊິກ (Membership Validation) ──
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

      // ── ຄິດໄລ່ຄ່າທຳນຽມອັດຕະໂນມັດ: ຄົ້ນຫາກົດລະບຽບລາຄາ (Pricing Rule) ຕາມປະເພດການຈອດ ──
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
              // ກໍລະນີສຳຮອງສຳລັບການຈອດລາຍຊົ່ວໂມງແບບດັ້ງເດີມ — ບໍ່ມີການເກັບເງິນລ່ວງໜ້າ
              prepaidAmount = dto.prepaidAmount || null;
          }
        }

        // ນຳໃຊ້ຍອດເງິນຊຳລະລ່ວງໜ້າທີ່ກຳນົດມາຈາກ DTO ຖ້າມີການລະບຸເຈາະຈົງ (Override ຄ່າອັດຕະໂນມັດ)
        if (dto.prepaidAmount && dto.prepaidAmount > 0) {
          prepaidAmount = Number(dto.prepaidAmount);
        }

        isPrepaid = prepaidAmount !== null && prepaidAmount > 0;
      }

      let ticket: any;
      let ticketNumber = '';

      for (let attempt = 0; attempt < 5; attempt++) {
        ticketNumber = await this.generateTicketNumber();

        // ສ້າງຂໍ້ມູນ QR Code ທີ່ບັນຈຸລາຍລະອຽດທີ່ຈຳເປັນທັງໝົດຂອງປີ້ລົດ ເພື່ອໃຊ້ສະແກນຕອນອອກ
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

            // ບັນທຶກລາຍການຊຳລະເງິນສຳລັບປີ້ຈ່າຍລ່ວງໜ້າພາຍໃນ Transaction ດຽວກັນແບບ Atomic ເພື່ອຄວາມຖືກຕ້ອງຂອງຂໍ້ມູນ
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

          break; // ດຳເນີນການສ້າງປີ້ ແລະ ບັນທຶກຂໍ້ມູນສຳເລັດຮຽບຮ້ອຍແລ້ວ ອອກຈາກ Loop
        } catch (err: any) {
          if (
            err.code === 'P2002' &&
            err.meta?.target?.includes('ticket_number') &&
            attempt < 4
          ) {
            continue; // ຫາກເລກປີ້ຊ້ຳກັນ ໃຫ້ສຸ່ມເລກປີ້ໃໝ່ແລ້ວລອງສ້າງໃໝ່ອີກຄັ້ງ
          }
          throw err;
        }
      }

      this.logger.log(`Check-in: ${ticketNumber} | Type: ${vehicleType.name}`);

      // ສົ່ງສັນຍານແຈ້ງເຕືອນແບບ Real-time ຜ່ານ WebSocket ໄປຍັງທຸກໜ້າຈໍທີ່ກຳລັງເປີດຢູ່
      this.parkingGateway.broadcastUpdate({
        type: 'CHECK_IN',
        ticket: {
          ticketNumber: ticket.ticketNumber,
          vehicleType: ticket.vehicleType.name,
          plateNumber: ticket.plateNumber,
          checkInAt: ticket.checkInAt,
        },
      });

      // ກວດສອບຈຳນວນລົດທຽບກັບຂີດຄວາມສາມາດຮອງຮັບສູງສຸດຂອງລານຈອດ (Soft Limit Capacity Check)
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
   * ຄົ້ນຫາປີ້ລົດດ້ວຍເລກປີ້, ປ້າຍທະບຽນ, ຫຼື ໝາຍເຫດ ເພື່ອກຽມດຳເນີນການເອົາລົດອອກ (Check-out)
   */
  async findTicket(identifier: string) {
    const q = identifier.trim();
    if (!q) {
      throw new BadRequestException('ກະລຸນາໃສ່ຂໍ້ມູນຄົ້ນຫາ');
    }

    // ສ້າງເງື່ອນໄຂການຄົ້ນຫາຫຼາຍຮູບແບບເພື່ອຄວາມຖືກຕ້ອງ ແລະ ວ່ອງໄວທີ່ສຸດ
    const orConditions: any[] = [
      // 1. ກວດສອບກົງກັບເລກປີ້ລົດແບບຊັດເຈນ (Exact ticket number match)
      { ticketNumber: q },
      // 2. ຄົ້ນຫາເລກທະບຽນລົດທີ່ກົງກັນບາງສ່ວນ (ເຊັ່ນ: "1234")
      { plateNumber: { contains: q, mode: 'insensitive' } },
      // 3. ຄົ້ນຫາໝວດອັກສອນປ້າຍທະບຽນ (ເຊັ່ນ: "ກຂ")
      { plateLetters: { contains: q, mode: 'insensitive' } },
      // 4. ຄົ້ນຫາຊື່ແຂວງຂອງປ້າຍທະບຽນ (ເຊັ່ນ: "ນະຄອນຫລວງ")
      { plateProvince: { contains: q, mode: 'insensitive' } },
      // 5. ຄົ້ນຫາຈາກໝາຍເຫດເພີ່ມເຕີມ (ເຊັ່ນ: "ລົດສີແດງ", ເບີໂທລະສັບ)
      { notes: { contains: q, mode: 'insensitive' } },
      // 6. ຄົ້ນຫາກົງກັບລະຫັດສະມາຊິກ (ເຊັ່ນ: "M-0001", "0001")
      { membership: { memberCode: { contains: q, mode: 'insensitive' } } },
      // 7. ຄົ້ນຫາກົງກັບທະບຽນລົດຂອງສະມາຊິກ
      { membership: { plateNumber: { contains: q, mode: 'insensitive' } } },
    ];

    // ຖ້າຫາກຂໍ້ຄວາມຄົ້ນຫາມີຍະຫວ່າງ ໃຫ້ແຍກຄົ້ນຫາທັງໝວດອັກສອນ ແລະ ເລກທະບຽນພ້ອມກັນ (ເຊັ່ນ: "ກຂ 1234")
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
      // ກວດສອບວ່າມີປີ້ລົດນີ້ໃນລະບົບຫຼືບໍ່ ແຕ່ໄດ້ດຳເນີນການອອກ (Completed) ໄປກ່ອນໜ້ານີ້ແລ້ວ
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
   * ດຳເນີນການເອົາລົດອອກຈາກບ່ອນຈອດ (Check-out) ແລະ ບັນທຶກການຊຳລະເງິນ
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

    // ປະຕິບັດການຜ່ານ Transaction ແບບ Atomic: ກວດສອບສະຖານະ ACTIVE ຄືນໃໝ່ ແລະ ອັບເດດປີ້ລົດພ້ອມບັນທຶກການຊຳລະເງິນ
    const updatedTicket = await this.prisma.$transaction(async (tx) => {
      // ສອບຖາມຂໍ້ມູນປີ້ລົດຄືນໃໝ່ພາຍໃນ Transaction ເພື່ອປ້ອງກັນບັນຫາການກົດອອກຊ້ຳກັນໃນເວລາດຽວກັນ (Race Condition)
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

      // ບັນທຶກປະຫວັດການຊຳລະເງິນພາຍໃນ Transaction ດຽວກັນແບບ Atomic
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

    // ສົ່ງສັນຍານແຈ້ງເຕືອນແບບ Real-time ໄປຍັງລະບົບຜ່ານ WebSocket ເພື່ອອັບເດດໜ້າຈໍ
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
   * ຄິດໄລ່ຄ່າທຳນຽມບ່ອນຈອດລົດຕາມກົດລະບຽບລາຄາ ແລະ ໄລຍະເວລາຈອດຕົວຈິງ
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

    // ກວດສອບວ່າເປັນລົດສະມາຊິກ ຫຼື ປີ້ປະເພດຈ່າຍລ່ວງໜ້າຫຼືບໍ່ (CUSTOM, WEEKLY, MONTHLY, ຫຼື ປີ້ທີ່ມີ membershipId)
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
          // ຈອດກາຍກຳນົດເວລາໝົດອາຍຸ! ຄິດໄລ່ຈຳນວນມື້ທີ່ກາຍກຳນົດເພື່ອປັບໃໝ ຫຼື ເກັບຄ່າທຳນຽມເພີ່ມ
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
      return 0; // ຍັງຢູ່ໃນກຳນົດເວລາທີ່ໄດ້ຈ່າຍໄວ້ຢ່າງຖືກຕ້ອງ ບໍ່ມີຄ່າທຳນຽມເພີ່ມເຕີມ
    }

    // ຖ້າຫາກເປັນປີ້ທີ່ຈ່າຍລ່ວງໜ້າແລ້ວ (ລາຍອາທິດ/ລາຍເດືອນ) ໃຫ້ສົ່ງຄືນຍອດເງິນທີ່ໄດ້ຈ່າຍໄວ້
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

    // ໄລຍະເວລາຍົກເວັ້ນຄ່າທຳນຽມ (ຈອດຟຣີຕາມກຳນົດເວລາທີ່ຕັ້ງໄວ້)
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
   * ຄິດໄລ່ໄລຍະເວລາການຈອດລົດ ແລະ ແປງເປັນຮູບແບບທີ່ອ່ານເຂົ້າໃຈງ່າຍ (ຊົ່ວໂມງ ແລະ ນາທີ)
   */
  private calculateDuration(checkIn: Date, checkOut: Date) {
    const diffMs = checkOut.getTime() - new Date(checkIn).getTime();
    const hours = Math.floor(diffMs / (1000 * 60 * 60));
    const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    return { hours, minutes, formatted: `${hours}h ${minutes}m` };
  }

  /**
   * ດຶງຂໍ້ມູນສະຖິຕິການຈອດລົດລວມສຳລັບສະແດງຜົນເທິງ Dashboard
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
      // ຈຳນວນລົດທີ່ກຳລັງຈອດຢູ່ໃນປັດຈຸບັນ
      this.prisma.parkingTicket.count({
        where: { status: TicketStatus.ACTIVE },
      }),
      // ຈຳນວນລົດທີ່ເຂົ້າມາຈອດໃນມື້ນີ້
      this.prisma.parkingTicket.count({
        where: { checkInAt: { gte: today } },
      }),
      // ຈຳນວນລົດທີ່ອອກຈາກບ່ອນຈອດໃນມື້ນີ້
      this.prisma.parkingTicket.count({
        where: {
          checkOutAt: { gte: today },
          status: TicketStatus.COMPLETED,
        },
      }),
      // ລາຍຮັບລວມທັງໝົດທີ່ໄດ້ຮັບໃນມື້ນີ້
      this.prisma.payment.aggregate({
        where: { paidAt: { gte: today } },
        _sum: { amount: true },
      }),
      // ສະຖິຕິຈຳນວນລົດທີ່ກຳລັງຈອດ ໂດຍແຍກຕາມແຕ່ລະປະເພດພາຫະນະ
      this.prisma.parkingTicket.groupBy({
        by: ['vehicleTypeId'],
        where: { status: TicketStatus.ACTIVE },
        _count: true,
      }),
    ]);

    // ດຶງຊື່ ແລະ ໄອຄອນຂອງປະເພດພາຫະນະທັງໝົດມາສ້າງເປັນຕາຕະລາງອ້າງອີງ (Map)
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
   * ດຶງລາຍການການເຄື່ອນໄຫວຫຼ້າສຸດຂອງບ່ອນຈອດລົດ
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
   * ດຶງລາຍການປີ້ລົດທັງໝົດທີ່ກຳລັງຈອດຢູ່ (Active Tickets) ພ້ອມລະບົບແບ່ງໜ້າ (Pagination)
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
   * ດຶງປະຫວັດປີ້ລົດທີ່ດຳເນີນການສຳເລັດແລ້ວ (ອອກຈາກບ່ອນຈອດແລ້ວ) ພ້ອມລະບົບຄົ້ນຫາ ແລະ ແບ່ງໜ້າ
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
   * ລຶບຂໍ້ມູນປີ້ລົດ ແລະ ປະຫວັດການເງິນທີ່ກ່ຽວຂ້ອງອອກຈາກລະບົບຢ່າງຖາວອນ (ສະເພາະຜູ້ດູແລລະບົບ Admin ເທົ່ານັ້ນ)
   */
  async deleteTicket(id: string) {
    const ticket = await this.prisma.parkingTicket.findUnique({
      where: { id },
    });

    if (!ticket) {
      throw new NotFoundException('Ticket not found');
    }

    // ຂັ້ນຕອນທີ 1: ລຶບລາຍການຊຳລະເງິນທັງໝົດທີ່ກ່ຽວຂ້ອງກັບປີ້ລົດນີ້ກ່ອນ ເພື່ອບໍ່ໃຫ້ຕິດ Foreign Key Constraint
    await this.prisma.payment.deleteMany({
      where: { ticketId: id },
    });

    // ຂັ້ນຕອນທີ 2: ລຶບຂໍ້ມູນປີ້ລົດອອກຈາກຖານຂໍ້ມູນ
    await this.prisma.parkingTicket.delete({
      where: { id },
    });

    this.logger.log(`Ticket deleted by Admin: ${ticket.ticketNumber}`);

    // ສົ່ງສັນຍານແຈ້ງເຕືອນໃຫ້ທຸກໜ້າຈໍ Dashboard ອັບເດດຂໍ້ມູນສະຖິຕິໃໝ່ທັນທີ
    this.parkingGateway.broadcastUpdate({ type: 'stats_refresh' });

    return { success: true, message: 'Ticket deleted successfully' };
  }
}
