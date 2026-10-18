// ============================================
// ລະບົບ PARKO — Application Route Constants (ຄ່າຄົງທີ່ເສັ້ນທາງລະບົບ)
// ກຳນົດເສັ້ນທາງ URL ທັງໝົດຂອງລະບົບສຳລັບໜ້າທົ່ວໄປ, ໜ້າພະນັກງານ ແລະ ໜ້າຜູ້ດູແລລະບົບ
// ============================================

export const APP_ROUTES = {
  // ເສັ້ນທາງທົ່ວໄປ (Public Routes)
  LOGIN: '/login',
  REGISTER: '/register',

  // ເສັ້ນທາງສຳລັບພະນັກງານ (Staff Routes)
  STAFF_CHECKIN: '/staff/checkin',
  STAFF_CHECKOUT: '/staff/checkout',
  STAFF_LOST_TICKET: '/staff/lost-ticket',
  STAFF_LOST_TICKET_HISTORY: '/staff/lost-ticket-history',

  // ເສັ້ນທາງສຳລັບຜູ້ດູແລລະບົບ (Admin Routes)
  ADMIN_STATISTICS: '/admin/statistics',
  ADMIN_HISTORY: '/admin/history',
  ADMIN_MEMBERS: '/admin/members',
  ADMIN_REPORTS: '/admin/reports',
  ADMIN_AUDIT: '/admin/audit',
  ADMIN_USERS: '/admin/users',
  ADMIN_SETTINGS: '/admin/settings',
  ADMIN_NOTIFICATIONS: '/admin/notifications',
} as const;

export type AppRoute = (typeof APP_ROUTES)[keyof typeof APP_ROUTES];
