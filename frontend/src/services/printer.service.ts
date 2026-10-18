// ============================================
// PARKO — Printer Service
// Dispatches print requests to local print agent or thermal printer
// ============================================
import api from '../api/client';

export interface PrintTicketPayload {
  ticketId: string;
  plateNumber?: string;
  vehicleType: string;
  entryTime: string;
  qrData?: string;
}

export interface PrintReceiptPayload {
  ticketId: string;
  plateNumber?: string;
  vehicleType: string;
  entryTime: string;
  exitTime: string;
  durationMinutes: number;
  totalAmount: number;
  paidAmount: number;
  changeAmount: number;
  paymentMethod: string;
  staffName?: string;
}

export const printerService = {
  printTicket: async (payload: PrintTicketPayload) => {
    const res = await api.post('/printer/ticket', payload);
    return res.data;
  },

  printReceipt: async (payload: PrintReceiptPayload) => {
    const res = await api.post('/printer/receipt', payload);
    return res.data;
  },

  getStatus: async () => {
    const res = await api.get('/printer/status');
    return res.data;
  },
};
