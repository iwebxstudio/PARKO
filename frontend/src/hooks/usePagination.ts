// ============================================
// ລະບົບ PARKO — usePagination Hook (ເຄື່ອງມືຈັດການການແບ່ງໜ້າ)
// ຄວບຄຸມສະຖານະໜ້າປັດຈຸບັນ, ຄິດໄລ່ຈຳນວນໜ້າທັງໝົດ, ແລະ ປ້ອງກັນການເລື່ອນໜ້າກາຍຂອບເຂດ
// ============================================
import { useState, useMemo, useCallback } from 'react';

export interface UsePaginationOptions {
  initialPage?: number;
  initialLimit?: number;
  total?: number;
}

export function usePagination({
  initialPage = 1,
  initialLimit = 20,
  total = 0,
}: UsePaginationOptions = {}) {
  const [page, setPage] = useState<number>(initialPage);
  const [limit, setLimit] = useState<number>(initialLimit);

  const totalPages = useMemo(() => {
    return Math.max(1, Math.ceil(total / limit));
  }, [total, limit]);

  const hasNextPage = page < totalPages;
  const hasPrevPage = page > 1;

  const nextPage = useCallback(() => {
    setPage((curr) => Math.min(curr + 1, totalPages));
  }, [totalPages]);

  const prevPage = useCallback(() => {
    setPage((curr) => Math.max(curr - 1, 1));
  }, []);

  const goToPage = useCallback((newPage: number) => {
    setPage(Math.max(1, Math.min(newPage, totalPages)));
  }, [totalPages]);

  const reset = useCallback(() => {
    setPage(1);
  }, []);

  return {
    page,
    limit,
    totalPages,
    hasNextPage,
    hasPrevPage,
    setPage,
    setLimit,
    nextPage,
    prevPage,
    goToPage,
    reset,
  };
}
