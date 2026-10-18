// ============================================
// ລະບົບ PARKO — useDebounce Hook (ເຄື່ອງມືໜ່ວງເວລາການປ່ຽນແປງຄ່າ)
// ຊ່ວຍຫຼຸດຜ່ອນການສົ່ງຄຳຂໍ Request ຫຼື ການປະມວນຜົນຊ້ຳຊ້ອນ ເວລາພິມຄົ້ນຫາ
// ============================================
import { useState, useEffect } from 'react';

export function useDebounce<T>(value: T, delay: number = 400): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}
