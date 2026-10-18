// ============================================
// PARKO — Formatting Utility Functions
// ============================================

/**
 * Formats a number as currency string with commas
 */
export function formatCurrency(amount: number | string | null | undefined, currency: string = '₭'): string {
  if (amount === null || amount === undefined || isNaN(Number(amount))) {
    return `0 ${currency}`;
  }
  const formatted = Number(amount).toLocaleString('en-US');
  return `${formatted} ${currency}`;
}

/**
 * Formats duration in minutes to human-readable string (e.g. "2 ชม. 15 นาที")
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
 * Formats date/time string to localized readable format
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
 * Formats date to YYYY-MM-DD
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
 * Formats time to HH:mm:ss
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
