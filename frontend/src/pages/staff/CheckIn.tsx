// PARKO — Check-in Page (Fast 1-2 click)
import React, { useState, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Car, Bike, Zap, Truck, Printer, Check, RotateCcw, Delete, Ban, LogIn, MessageSquare } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../api/client';
import type { VehicleType, ParkingTicket } from '../../types';

const icons: Record<string, React.ReactNode> = {
  motorcycle: <Bike size={40} />,
  ev_motorcycle: <Zap size={40} />,
  car: <Car size={40} />,
  truck: <Truck size={40} />
};

const laosProvinces = [
  'ນະຄອນຫລວງ', 'ຜົ້ງສາລີ', 'ຫຼວງນ້ຳທາ', 'ອຸດົມໄຊ', 'ບໍ່ແກ້ວ',
  'ຫຼວງພຣະບາງ', 'ໄຊຍະບູລີ', 'ຫົວພັນ', 'ໄຊສົມບູນ', 'ວຽງຈັນ',
  'ບໍລິຄຳໄຊ', 'ຄຳມ່ວນ', 'ສະຫວັນນະເຂດ', 'ສາລະວັນ', 'ເຊກອງ',
  'ຈຳປາສັກ', 'ອັດຕະປື'
];

const plateColors = [
  { id: 'white', label: 'ຂາວ', bg: '#ffffff', text: '#333', border: '#ccc' },
  { id: 'yellow', label: 'ເຫຼືອງ', bg: '#facc15', text: '#fff', border: '#eab308' },
  { id: 'blue', label: 'ຟ້າ', bg: '#2563eb', text: '#fff', border: '#1d4ed8' },
  { id: 'red', label: 'ແດງ', bg: '#dc2626', text: '#fff', border: '#b91c1c' },
];

