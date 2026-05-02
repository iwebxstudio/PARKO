// PARKO — Check-out Page
import React, { useState, useEffect } from 'react';
import { Search, ScanLine, Check, Printer, CreditCard, Banknote, QrCode } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../api/client';
import type { ParkingTicket } from '../../types';

export default function CheckOut() {
  const [query, setQuery] = useState('');
  const [ticket, setTicket] = useState<ParkingTicket | null>(null);
  const [loading, setLoading] = useState(false);
  const [payMethod, setPayMethod] = useState('CASH');
  const [payStatus, setPayStatus] = useState('PAID');
  const [processing, setProcessing] = useState(false);
  const [done, setDone] = useState(false);
  const [qrImage, setQrImage] = useState<string | null>(null);

  useEffect(() => {
    // Load QR settings
    api.get('/settings').then(res => {
      const s = res.data.data || res.data;
      const qrSetting = s.find((x: any) => x.key === 'qr_payment_image');
      if (qrSetting && qrSetting.value?.enabled && qrSetting.value?.url) {
        setQrImage(qrSetting.value.url);
      }
    }).catch(() => {});
  }, []);

  const search = async () => {
    if (!query.trim()) return toast.error('ກະລຸນາສະແກນ QR ຫຼື ໃສ່ Ticket #');
    setLoading(true);
    try {
      const { data } = await api.get(`/parking/find/${query.trim()}`);
      setTicket(data.data || data);
      setPayStatus('PAID');
    } catch { toast.error('ບໍ່ພົບ Ticket (Manual Fallback Needed)'); }
    finally { setLoading(false); }
  };

  const handleCheckOut = async () => {
    if (!ticket) return;
    setProcessing(true);
    try {
      const { data } = await api.post('/parking/check-out', {
        identifier: ticket.ticketNumber, 
        paymentMethod: payMethod,
        paymentStatus: payStatus,
        amountPaid: ticket.calculatedCost || 0,
      });
      const r = data.data || data;
      setTicket(r);
      setDone(true);
      toast.success(payStatus === 'PENDING' ? 'ລໍຖ້າການຊຳລະເງິນ (PENDING)' : 'ລົດອອກສຳເລັດ!');
    } catch (e: any) { toast.error(e.response?.data?.message || 'Failed'); }
    finally { setProcessing(false); }
  };

  const handlePrint = async () => {
    toast.success('🖨️ ກຳລັງສົ່ງໄປທີ່ Print Agent...');
    try {
      // Send to local print agent
      await fetch('http://localhost:8080/print', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ticket })
      });
    } catch (err) {
      toast.error('Print Agent ບໍ່ຕອບສະໜອງ');
    }
  };

  const reset = () => { setQuery(''); setTicket(null); setDone(false); };
  const fmt = (n: number) => new Intl.NumberFormat('lo-LA').format(n) + ' ₭';

  if (done && ticket) return (
    <div className="max-w-lg mx-auto animate-scale-in">
      <div className="glass-card p-6 text-center">
        <div className={`w-16 h-16 mx-auto rounded-full flex items-center justify-center mb-4 ${ticket.paymentStatus === 'PENDING' ? 'bg-yellow-500/20 text-yellow-400' : 'gradient-success text-white'}`}>
          {ticket.paymentStatus === 'PENDING' ? <QrCode className="w-8 h-8" /> : <Check className="w-8 h-8" />}
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-4">
          {ticket.paymentStatus === 'PENDING' ? 'ລໍຖ້າຊຳລະເງິນ (Pending)' : 'ລົດອອກສຳເລັດ!'}
        </h2>
        <div className="bg-gray-50 rounded-xl p-5 mb-6 text-left space-y-3 border border-gray-100">
          {[
            ['Ticket #', ticket.ticketNumber],
            ['ສະຖານະ', ticket.paymentStatus],
            ['ລາຄາ', fmt(ticket.totalAmount || ticket.calculatedCost || 0)],
          ].map(([l, v]) => (
            <div key={l as string} className="flex justify-between">
              <span className="text-gray-500">{l}</span>
              <span className="text-gray-900 font-bold">{v}</span>
            </div>
          ))}
        </div>
        <div className="flex gap-3">
          <button onClick={handlePrint} className="btn-primary flex-1 flex items-center justify-center gap-2">
            <Printer size={20} /> ພິມໃບບິນ
          </button>
          <button onClick={reset} className="btn-secondary flex-1 flex items-center justify-center gap-2">
            ຄັນຕໍ່ໄປ
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6 flex items-center gap-3">
        <ScanLine className="text-primary-500 w-8 h-8" />
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">ສະແກນລົດອອກ (Check-out)</h1>
          <p className="text-gray-500 mt-1">ສະແກນ QR / Ticket ID / ທະບຽນ</p>
        </div>
      </div>

      {/* Scanner Input */}
      <div className="glass-card p-8 mb-4 border-2 border-dashed border-primary-300 bg-primary-50 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary-400 to-transparent opacity-50 scanner-beam" />
        <div className="flex flex-col items-center gap-4">
          <ScanLine className="w-16 h-16 text-primary-400 mb-2" />
          <p className="text-gray-600 font-bold">ສະແກນ QR Code ເພື່ອຄົ້ນຫາ</p>
          <div className="flex gap-3 w-full">
            <input value={query} onChange={e => setQuery(e.target.value)} onKeyDown={e => e.key === 'Enter' && search()}
              className="input-field text-center text-lg tracking-widest flex-1" placeholder="ຫຼືພິມ ID / ທະບຽນລົດບ່ອນນີ້..." autoFocus />
            <button onClick={search} disabled={loading} className="btn-primary w-24">
              {loading ? '...' : 'ຄົ້ນຫາ'}
            </button>
          </div>
        </div>
      </div>

      {/* Ticket Result */}
      {ticket && !done && (
        <div className="glass-card p-6 animate-slide-up grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="text-lg font-bold text-gray-900 mb-4">ຂໍ້ມູນ Ticket</h3>
            <div className="space-y-3 mb-6">
              {[
                ['Ticket #', ticket.ticketNumber],
                ['ປະເພດລົດ', `${ticket.vehicleType?.icon || ''} ${ticket.vehicleType?.label || ''}`],
                ['ເວລາເຂົ້າ', new Date(ticket.checkInAt).toLocaleString()],
                ['ໄລຍະເວລາ', ticket.duration?.formatted || '-'],
              ].map(([l, v]) => (
                <div key={l as string} className="flex justify-between py-2 border-b border-gray-100">
                  <span className="text-gray-500">{l}</span>
                  <span className="text-gray-900 font-medium">{v}</span>
                </div>
              ))}
              <div className="flex justify-between py-3 bg-gray-50 rounded-xl px-4 mt-2 border border-gray-100">
                <span className="text-lg font-bold text-gray-900">ລາຄາ</span>
                <span className="text-2xl font-bold text-accent-500">{fmt(ticket.calculatedCost || 0)}</span>
              </div>
            </div>

            {/* Payment Method */}
            <p className="text-sm font-bold text-gray-500 mb-2">ວິທີຊຳລະ</p>
            <div className="flex gap-2 mb-4">
              {[['CASH','ເງິນສົດ'],['QR_PAYMENT','QR'],['TRANSFER','ໂອນ']].map(([v,l]) => (
                <button key={v as string} onClick={() => setPayMethod(v as string)}
                  className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${
                    payMethod===v ? 'bg-primary-500 text-white shadow-md shadow-primary-500/20' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                  {l}
                </button>
              ))}
            </div>

            {/* Payment Status */}
            <p className="text-sm font-bold text-gray-500 mb-2">ສະຖານະ</p>
            <div className="flex gap-2 mb-6">
              {[['PAID','ຈ່າຍແລ້ວ'],['PENDING','ລໍຖ້າຊຳລະ (Pending)'],['WAIVED','Manual Fallback (Waived)']].map(([v,l]) => (
                <button key={v as string} onClick={() => setPayStatus(v as string)}
                  className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${
                    payStatus===v ? (v==='PAID'?'bg-secondary-500 text-white shadow-md':v==='PENDING'?'bg-accent-500 text-white shadow-md':'bg-gray-800 text-white') : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                  {l}
                </button>
              ))}
            </div>

            <button onClick={handleCheckOut} disabled={processing}
              className={`w-full text-lg py-4 flex items-center justify-center gap-2 rounded-2xl font-bold transition-all shadow-md ${payStatus === 'PENDING' ? 'bg-accent-400 hover:bg-accent-500 text-white' : 'bg-secondary-500 hover:bg-secondary-600 text-white'}`}>
              {processing ? '⏳' : <><Check size={24} /> ຢືນຢັນລົດອອກ</>}
            </button>
          </div>

          {/* QR Code Display */}
          {payMethod === 'QR_PAYMENT' && (
            <div className="flex flex-col items-center justify-center bg-gray-50 rounded-2xl p-4 border border-gray-100">
              <p className="text-sm text-gray-500 mb-4 font-bold text-center">Static QR Payment</p>
              {qrImage ? (
                <img src={`http://localhost:3000${qrImage}`} alt="QR Payment" className="w-48 h-48 rounded-2xl shadow-lg border border-gray-200" />
              ) : (
                <div className="w-48 h-48 bg-white p-2 rounded-2xl shadow-lg border border-gray-200">
                  <QrCode className="w-full h-full text-gray-900" />
                </div>
              )}
              <p className="text-xs text-gray-400 mt-4 text-center">ແຈ້ງລູກຄ້າສະແກນ QR ເພື່ອຊຳລະເງິນ</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
