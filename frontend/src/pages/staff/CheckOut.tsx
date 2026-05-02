// PARKO — Check-out Page (Redesigned with QR Camera Scanner)
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import {
  Camera, CameraOff, Search, Check, Printer, QrCode,
  RotateCcw, Clock, Car, Banknote, ArrowRight, Smartphone,
  Keyboard, X,
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../api/client';
import type { ParkingTicket } from '../../types';

type InputMode = 'camera' | 'manual';

export default function CheckOut() {
  const [mode, setMode] = useState<InputMode>('manual');
  const [query, setQuery] = useState('');
  const [ticket, setTicket] = useState<ParkingTicket | null>(null);
  const [loading, setLoading] = useState(false);
  const [payMethod, setPayMethod] = useState('CASH');
  const [payStatus, setPayStatus] = useState('PAID');
  const [processing, setProcessing] = useState(false);
  const [done, setDone] = useState(false);
  const [qrImage, setQrImage] = useState<string | null>(null);

  // Camera scanner refs
  const [scanning, setScanning] = useState(false);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const scannerContainerRef = useRef<HTMLDivElement>(null);
  const hasFoundTicket = useRef(false);

  useEffect(() => {
    api.get('/settings').then(res => {
      const s = res.data.data || res.data;
      const qrSetting = s.find((x: any) => x.key === 'qr_payment_image');
      if (qrSetting && qrSetting.value?.enabled && qrSetting.value?.url) {
        setQrImage(qrSetting.value.url);
      }
    }).catch(() => {});
  }, []);

  // ── QR Camera Scanner ─────────────────────
  const stopScanner = useCallback(async () => {
    if (scannerRef.current) {
      try {
        const state = scannerRef.current.getState();
        if (state === 2) { // SCANNING
          await scannerRef.current.stop();
        }
      } catch { /* ignore */ }
      try {
        scannerRef.current.clear();
      } catch { /* ignore */ }
      scannerRef.current = null;
    }
    setScanning(false);
  }, []);

  const startScanner = useCallback(async () => {
    if (scannerRef.current || !scannerContainerRef.current) return;
    hasFoundTicket.current = false;

    try {
      const scanner = new Html5Qrcode('qr-reader');
      scannerRef.current = scanner;
      setScanning(true);

      await scanner.start(
        { facingMode: 'environment' },
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
          aspectRatio: 1,
        },
        (decodedText) => {
          if (hasFoundTicket.current) return;
          hasFoundTicket.current = true;

          // Try to parse JSON QR data from PARKO tickets
          let searchQuery = decodedText;
          try {
            const parsed = JSON.parse(decodedText);
            if (parsed.ticketNumber) searchQuery = parsed.ticketNumber;
          } catch { /* not JSON, use raw text */ }

          setQuery(searchQuery);
          searchTicket(searchQuery);
          stopScanner();
        },
        () => { /* ignore scan errors */ }
      );
    } catch (err: any) {
      toast.error('ບໍ່ສາມາດເປີດກ້ອງ: ' + (err?.message || 'Permission denied'));
      setScanning(false);
      scannerRef.current = null;
    }
  }, [stopScanner]);

  // Auto-start camera when mode = camera & no ticket found
  useEffect(() => {
    if (mode === 'camera' && !ticket && !done) {
      // small delay for DOM to mount
      const t = setTimeout(() => startScanner(), 300);
      return () => { clearTimeout(t); stopScanner(); };
    } else {
      stopScanner();
    }
  }, [mode, ticket, done]);

  // Cleanup on unmount
  useEffect(() => {
    return () => { stopScanner(); };
  }, [stopScanner]);

  // ── Search ─────────────────────────────────
  const searchTicket = async (searchQuery: string) => {
    const q = searchQuery.trim();
    if (!q) return toast.error('ກະລຸນາສະແກນ QR ຫຼື ໃສ່ Ticket #');
    setLoading(true);
    try {
      const { data } = await api.get(`/parking/find/${q}`);
      setTicket(data.data || data);
      setPayStatus('PAID');
      toast.success('ພົບ Ticket ແລ້ວ!');
    } catch {
      toast.error('ບໍ່ພົບ Ticket');
      hasFoundTicket.current = false;
      // restart scanner if camera mode
      if (mode === 'camera') {
        setTimeout(() => startScanner(), 500);
      }
    } finally {
      setLoading(false);
    }
  };

  const search = () => searchTicket(query);

  // ── Check-out ──────────────────────────────
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
      toast.success(payStatus === 'PENDING' ? 'ລໍຖ້າການຊຳລະເງິນ' : 'ລົດອອກສຳເລັດ!');
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'Failed');
    } finally {
      setProcessing(false);
    }
  };

  const handlePrint = async () => {
    toast.success('🖨️ ກຳລັງສົ່ງໄປທີ່ Print Agent...');
    try {
      await fetch('http://localhost:8080/print', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ticket }),
      });
    } catch {
      toast.error('Print Agent ບໍ່ຕອບສະໜອງ');
    }
  };

  const reset = () => {
    setQuery('');
    setTicket(null);
    setDone(false);
    hasFoundTicket.current = false;
  };

  const fmt = (n: number) => new Intl.NumberFormat('lo-LA').format(n) + ' ₭';

  // ═══════════════════════════════════════════
  // ── DONE VIEW ──────────────────────────────
  // ═══════════════════════════════════════════
  if (done && ticket) return (
    <div className="max-w-lg mx-auto animate-scale-in">
      <div className="glass-card p-8 text-center">
        <div className={`w-20 h-20 mx-auto rounded-full flex items-center justify-center mb-5 ${
          payStatus === 'PENDING'
            ? 'bg-amber-100 text-amber-500'
            : 'gradient-success text-white shadow-lg shadow-emerald-500/30'
        }`}>
          {payStatus === 'PENDING'
            ? <Clock className="w-10 h-10" />
            : <Check className="w-10 h-10" />}
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-1">
          {payStatus === 'PENDING' ? 'ລໍຖ້າຊຳລະເງິນ' : 'ລົດອອກສຳເລັດ!'}
        </h2>
        <p className="text-gray-400 text-sm mb-6">
          {payStatus === 'PENDING' ? 'Pending Payment' : 'Check-out Complete'}
        </p>

        {/* Receipt summary */}
        <div className="bg-gray-50 rounded-2xl p-5 mb-6 text-left border border-gray-100">
          <div className="space-y-3">
            {[
              ['Ticket #', ticket.ticketNumber],
              ['ປະເພດລົດ', `${ticket.vehicleType?.icon || '🚗'} ${ticket.vehicleType?.label || ''}`],
              ['ທະບຽນ', ticket.plateNumber || 'ບໍ່ມີ'],
              ['ເວລາເຂົ້າ', new Date(ticket.checkInAt).toLocaleString('lo-LA')],
              ['ເວລາອອກ', ticket.checkOutAt ? new Date(ticket.checkOutAt).toLocaleString('lo-LA') : '-'],
            ].map(([l, v]) => (
              <div key={l as string} className="flex justify-between items-center">
                <span className="text-gray-400 text-sm">{l}</span>
                <span className="text-gray-900 font-semibold">{v}</span>
              </div>
            ))}
          </div>
          <div className="mt-4 pt-4 border-t-2 border-dashed border-gray-200 flex justify-between items-center">
            <span className="text-lg font-bold text-gray-900">ລວມ</span>
            <span className="text-2xl font-bold text-emerald-600">
              {fmt(ticket.totalAmount || ticket.calculatedCost || 0)}
            </span>
          </div>
          <div className="mt-2 flex justify-between items-center">
            <span className="text-sm text-gray-400">ສະຖານະ</span>
            <span className={`badge ${
              payStatus === 'PAID' ? 'badge-paid' :
              payStatus === 'WAIVED' ? 'badge-completed' : 'badge-unpaid'
            }`}>
              {payStatus === 'PAID' ? '✓ ຈ່າຍແລ້ວ' :
               payStatus === 'WAIVED' ? 'Waived' : '⏳ ລໍຖ້າ'}
            </span>
          </div>
        </div>

        <div className="flex gap-3">
          <button onClick={handlePrint} className="btn-primary flex-1 flex items-center justify-center gap-2">
            <Printer size={20} /> ພິມໃບບິນ
          </button>
          <button onClick={reset} className="btn-success flex-1 flex items-center justify-center gap-2">
            <RotateCcw size={20} /> ຄັນຕໍ່ໄປ
          </button>
        </div>
      </div>
    </div>
  );

  // ═══════════════════════════════════════════
  // ── TICKET FOUND VIEW ──────────────────────
  // ═══════════════════════════════════════════
  if (ticket && !done) return (
    <div className="w-full animate-slide-up">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">ຢືນຢັນລົດອອກ</h1>
          <p className="text-gray-400 text-sm">Confirm Check-out</p>
        </div>
        <button onClick={reset} className="text-gray-400 hover:text-gray-600 p-2 rounded-xl hover:bg-gray-100 transition-all">
          <X size={24} />
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-5">
        {/* Left: Ticket Info (3 cols) */}
        <div className="md:col-span-3 glass-card p-6">
          {/* Ticket Header */}
          <div className="flex items-center gap-4 mb-5 pb-5 border-b border-gray-100">
            <div className="w-14 h-14 rounded-2xl bg-primary-50 flex items-center justify-center text-primary-600">
              <Car size={28} />
            </div>
            <div className="flex-1">
              <p className="text-xl font-bold text-gray-900">#{ticket.ticketNumber}</p>
              <p className="text-gray-400 text-sm">{ticket.vehicleType?.icon} {ticket.vehicleType?.label}</p>
            </div>
            <div className="badge badge-active text-sm px-4 py-1.5">ACTIVE</div>
          </div>

          {/* Details */}
          <div className="space-y-3 mb-5">
            {[
              ['ທະບຽນ', ticket.plateNumber ? `${ticket.plateProvince || ''} ${ticket.plateNumber}` : 'ບໍ່ມີ'],
              ['ເວລາເຂົ້າ', new Date(ticket.checkInAt).toLocaleString('lo-LA')],
              ['ໄລຍະເວລາ', ticket.duration?.formatted || '-'],
              ['ຜູ້ check-in', ticket.checkedInBy?.displayName || '-'],
            ].map(([l, v]) => (
              <div key={l as string} className="flex justify-between items-center py-1.5">
                <span className="text-gray-400 text-sm">{l}</span>
                <span className="text-gray-800 font-medium">{v}</span>
              </div>
            ))}
          </div>

          {/* Price */}
          <div className="bg-gradient-to-r from-emerald-50 to-sky-50 rounded-2xl p-5 border border-emerald-100">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm text-gray-500 font-medium">ລາຄາທີ່ຕ້ອງຊຳລະ</p>
                <p className="text-xs text-gray-400 mt-0.5">Amount Due</p>
              </div>
              <p className="text-3xl font-bold text-emerald-600">
                {fmt(ticket.calculatedCost || 0)}
              </p>
            </div>
          </div>
        </div>

        {/* Right: Payment & Action (2 cols) */}
        <div className="md:col-span-2 flex flex-col gap-4">
          {/* Payment Method */}
          <div className="glass-card p-5">
            <p className="text-sm font-bold text-gray-400 mb-3 uppercase tracking-wider">ວິທີຊຳລະ</p>
            <div className="space-y-2">
              {([
                ['CASH', 'ເງິນສົດ', <Banknote size={18} key="cash" />],
                ['QR_PAYMENT', 'QR Payment', <QrCode size={18} key="qr" />],
                ['TRANSFER', 'ໂອນເງິນ', <ArrowRight size={18} key="tf" />],
              ] as [string, string, React.ReactNode][]).map(([v, l, icon]) => (
                <button key={v} onClick={() => setPayMethod(v)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all ${
                    payMethod === v
                      ? 'bg-primary-500 text-white shadow-md shadow-primary-500/20'
                      : 'bg-gray-50 text-gray-600 hover:bg-gray-100 border border-gray-100'
                  }`}>
                  {icon}
                  {l}
                </button>
              ))}
            </div>

            {/* QR Image for QR Payment */}
            {payMethod === 'QR_PAYMENT' && (
              <div className="mt-4 flex flex-col items-center bg-gray-50 rounded-xl p-4 border border-gray-100">
                <p className="text-xs text-gray-400 mb-2 font-bold">ສະແກນເພື່ອຊຳລະ</p>
                {qrImage ? (
                  <img src={`http://localhost:3000${qrImage}`} alt="QR Payment"
                    className="w-36 h-36 rounded-xl shadow border border-gray-200" />
                ) : (
                  <div className="w-36 h-36 bg-white p-2 rounded-xl shadow border border-gray-200">
                    <QrCode className="w-full h-full text-gray-900" />
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Payment Status */}
          <div className="glass-card p-5">
            <p className="text-sm font-bold text-gray-400 mb-3 uppercase tracking-wider">ສະຖານະ</p>
            <div className="space-y-2">
              {([
                ['PAID', 'ຈ່າຍແລ້ວ', 'bg-emerald-500'],
                ['PENDING', 'ລໍຖ້າ (Pending)', 'bg-amber-500'],
                ['WAIVED', 'Waived', 'bg-gray-700'],
              ] as [string, string, string][]).map(([v, l, activeColor]) => (
                <button key={v} onClick={() => setPayStatus(v)}
                  className={`w-full px-4 py-3 rounded-xl text-sm font-bold transition-all ${
                    payStatus === v
                      ? `${activeColor} text-white shadow-md`
                      : 'bg-gray-50 text-gray-600 hover:bg-gray-100 border border-gray-100'
                  }`}>
                  {l}
                </button>
              ))}
            </div>
          </div>

          {/* Confirm Button */}
          <button onClick={handleCheckOut} disabled={processing}
            className={`w-full text-lg py-4 flex items-center justify-center gap-2 rounded-2xl font-bold transition-all shadow-lg active:scale-95 disabled:opacity-50 ${
              payStatus === 'PENDING'
                ? 'bg-amber-500 hover:bg-amber-600 text-white shadow-amber-500/25'
                : 'bg-emerald-500 hover:bg-emerald-600 text-white shadow-emerald-500/25'
            }`}>
            {processing ? '⏳ ກຳລັງດຳເນີນ...' : <><Check size={24} /> ຢືນຢັນລົດອອກ</>}
          </button>
        </div>
      </div>
    </div>
  );

  // ═══════════════════════════════════════════
  // ── SCAN / SEARCH VIEW ─────────────────────
  // ═══════════════════════════════════════════
  return (
    <div className="w-full">
      {/* Page Header */}
      <div className="mb-6">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900">ລົດອອກ (Check-out)</h1>
        <p className="text-gray-400 mt-1">ສະແກນ QR Code ຫຼື ພິມເລກ Ticket</p>
      </div>

      {/* Mode Switcher (Redesigned) */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        <button
          onClick={() => setMode('manual')}
          className={`group flex items-center justify-center gap-2.5 py-3 rounded-xl font-bold text-sm transition-all duration-300 border-2 ${
            mode === 'manual'
              ? 'border-primary-500 bg-primary-50 text-primary-700 shadow-md shadow-primary-500/10 scale-[1.01]'
              : 'border-gray-100 bg-white text-gray-500 hover:border-primary-200 hover:bg-gray-50 hover:text-gray-700'
          }`}>
          <div className={`p-1.5 rounded-lg transition-colors ${mode === 'manual' ? 'bg-primary-500 text-white' : 'bg-gray-100 text-gray-400 group-hover:bg-primary-100 group-hover:text-primary-500'}`}>
            <Keyboard size={18} />
          </div>
          <span>ພິມ Ticket ID</span>
        </button>

        <button
          onClick={() => setMode('camera')}
          className={`group flex items-center justify-center gap-2.5 py-3 rounded-xl font-bold text-sm transition-all duration-300 border-2 ${
            mode === 'camera'
              ? 'border-primary-500 bg-primary-50 text-primary-700 shadow-md shadow-primary-500/10 scale-[1.01]'
              : 'border-gray-100 bg-white text-gray-500 hover:border-primary-200 hover:bg-gray-50 hover:text-gray-700'
          }`}>
          <div className={`p-1.5 rounded-lg transition-colors ${mode === 'camera' ? 'bg-primary-500 text-white' : 'bg-gray-100 text-gray-400 group-hover:bg-primary-100 group-hover:text-primary-500'}`}>
            <Camera size={18} />
          </div>
          <span>ສະແກນ QR (ກ້ອງ)</span>
        </button>
      </div>

      {/* Camera Mode */}
      {mode === 'camera' && (
        <div className="glass-card overflow-hidden mb-4">
          {/* Scanner container */}
          <div className="relative bg-gray-900 rounded-t-2xl overflow-hidden" style={{ minHeight: '320px' }}>
            <div id="qr-reader" ref={scannerContainerRef}
              className="w-full"
              style={{ minHeight: '320px' }}
            />

            {/* Overlay when not scanning */}
            {!scanning && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-900/90 text-white">
                <CameraOff size={48} className="text-gray-500 mb-3" />
                <p className="text-gray-400 font-medium mb-4">ກ້ອງຍັງບໍ່ເປີດ</p>
                <button onClick={startScanner} className="btn-primary flex items-center gap-2">
                  <Camera size={18} /> ເປີດກ້ອງ
                </button>
              </div>
            )}

            {/* Scanning animation overlay */}
            {scanning && (
              <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                <div className="w-64 h-64 border-2 border-primary-400 rounded-2xl relative">
                  <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-primary-400 rounded-tl-xl" />
                  <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-primary-400 rounded-tr-xl" />
                  <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-primary-400 rounded-bl-xl" />
                  <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-primary-400 rounded-br-xl" />
                  {/* Scanning line animation */}
                  <div className="absolute left-2 right-2 h-0.5 bg-primary-400 animate-scan-line rounded-full shadow-lg shadow-primary-400/50" />
                </div>
              </div>
            )}
          </div>

          {/* Bottom actions */}
          <div className="p-5 bg-white">
            <div className="flex items-center gap-3 text-center">
              <Smartphone size={20} className="text-primary-500 flex-shrink-0" />
              <p className="text-sm text-gray-500">
                ນຳໃບບິນທີ່ມີ QR Code ມາສະແກນ ຫຼື ກົດ <strong>"ພິມ Ticket ID"</strong> ດ້ານເທິງ
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Manual Mode */}
      {mode === 'manual' && (
        <div className="glass-card p-6 mb-4">
          <div className="text-center mb-6">
            <div className="w-16 h-16 mx-auto rounded-full bg-primary-50 flex items-center justify-center mb-3">
              <Search size={28} className="text-primary-500" />
            </div>
            <p className="text-gray-500 font-medium">ໃສ່ເລກ Ticket ຫຼື ທະບຽນລົດ</p>
          </div>

          <div className="flex gap-3">
            <input
              value={query}
              onChange={e => setQuery(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && search()}
              className="input-field text-center text-lg tracking-widest flex-1 !rounded-xl"
              placeholder="Ticket # / ທະບຽນລົດ"
              autoFocus
            />
            <button onClick={search} disabled={loading}
              className="btn-primary !px-8 !rounded-xl flex items-center gap-2">
              {loading ? (
                <span className="animate-spin">⏳</span>
              ) : (
                <><Search size={18} /> ຄົ້ນຫາ</>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Loading indicator */}
      {loading && (
        <div className="glass-card p-8 text-center animate-pulse">
          <div className="w-12 h-12 mx-auto rounded-full bg-primary-100 flex items-center justify-center mb-3">
            <Search size={24} className="text-primary-500 animate-bounce" />
          </div>
          <p className="text-gray-500 font-medium">ກຳລັງຄົ້ນຫາ...</p>
        </div>
      )}
    </div>
  );
}
