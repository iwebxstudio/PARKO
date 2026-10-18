// ============================================
// ລະບົບ PARKO — Auth & User Types (ປະເພດຂໍ້ມູນການຢັ້ງຢືນຕົວຕົນ ແລະ ຜູ້ໃຊ້)
// ກຳນົດ Interface ສຳລັບຂໍ້ມູນໂປຣໄຟລ໌ຜູ້ໃຊ້ ແລະ Session ການເຂົ້າສູ່ລະບົບ
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
