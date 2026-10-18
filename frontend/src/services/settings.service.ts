// ============================================
// ລະບົບ PARKO — Settings Service (ການບໍລິການຈັດການການຕັ້ງຄ່າລະບົບ)
// ເຊື່ອມຕໍ່ API ສຳລັບການດຶງ ແລະ ອັບເດດການຕັ້ງຄ່າລະບົບ ແລະ ອັດຕາຄ່າທຳນຽມບ່ອນຈອດລົດ
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
