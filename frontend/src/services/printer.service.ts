// ============================================
// ລະບົບ PARKO — Printer Service (ການບໍລິການສັ່ງພິມໃບບິນ ແລະ ປີ້ລົດ)
// ສົ່ງຄຳຂໍພິມປີ້ ແລະ ໃບບິນຮັບເງິນໄປຍັງ Print Agent ທ້ອງຖິ່ນ ຫຼື ເຄື່ອງພິມຄວາມຮ້ອນ
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
