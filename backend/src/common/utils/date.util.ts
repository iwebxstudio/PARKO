// ==============================================================================
// PARKO — ຟັງຊັນຊ່ວຍເຫຼືອດ້ານວັນທີ ແລະ ເວລາ (Date and Time Utilities)
// ໃຊ້ສຳລັບຄິດໄລ່ໄລຍະເວລາການຈອດລົດ ແລະ ຈັດຮູບແບບການສະແດງຜົນຊົ່ວໂມງ/ນາທີ
// ==============================================================================

/**
 * ຄິດໄລ່ໄລຍະເວລາຈອດລົດເປັນຈຳນວນນາທີ ລະຫວ່າງສອງຊ່ວງເວລາ (Start ແລະ End)
 */
export function calculateDurationMinutes(
  start: Date | string,
  end: Date | string = new Date(),
): number {
  const startTime = new Date(start).getTime();
  const endTime = new Date(end).getTime();
  return Math.max(0, Math.floor((endTime - startTime) / (1000 * 60)));
}

/**
 * ຈັດຮູບແບບຈຳນວນນາທີໃຫ້ເປັນຂໍ້ຄວາມຊົ່ວໂມງ ແລະ ນາທີ ທີ່ອ່ານເຂົ້າໃຈງ່າຍ (ເຊັ່ນ "2h 30m")
 */
export function formatDurationHoursMinutes(minutes: number): string {
  const hrs = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hrs}h ${mins}m`;
}
