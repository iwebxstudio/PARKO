// ============================================
// ລະບົບ PARKO — Printer Service (ການບໍລິການຈັດການຂໍ້ມູນການພິມໃບບິນ)
// ສ້າງໂຄງສ້າງຂໍ້ມູນໃບບິນຮັບເງິນ ແລະ ປີ້ຈອດລົດສຳລັບເຄື່ອງພິມຄວາມຮ້ອນ (Thermal Printer)
// ໂດຍການສັ່ງພິມຕົວຈິງຈະຖືກປະມວນຜົນຢູ່ຝັ່ງ Frontend ຜ່ານ Web Bluetooth, WebUSB ຫຼື Print Agent
// ============================================
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

export interface ReceiptData {
  parkingName: string;
  ticketNumber: string;
  vehicleType: string;
  vehicleIcon: string;
  plateNumber: string;
  checkInAt: string;
  checkOutAt: string | null;
  duration: string | null;
  totalAmount: number | null;
  paymentStatus: string;
  paymentMethod: string | null;
  qrCodeData: string;
  currency: string;
  staffName: string;
  printedAt: string;
}

@Injectable()
export class PrinterService {
  constructor(private prisma: PrismaService) {}

  /**
   * ສ້າງຂໍ້ມູນໃບບິນລະອຽດສຳລັບປີ້ລົດແຕ່ລະໃບ
   * ລະບົບ Frontend ຈະນຳເອົາຂໍ້ມູນຊຸດນີ້ໄປຈັດຮູບແບບ ແລະ ສັ່ງພິມຜ່ານເຄື່ອງພິມໃບບິນຄວາມຮ້ອນ
   */
  async generateReceiptData(ticketId: string): Promise<ReceiptData> {
    const ticket = await this.prisma.parkingTicket.findUnique({
      where: { id: ticketId },
      include: {
        vehicleType: true,
        checkedInBy: { select: { displayName: true } },
        checkedOutBy: { select: { displayName: true } },
      },
    });

    if (!ticket) throw new Error('Ticket not found');

    // ດຶງຊື່ສະຖານທີ່ຈອດລົດຈາກການຕັ້ງຄ່າລະບົບ (System Settings) ມາສະແດງເທິງຫົວໃບບິນ
    const parkingNameSetting = await this.prisma.systemSetting.findUnique({
      where: { key: 'parking_name' },
    });

    const parkingName =
      (parkingNameSetting?.value as any)?.name || 'PARKO Parking';

    // ຄິດໄລ່ໄລຍະເວລາການຈອດລົດ (ຊົ່ວໂມງ ແລະ ນາທີ) ຖ້າຫາກລົດໄດ້ມີການ Check-out ແລ້ວ
    let duration: string | null = null;
    if (ticket.checkOutAt) {
      const diffMs = ticket.checkOutAt.getTime() - ticket.checkInAt.getTime();
      const hours = Math.floor(diffMs / (1000 * 60 * 60));
      const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
      duration = `${hours}h ${minutes}m`;
    }

    return {
      parkingName,
      ticketNumber: ticket.ticketNumber,
      vehicleType: ticket.vehicleType.label,
      vehicleIcon: ticket.vehicleType.icon,
      plateNumber:
        [ticket.plateProvince, ticket.plateLetters, ticket.plateNumber]
          .filter(Boolean)
          .join(' ') || 'N/A',
      checkInAt: ticket.checkInAt.toISOString(),
      checkOutAt: ticket.checkOutAt?.toISOString() || null,
      duration,
      totalAmount: ticket.totalAmount ? Number(ticket.totalAmount) : null,
      paymentStatus: ticket.paymentStatus,
      paymentMethod: null,
      qrCodeData: ticket.qrCodeData,
      currency: 'LAK',
      staffName:
        ticket.checkedOutBy?.displayName ||
        ticket.checkedInBy?.displayName ||
        'System',
      printedAt: new Date().toISOString(),
    };
  }
}
