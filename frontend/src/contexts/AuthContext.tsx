// ============================================
// ລະບົບ PARKO — Auth Context (ລະບົບບໍລິຫານສະຖານະການຢັ້ງຢືນຕົວຕົນ)
// ຈັດການສະຖານະການເຂົ້າສູ່ລະບົບ (Authentication State) ທົ່ວທັງແອັບພລິເຄຊັນ
// ============================================
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../api/client';

interface User {
  id: string;
  username: string;
  displayName: string;
  role: 'ADMIN' | 'STAFF';
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // ດຶງຂໍ້ມູນຜູ້ໃຊ້ງານ ແລະ Token ຈາກ LocalStorage ມາຕັ້ງຄ່າເລີ່ມຕົ້ນເມື່ອໂຫຼດໜ້າເວັບ
  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    const token = localStorage.getItem('accessToken');
    if (storedUser && token) {
      setUser(JSON.parse(storedUser));
    }
    setIsLoading(false);
  }, []);

  const login = useCallback(async (username: string, password: string) => {
    const { data } = await api.post('/auth/login', { username, password });
    const result = data.data || data;

    localStorage.setItem('accessToken', result.accessToken);
    localStorage.setItem('refreshToken', result.refreshToken);
    localStorage.setItem('user', JSON.stringify(result.user));
    setUser(result.user);
  }, []);

  const logout = useCallback(async () => {
    try {
      const refreshToken = localStorage.getItem('refreshToken');
      if (refreshToken) {
        await api.post('/auth/logout', { refreshToken });
      }
    } catch {
      // ລະເລີຍຂໍ້ຜິດພາດຈາກ API ຕອນອອກຈາກລະບົບ ເພື່ອໃຫ້ລຶບຂໍ້ມູນໃນເຄື່ອງໄດ້ສະເໝີ
    } finally {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('user');
      setUser(null);
    }
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}
