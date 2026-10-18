// ============================================
// ລະບົບ PARKO — Common Types (ປະເພດຂໍ້ມູນທົ່ວໄປທີ່ໃຊ້ຮ່ວມກັນ)
// ກຳນົດ Interface ມາດຕະຖານສຳລັບ ApiResponse ແລະ PaginatedResponse
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
