// ============================================
// ລະບົບ PARKO — Formatting Utility Functions (ຟັງຊັນຊ່ວຍຈັດຮູບແບບຂໍ້ມູນ)
// ຈັດຮູບແບບສະກຸນເງິນ, ໄລຍະເວລາ, ວັນທີ ແລະ ເວລາ ໃຫ້ຖືກຕ້ອງ ແລະ ອ່ານງ່າຍ
// ============================================

/**
 * ຈັດຮູບແບບຕົວເລກຈຳນວນເງິນໃຫ້ມີເຄື່ອງໝາຍຈຸດ (Commas) ພ້ອມກັບສະກຸນເງິນ (ເຊັ່ນ: "10,000 ₭")
 */
export function formatCurrency(amount: number | string | null | undefined, currency: string = '₭'): string {
  if (amount === null || amount === undefined || isNaN(Number(amount))) {
    return `0 ${currency}`;
  }
  const formatted = Number(amount).toLocaleString('en-US');
  return `${formatted} ${currency}`;
}

/**
 * ຈັດຮູບແບບໄລຍະເວລານາທີໃຫ້ເປັນຂໍ້ຄວາມທີ່ອ່ານງ່າຍ (ເຊັ່ນ: "2 ຊົ່ວໂມງ 15 ນາທີ")
 */
export function formatDuration(minutes: number | null | undefined): string {
  if (!minutes || minutes <= 0) return '0 นาที';
  const hrs = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hrs > 0 && mins > 0) return `${hrs} ชม. ${mins} นาที`;
  if (hrs > 0) return `${hrs} ชม.`;
  return `${mins} นาที`;
}

/**
 * ຈັດຮູບແບບວັນທີ ແລະ ເວລາໃຫ້ເປັນຮູບແບບທ້ອງຖິ່ນທີ່ອ່ານງ່າຍ
 */
export function formatDateTime(dateInput: string | Date | null | undefined): string {
  if (!dateInput) return '-';
  const date = new Date(dateInput);
  if (isNaN(date.getTime())) return '-';
  return date.toLocaleString('th-TH', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

/**
 * ຈັດຮູບແບບວັນທີໃຫ້ເປັນ ປີ-ເດືອນ-ວັນ (YYYY-MM-DD)
 */
export function formatDate(dateInput: string | Date | null | undefined): string {
  if (!dateInput) return '-';
  const date = new Date(dateInput);
  if (isNaN(date.getTime())) return '-';
  return date.toLocaleDateString('th-TH', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

/**
 * ຈັດຮູບແບບເວລາໃຫ້ເປັນ ຊົ່ວໂມງ:ນາທີ:ວິນາທີ (HH:mm:ss)
 */
export function formatTime(dateInput: string | Date | null | undefined): string {
  if (!dateInput) return '-';
  const date = new Date(dateInput);
  if (isNaN(date.getTime())) return '-';
  return date.toLocaleTimeString('th-TH', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}
