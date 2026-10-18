// ============================================
// PARKO — Date and Time Utilities
// ============================================

/**
 * Calculates duration in minutes between two dates
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
 * Formats duration in minutes to human readable HH:mm:ss
 */
export function formatDurationHoursMinutes(minutes: number): string {
  const hrs = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hrs}h ${mins}m`;
}
