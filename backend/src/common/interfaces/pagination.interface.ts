// ==============================================================================
// PARKO — ອິນເຕີເຟດສຳລັບການແບ່ງໜ້າຂໍ້ມູນ (Pagination Interfaces)
// ກຳນົດໂຄງສ້າງ Query Parameters ແລະ ຮູບແບບຜົນລັບຂໍ້ມູນທີ່ແບ່ງໜ້າແລ້ວ (Paginated Result)
// ==============================================================================

export interface PaginationQueryDto {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  search?: string;
}

export interface PaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
