// ============================================
// PARKO — Parking Service
// Encapsulates check-in, check-out, calculation, and active parking APIs
// ============================================
import api from '../api/client';

export interface CheckInPayload {
  vehicleType: string;
  plateNumber?: string;
  note?: string;
}

export interface CheckOutPayload {
  ticketId: string;
  paymentMethod: string;
  amountReceived?: number;
  discount?: number;
  note?: string;
}

export interface CalculateFeePayload {
  ticketId?: string;
  entryTime?: string;
  vehicleType?: string;
}

export const parkingService = {
  checkIn: async (payload: CheckInPayload) => {
    const res = await api.post('/parking/check-in', payload);
    return res.data;
  },

  calculateFee: async (payload: CalculateFeePayload) => {
    const res = await api.post('/parking/calculate', payload);
    return res.data;
  },

  checkOut: async (payload: CheckOutPayload) => {
    const res = await api.post('/parking/check-out', payload);
    return res.data;
  },

  getActiveParking: async (params?: { page?: number; limit?: number; search?: string }) => {
    const res = await api.get('/parking/active', { params });
    return res.data;
  },

  getHistory: async (params?: { page?: number; limit?: number; search?: string; startDate?: string; endDate?: string }) => {
    const res = await api.get('/parking/history', { params });
    return res.data;
  },

  getTicket: async (ticketId: string) => {
    const res = await api.get(`/parking/ticket/${ticketId}`);
    return res.data;
  },
};
