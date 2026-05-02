// ============================================
// PARKO — TypeScript Types
// ============================================

export interface User {
  id: string;
  username: string;
  displayName: string;
  email: string;
  role: 'ADMIN' | 'STAFF';
  isActive: boolean;
  createdAt: string;
}

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
  duration?: { hours: number; minutes: number; formatted: string };
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

export interface DashboardStats {
  activeVehicles: number;
  todayCheckIns: number;
  todayCheckOuts: number;
  todayRevenue: number;
  vehicleBreakdown: Array<{
    vehicleType: string;
    icon: string;
    count: number;
  }>;
  currency: string;
}

export interface AuditLog {
  id: string;
  userId: string;
  user: { displayName: string; username: string } | null;
  action: string;
  entityType: string;
  entityId: string | null;
  oldData: any;
  newData: any;
  ipAddress: string;
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

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  timestamp: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
