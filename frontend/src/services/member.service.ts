// ============================================
// ລະບົບ PARKO — Membership Service (ການບໍລິການຈັດການຂໍ້ມູນສະມາຊິກ)
// ເຊື່ອມຕໍ່ API ສຳລັບການດຶງຂໍ້ມູນ, ເພີ່ມ, ແກ້ໄຂ, ລຶບ ແລະ ຕໍ່ອາຍຸສະມາຊິກບ່ອນຈອດລົດ
// ============================================
import api from '../api/client';

export interface MemberPayload {
  name: string;
  phone: string;
  plateNumber: string;
  vehicleType: string;
  startDate: string;
  endDate: string;
  note?: string;
}

export const memberService = {
  getAll: async (params?: { page?: number; limit?: number; search?: string }) => {
    const res = await api.get('/membership', { params });
    return res.data;
  },

  getById: async (id: number | string) => {
    const res = await api.get(`/membership/${id}`);
    return res.data;
  },

  create: async (payload: MemberPayload) => {
    const res = await api.post('/membership', payload);
    return res.data;
  },

  update: async (id: number | string, payload: Partial<MemberPayload>) => {
    const res = await api.put(`/membership/${id}`, payload);
    return res.data;
  },

  delete: async (id: number | string) => {
    const res = await api.delete(`/membership/${id}`);
    return res.data;
  },

  renew: async (id: number | string, days: number) => {
    const res = await api.post(`/membership/${id}/renew`, { days });
    return res.data;
  },
};
