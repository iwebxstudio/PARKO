// ============================================
// PARKO — Reports & Audit Types
// ============================================

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
