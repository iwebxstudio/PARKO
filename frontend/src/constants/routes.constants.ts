// ============================================
// PARKO — Application Route Constants
// ============================================

export const APP_ROUTES = {
  // Public
  LOGIN: '/login',
  REGISTER: '/register',

  // Staff
  STAFF_CHECKIN: '/staff/checkin',
  STAFF_CHECKOUT: '/staff/checkout',
  STAFF_LOST_TICKET: '/staff/lost-ticket',
  STAFF_LOST_TICKET_HISTORY: '/staff/lost-ticket-history',

  // Admin
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
