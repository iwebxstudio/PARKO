// ============================================
// PARKO — Common Types
// ============================================

export interface ApiResponse<T = any> {
  success: boolean;
  data: T;
  timestamp: string;
}

export interface PaginatedResponse<T = any> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
