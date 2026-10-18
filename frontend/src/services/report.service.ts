// ============================================
// ລະບົບ PARKO — Reports and Statistics Service (ການບໍລິການລາຍງານ ແລະ ສະຖິຕິ)
// ເຊື່ອມຕໍ່ API ດຶງສະຖິຕິລວມ, ສະຫຼຸບປະຈຳວັນ, ລາຍຮັບ ແລະ ສົ່ງອອກໄຟລ໌ Excel
// ============================================
import api from '../api/client';

export const reportService = {
  getStatistics: async (params?: { startDate?: string; endDate?: string }) => {
    const res = await api.get('/reports/statistics', { params });
    return res.data;
  },

  getDailySummary: async (date?: string) => {
    const res = await api.get('/reports/daily-summary', { params: { date } });
    return res.data;
  },

  getRevenue: async (params?: { period?: 'daily' | 'weekly' | 'monthly' | 'yearly'; startDate?: string; endDate?: string }) => {
    const res = await api.get('/reports/revenue', { params });
    return res.data;
  },

  getLostTickets: async (params?: { period?: 'daily' | 'monthly' | 'yearly'; dateFrom?: string; dateTo?: string }) => {
    const res = await api.get('/reports/lost-tickets', { params });
    return res.data;
  },

  exportExcel: async (params?: { startDate?: string; endDate?: string }) => {
    const res = await api.get('/reports/export', { params, responseType: 'blob' });
    return res.data;
  },
};
