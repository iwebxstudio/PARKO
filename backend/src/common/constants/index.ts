// ==============================================================================
// PARKO — ຄ່າຄົງທີ່ລະດັບ Global ຂອງລະບົບ (Global Constants)
// ລວບລວມສິດການໃຊ້ງານ (Roles), ຄີສຳລັບລະບົບແຄຊ (Cache Keys), ແລະ ຂະໜາດ Pagination ເລີ່ມຕົ້ນ
// ==============================================================================

export const ROLES = {
  ADMIN: 'ADMIN',
  STAFF: 'STAFF',
} as const;

export type UserRole = (typeof ROLES)[keyof typeof ROLES];

export const CACHE_KEYS = {
  ACTIVE_PARKING_COUNT: 'parking:active_count',
  SETTINGS: 'system:settings',
  TARIFFS: 'system:tariffs',
} as const;

export const DEFAULT_PAGE_SIZE = 20;
export const MAX_PAGE_SIZE = 100;