export default function CheckIn() {
  const [types, setTypes] = useState<VehicleType[]>([]);
  const [selType, setSelType] = useState<number | null>(null);
  const [plate, setPlate] = useState('');
  const [plateLetters, setPlateLetters] = useState('');
  const [plateProv, setPlateProv] = useState('ນະຄອນຫລວງ');
  const [plateColor, setPlateColor] = useState('white');
  const [noPlate, setNoPlate] = useState(false);
  const [notes, setNotes] = useState('');
  const [pType, setPType] = useState('DAILY');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ParkingTicket | null>(null);
  const [previewPrice, setPreviewPrice] = useState<number | null>(null);
  const [loadingPrice, setLoadingPrice] = useState(false);
  const [qrPaymentImage, setQrPaymentImage] = useState<string | null>(null);
  const [parkingName, setParkingName] = useState('Vientiane Parking');
  const [parkingSub, setParkingSub] = useState('ໃບບິນຮັບເງິນ / PARKING RECEIPT');
  const [receiptFooter, setReceiptFooter] = useState('Thank you for using our service');
  const [parkingLogo, setParkingLogo] = useState<string | null>(null);
  const API_URL = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:3000';
  useEffect(() => {
    api.get('/pricing/vehicle-types').then(r => setTypes(r.data.data || r.data)).catch(() => toast.error('Load failed'));
    api.get('/settings').then(({ data }) => {
      const s = data.data || data;
      const qrSetting = s.find((x: any) => x.key === 'qr_payment_image');
      if (qrSetting && qrSetting.value?.url) {
        setQrPaymentImage(qrSetting.value.url);
      }
      const logoSetting = s.find((x: any) => x.key === 'parking_logo');
      if (logoSetting && logoSetting.value?.url) {
        setParkingLogo(logoSetting.value.url);
      }
      const nameSetting = s.find((x: any) => x.key === 'parking_name');
      if (nameSetting && nameSetting.value?.name) {
        setParkingName(nameSetting.value.name);
        setParkingSub(nameSetting.value.subtitle || 'ໃບບິນຮັບເງິນ / PARKING RECEIPT');
      }
      const footerSetting = s.find((x: any) => x.key === 'receipt_footer');
      if (footerSetting && footerSetting.value?.text) {
        setReceiptFooter(footerSetting.value.text);
      }
    }).catch(console.error);
  }, []);

  // Fetch price preview when vehicle type or parking type changes
  useEffect(() => {
    if (!selType) { setPreviewPrice(null); return; }
    setLoadingPrice(true);
    api.get(`/pricing/rate?vehicleTypeId=${selType}&parkingType=${pType}`)
      .then(r => {
        const d = r.data.data || r.data;
        setPreviewPrice(d.rate || 0);
      })
      .catch(() => setPreviewPrice(null))
      .finally(() => setLoadingPrice(false));
  }, [selType, pType]);

  /* Number-pad handler: append digit to plate number */
  const handleNumPad = (digit: string) => {
    if (plate.length < 4) setPlate(prev => prev + digit);
  };
  const handleNumPadClear = () => setPlate('');
  const handleNumPadBackspace = () => setPlate(prev => prev.slice(0, -1));

  const toggleNoPlate = () => {
    setNoPlate(prev => {
      if (!prev) { setPlate(''); setPlateLetters(''); setPlateProv(''); setPlateColor('white'); }
      else { setPlateProv('ນະຄອນຫລວງ'); setNotes(''); }
      return !prev;
    });
  };

  const handleCheckIn = async () => {
    if (!selType) return toast.error('ກະລຸນາເລືອກປະເພດລົດ');
    setLoading(true);
    try {
      const finalPlateNumber = noPlate ? '' : (plateLetters + ' ' + plate).trim();
      const { data } = await api.post('/parking/check-in', {
        vehicleTypeId: selType,
        plateNumber: finalPlateNumber || undefined,
        plateProvince: noPlate ? undefined : (plateProv || undefined),
        parkingType: pType,
        prepaidAmount: previewPrice || undefined,
        notes: noPlate && notes.trim() ? notes.trim() : undefined,
      });
      const t = data.data || data;
      setResult(t);
      toast.success(`ສຳເລັດ! Ticket: ${t.ticketNumber}`);
    } catch (e: any) { toast.error(e.response?.data?.message || 'Failed'); }
    finally { setLoading(false); }
  };

  const reset = () => { setSelType(null); setPlate(''); setPlateLetters(''); setPlateProv('ນະຄອນຫລວງ'); setPlateColor('white'); setNoPlate(false); setNotes(''); setResult(null); setPreviewPrice(null); };

  if (result) return (
    <div className="max-w-sm mx-auto animate-scale-in">
      {/* Receipt Box */}
      <div className="bg-white p-5 text-black shadow-xl rounded-none border border-gray-100 font-sans mx-auto" style={{ width: '100%', maxWidth: '320px' }}>

        {/* Header */}
        <div className="text-center mb-3">
          {parkingLogo ? (
            <img src={parkingLogo.startsWith('http') ? parkingLogo : `${API_URL}${parkingLogo}`} alt="Logo" className="w-12 h-12 mx-auto mb-1 object-contain" />
          ) : (
            <Car className="w-10 h-10 mx-auto mb-1 text-gray-800" />
          )}
          <h2 className="text-xl font-bold text-gray-900 m-0 leading-tight">{parkingName}</h2>
          <p className="text-[12px] text-gray-500 m-0 mt-0.5 tracking-wide">{parkingSub}</p>
        </div>

        <div className="border-t border-dashed border-gray-300 my-3"></div>

        {/* Ticket Info */}
        <div className="space-y-1.5 text-[13px] text-gray-800">
          <div className="flex justify-between"><span>Ticket No:</span><span className="font-bold">{result.ticketNumber}</span></div>
          <div className="flex justify-between"><span>ປະເພດລົດ:</span><span className="font-bold">{result.vehicleType?.label}</span></div>
          <div className="flex justify-between"><span>ທະບຽນ:</span><span className="font-bold">{result.plateNumber ? `${result.plateProvince || ''} ${result.plateNumber}` : 'ບໍ່ມີ'}</span></div>
          <div className="flex justify-between"><span>ເວລາເຂົ້າ:</span><span className="font-bold">{new Date(result.checkInAt).toLocaleString('lo-LA')}</span></div>
          {(result as any).notes && (
            <div className="flex justify-between"><span>ໝາຍເຫດ:</span><span className="font-bold">{(result as any).notes}</span></div>
          )}
        </div>

        {/* Amount (if prepaid) */}
        {(result as any).prepaidAmount ? (
          <>
            <div className="border-t border-dashed border-gray-300 my-3"></div>
            <div className="text-center my-3 p-3 bg-gray-50 rounded-none border border-gray-100">
              <div className="text-[12px] text-gray-500 mb-1">ຄ່າບໍລິການຈ່າຍແລ້ວ</div>
              <div className="text-3xl font-bold text-emerald-500 leading-none">{new Intl.NumberFormat('lo-LA').format(Number((result as any).prepaidAmount))} ₭</div>
            </div>
          </>
        ) : <div className="border-t border-dashed border-gray-300 my-3"></div>}

        {/* 2 QR Codes */}
        <div className="flex justify-between gap-3 my-4">
          {qrPaymentImage && (result as any).prepaidAmount ? (
            <div className="flex-1 text-center">
              <span className="text-[11px] font-bold block mb-1.5 text-gray-800 tracking-wide">QR PAYMENT</span>
              <div className="flex justify-center">
                <img src={qrPaymentImage.startsWith('http') ? qrPaymentImage : `${API_URL}${qrPaymentImage}`} className="w-[95px] h-[95px] object-contain rounded-none border border-gray-100 p-1" alt="QR Pay" />
              </div>
            </div>
          ) : (
            <div className="flex-1"></div> /* Spacer if no QR Payment */
          )}

          <div className="flex-1 text-center">
            <span className="text-[11px] font-bold block mb-1.5 text-gray-800 tracking-wide">CHECK-OUT</span>
            <div className="flex justify-center">
              <div className="p-1 border border-gray-100 rounded-none bg-white">
                <QRCodeSVG value={result.qrCodeData || result.ticketNumber} size={85} level="M" />
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-dashed border-gray-300 my-3"></div>

        <div className="text-center text-[12px] mt-2 text-gray-500 leading-snug">
          ກະລຸນາເກັບໃບບິນນີ້ໄວ້ເພື່ອສະແກນອອກ<br />
          {receiptFooter}
        </div>
      </div>

      {/* Buttons */}
      <div className="flex gap-3 mt-6 px-2 justify-center max-w-[320px] mx-auto">
        <button onClick={() => toast.success('🖨️ Printing...')} className="flex-[1.2] bg-emerald-500 text-white rounded-none py-3.5 px-3 font-bold text-[15px] flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 active:scale-95 transition-transform hover:bg-emerald-600">
          <Printer size={20} /> ພິມໃບບິນ
        </button>
        <button onClick={reset} className="flex-1 bg-white text-gray-700 border border-gray-200 rounded-none py-3.5 px-3 font-bold text-[15px] flex items-center justify-center gap-2 shadow-sm active:scale-95 transition-transform hover:bg-gray-50">
          <RotateCcw size={20} /> ຄັນຕໍ່ໄປ
        </button>
      </div>
    </div>
  );
  return (
    <div className="w-full">
      <div className="mb-6">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900">ລົດເຂົ້າ (Check in)</h1>
        <p className="text-gray-500 mt-1">ເລືອກປະເພດລົດແລ້ວກົດ Check-in</p>
      </div>
      {/* Vehicle Types */}
      <div className="bg-[#FF1083] p-6 mb-4">
        <p className="text-sm font-bold text-gray-900 mb-4 uppercase tracking-wider">1.ເລືອກປະເພດລົດ</p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[...types]
            .sort((a, b) => {
              const order = ['motorcycle', 'ev_motorcycle', 'car', 'truck'];
              return order.indexOf(a.name) - order.indexOf(b.name);
            })
            .map(vt => (
              <button key={vt.id} onClick={() => setSelType(vt.id)}
                className={`vehicle-card ${selType === vt.id ? 'selected' : ''}`}>
                <div className="text-3xl mb-2 flex justify-center">{icons[vt.name] || <Car size={40} />}</div>
                <span className="text-sm font-medium">{vt.label}</span>
              </button>
            ))}
        </div>
      </div>

      {/* Plate — Redesigned */}
      <div className="glass-card p-6 mb-4">
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm font-bold text-gray-900 uppercase tracking-wider">2.ທະບຽນລົດ</p>
          <button
            type="button"
            onClick={toggleNoPlate}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-none text-sm font-bold transition-all duration-200 ${noPlate
              ? 'bg-[#F59E0B] text-white shadow-md shadow-amber-500/30'
              : 'bg-[#F59E0B] text-white shadow-md shadow-amber-500/20 hover:bg-[#D97706]'
              }`}
          >
            <Ban size={18} />
            ບໍ່ມີປ້າຍທະບຽນ
          </button>
        </div>

        {noPlate ? (
          <div className="py-6 bg-gray-50 rounded-none border-2 border-dashed border-amber-300">
            <div className="text-center mb-4">
              <Ban size={48} className="mx-auto text-amber-400 mb-3" />
              <p className="text-gray-500 font-bold text-lg">ບໍ່ມີປ້າຍທະບຽນລົດ</p>
              <p className="text-gray-400 text-sm mt-1">ລົດຄັນນີ້ຈະ check-in ໂດຍບໍ່ມີຂໍ້ມູນທະບຽນ</p>
            </div>
            {/* Comment / Notes */}
            <div className="px-6 mt-4">
              <label className="flex items-center gap-2 text-sm font-bold text-gray-500 mb-2">
                <MessageSquare size={16} className="text-amber-500" />
                ໝາຍເຫດ / Comment
              </label>
              <textarea
                value={notes}
                onChange={e => setNotes(e.target.value)}
                placeholder="ເຊັ່ນ: ລົດສີແດງ, ລົດກະບະ, ຈອດໃກ້ທາງເຂົ້າ..."
                className="w-full px-4 py-3 rounded-none border-2 border-amber-300 bg-white text-gray-800 text-base focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-amber-400 placeholder-gray-400 resize-none transition-all"
                rows={2}
                maxLength={20}
              />
              <p className="text-xs text-gray-400 mt-1 text-right">{notes.length}/20</p>
            </div>
          </div>
        ) : (
          <>
            <div className="flex flex-col w-full">
              {/* ເລກທະບຽນລົດ */}
              <div className="mb-4">
                <label className="block text-lg text-gray-800 mb-2 font-medium">ເລກທະບຽນລົດ</label>
                <input
                  value={plate}
                  onChange={e => setPlate(e.target.value.replace(/\D/g, '').slice(0, 4))}
                  className="w-full px-4 py-4 rounded-none shadow-md border border-transparent text-white text-3xl font-bold tracking-[0.2em] focus:outline-none focus:ring-2 focus:ring-red-400 placeholder-white/70"
                  style={{ backgroundColor: '#F05252' }}
                  readOnly
                />
              </div>

              {/* Number pad */}
              <div className="grid grid-cols-6 gap-2 mb-6 w-full">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(n => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => handleNumPad(String(n))}
                    className="flex items-center justify-center h-16 sm:h-20 md:h-24 rounded-none bg-[#1D8BCF] hover:bg-[#1A7AB5] text-white font-normal text-2xl md:text-3xl shadow active:scale-95 transition-all w-full"
                  >
                    {n}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => handleNumPad('0')}
                  className="flex items-center justify-center h-16 sm:h-20 md:h-24 rounded-none bg-[#1D8BCF] hover:bg-[#1A7AB5] text-white font-normal text-2xl md:text-3xl shadow active:scale-95 transition-all w-full"
                >
                  0
                </button>
                <button
                  type="button"
                  onClick={handleNumPadBackspace}
                  className="flex items-center justify-center h-16 sm:h-20 md:h-24 rounded-none bg-[#EE9B00] hover:bg-[#D48A00] text-white shadow active:scale-95 transition-all w-full"
                >
                  <Delete size={28} />
                </button>
                <button
                  type="button"
                  onClick={handleNumPadClear}
                  className="flex items-center justify-center h-16 sm:h-20 md:h-24 rounded-none bg-[#EB4A4A] hover:bg-[#D13E3E] text-white font-bold text-lg shadow active:scale-95 transition-all w-full"
                >
                  CLR
                </button>
              </div>

              {/* ຕົວອັກສອນ */}
              <div className="mb-4">
                <label className="block text-lg text-gray-800 mb-2 font-medium">ຕົວອັກສອນ</label>
                <input
                  value={plateLetters}
                  onChange={e => setPlateLetters(e.target.value.replace(/\d/g, '').toUpperCase())}
                  className="w-full px-4 py-4 rounded-none shadow-md border border-transparent text-white text-2xl font-bold focus:outline-none focus:ring-2 focus:ring-red-400 placeholder-white/70"
                  style={{ backgroundColor: '#F05252' }}
                  maxLength={2}
                />
              </div>

              {/* ແຂວງ */}
              <div className="mb-2">
                <label className="block text-lg text-gray-800 mb-2 font-medium">ແຂວງ</label>
                <select
                  value={plateProv}
                  onChange={e => setPlateProv(e.target.value)}
                  className="w-full px-4 py-4 rounded-none shadow-md border border-transparent text-white text-xl font-bold cursor-pointer appearance-none focus:outline-none focus:ring-2 focus:ring-red-400"
                  style={{ backgroundColor: '#F05252' }}
                >
                  <option value="" className="text-gray-900 bg-white">-- ເລືອກ --</option>
                  {laosProvinces.map(p => <option key={p} value={p} className="text-gray-900 bg-white">{p}</option>)}
                </select>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Price Preview */}
      {selType && (
        <div className="bg-[#AF1E62] px-5 py-4 mb-4 rounded-none flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-2 text-white font-bold text-xl md:text-2xl">
            <span className="drop-shadow-sm">ລວມເປັນເງິນ :</span>
          </div>
          <div className="text-white font-bold text-2xl md:text-3xl drop-shadow-sm">
            {loadingPrice ? (
              <span className="animate-pulse text-lg">ກຳລັງໂຫຼດ...</span>
            ) : previewPrice !== null ? (
              `${new Intl.NumberFormat('lo-LA').format(previewPrice)} ₭`
            ) : (
              '—'
            )}
          </div>
        </div>
      )}

      <button onClick={handleCheckIn} disabled={!selType || loading}
        className="w-full bg-[#14B8A6] hover:bg-[#0D9488] text-white font-bold text-xl md:text-2xl py-4 rounded-xl shadow-md active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center tracking-wide gap-3">
        {loading ? '⏳ ກຳລັງປະມວນຜົນ...' : <><Check size={28} className="stroke-[3.5px]" /> ລົດເຂົ້າ (Check-in)</>}
      </button>
    </div>
  );
}
