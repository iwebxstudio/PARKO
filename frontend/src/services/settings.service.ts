// ============================================
// PARKO — Settings Service
// ============================================
import api from '../api/client';

export const settingsService = {
  getAll: async () => {
    const res = await api.get('/settings');
    return res.data;
  },

  update: async (key: string, value: any) => {
    const res = await api.put(`/settings/${key}`, { value });
    return res.data;
  },

  getTariffs: async () => {
    const res = await api.get('/pricing');
    return res.data;
  },

  updateTariff: async (id: number | string, data: any) => {
    const res = await api.put(`/pricing/${id}`, data);
    return res.data;
  },
};
