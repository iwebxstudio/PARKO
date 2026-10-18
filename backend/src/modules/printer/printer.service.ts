// ============================================
// PARKO — Printer Service
// Generate ESC/POS receipt data for thermal printer
// The actual printing happens on the frontend via
// Web Bluetooth or WebUSB API
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
   * Generate receipt data for a ticket
   * The frontend uses this data to format and send to thermal printer
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

    // Get parking name from settings
    const parkingNameSetting = await this.prisma.systemSetting.findUnique({
      where: { key: 'parking_name' },
    });

    const parkingName =
      (parkingNameSetting?.value as any)?.name || 'PARKO Parking';

    // Calculate duration if checked out
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
