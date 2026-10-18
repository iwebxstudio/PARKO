// ============================================
// PARKO — Parking Constants
// ============================================

export const VEHICLE_TYPES = {
  CAR: 'CAR',
  MOTORCYCLE: 'MOTORCYCLE',
  EV: 'EV',
  TRUCK: 'TRUCK',
} as const;

export type VehicleType = (typeof VEHICLE_TYPES)[keyof typeof VEHICLE_TYPES];

export const VEHICLE_TYPE_LABELS: Record<VehicleType, string> = {
  CAR: 'รถยนต์ (Car)',
  MOTORCYCLE: 'รถจักรยานยนต์ (Motorcycle)',
  EV: 'รถยนต์ไฟฟ้า (EV)',
  TRUCK: 'รถบรรทุก / อื่นๆ (Truck)',
};

export const TICKET_STATUS = {
  ACTIVE: 'ACTIVE',
  COMPLETED: 'COMPLETED',
  LOST: 'LOST',
  CANCELLED: 'CANCELLED',
} as const;

export type TicketStatus = (typeof TICKET_STATUS)[keyof typeof TICKET_STATUS];

export const PAYMENT_METHODS = {
  CASH: 'CASH',
  QR_TRANSFER: 'QR_TRANSFER',
  MEMBER: 'MEMBER',
  EXEMPTED: 'EXEMPTED',
} as const;

export type PaymentMethod = (typeof PAYMENT_METHODS)[keyof typeof PAYMENT_METHODS];
