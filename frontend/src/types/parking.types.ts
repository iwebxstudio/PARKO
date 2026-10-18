// ============================================
// ລະບົບ PARKO — Parking Types (ປະເພດຂໍ້ມູນລະບົບບ່ອນຈອດລົດ)
// ກຳນົດ Interface ສຳລັບປີ້ລົດ, ປະເພດພາຫະນະ, ກົດລະບຽບລາຄາ ແລະ ກໍລະນີປີ້ເສຍ
// ============================================
import type { Membership } from './membership.types';

export interface VehicleType {
  id: number;
  name: string;
  label: string;
  icon: string;
  description: string;
  isActive: boolean;
  sortOrder: number;
}

export interface ParkingTicket {
  id: string;
  ticketNumber: string;
  vehicleTypeId: number;
  vehicleType: VehicleType;
  plateNumber: string | null;
  plateLetters: string | null;
  plateProvince: string | null;
  qrCodeData: string;
  status: 'ACTIVE' | 'COMPLETED' | 'LOST';
  parkingType: 'HOURLY' | 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'CUSTOM';
  checkInAt: string;
  checkOutAt: string | null;
  totalAmount: number | null;
  paymentStatus: 'UNPAID' | 'PAID' | 'WAIVED';
  checkedInBy: { id: string; displayName: string };
  checkedOutBy?: { id: string; displayName: string } | null;
  notes: string | null;
  calculatedCost?: number;
  membershipId?: string | null;
  membership?: Membership | null;
  customStart?: string | null;
  customEnd?: string | null;
}

export interface PricingRule {
  id: string;
  vehicleTypeId: number;
  vehicleType: VehicleType;
  pricingType: string;
  basePrice: number;
  hourlyRate: number;
  dailyRate: number;
  weeklyRate: number;
  monthlyRate: number;
  freeMinutes: number;
  isActive: boolean;
}

export interface LostTicketCase {
  id: string;
  ticketId: string;
  ticket: ParkingTicket;
  staffId: string;
  staff: { displayName: string };
  vehiclePhotoUrl: string | null;
  driverPhotoUrl: string | null;
  idCardPhotoUrl: string | null;
  notes: string;
  resolution: 'PENDING' | 'RESOLVED' | 'ESCALATED';
  penaltyAmount: number;
  resolvedAt: string | null;
  resolvedBy: { displayName: string } | null;
  createdAt: string;
}

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
  qrCodeData: string;
  currency: string;
  staffName: string;
  printedAt: string;
}
