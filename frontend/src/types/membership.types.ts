// ============================================
// ລະບົບ PARKO — Membership Types (ປະເພດຂໍ້ມູນລະບົບສະມາຊິກ)
// ກຳນົດ Interface ສຳລັບຂໍ້ມູນສະມາຊິກ, ອາຍຸການໃຊ້ງານ ແລະ ປະເພດການສະໝັກ
// ============================================
import type { VehicleType } from './parking.types';

export interface Membership {
  id: string;
  memberCode: string;
  plateNumber: string;
  plateProvince: string | null;
  vehicleTypeId: number;
  vehicleType?: VehicleType;
  memberType: 'WEEKLY' | 'MONTHLY' | 'CUSTOM';
  startDate: string;
  endDate: string;
  paidAmount: number;
  paymentMethod: string;
  status: 'ACTIVE' | 'EXPIRED' | 'CANCELLED';
  notes: string | null;
  createdAt: string;
}
