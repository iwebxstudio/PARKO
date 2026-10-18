// ============================================
// PARKO — Standard API Response Interfaces
// ============================================

export interface ApiResponse<T = any> {
  success: boolean;
  statusCode?: number;
  message?: string;
  data?: T;
  meta?: ApiResponseMeta;
  timestamp?: string;
}

export interface ApiResponseMeta {
  page?: number;
  limit?: number;
  total?: number;
  totalPages?: number;
  hasNextPage?: boolean;
  hasPrevPage?: boolean;
}
