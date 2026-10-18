// ============================================
// PARKO — Auth & User Types
// ============================================

export interface User {
  id: string;
  username: string;
  displayName: string;
  email: string;
  role: 'ADMIN' | 'STAFF';
  isActive: boolean;
  createdAt: string;
}

export interface AuthSession {
  accessToken: string;
  refreshToken: string;
  user: User;
}
