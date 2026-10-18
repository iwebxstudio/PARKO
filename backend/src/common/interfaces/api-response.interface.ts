// ==============================================================================
// PARKO — ອິນເຕີເຟດຂໍ້ມູນຕອບກັບມາດຕະຖານຂອງ API (Standard API Response Interfaces)
// ກຳນົດໂຄງສ້າງ Generic Response Type ແລະ Metadata ສຳລັບການແບ່ງໜ້າ (Pagination)
// ==============================================================================

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
