// PARKO — Check-in Page (Fast 1-2 click)
import React, { useState, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Car, Bike, Zap, Truck, Printer, Check, RotateCcw, Delete, Ban } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../api/client';
import type { VehicleType, ParkingTicket } from '../../types';

const icons: Record<string, React.ReactNode> = {
  car: <Car size={40} />, motorcycle: <Bike size={40} />,
  ev_motorcycle: <Zap size={40} />, truck: <Truck size={40} />,
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
  const [pType, setPType] = useState('HOURLY');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ParkingTicket | null>(null);

  useEffect(() => {
    api.get('/pricing/vehicle-types').then(r => setTypes(r.data.data || r.data)).catch(() => toast.error('Load failed'));
  }, []);

  /* Number-pad handler: append digit to plate number */
  const handleNumPad = (digit: string) => {
    if (plate.length < 4) setPlate(prev => prev + digit);
  };
  const handleNumPadClear = () => setPlate('');
  const handleNumPadBackspace = () => setPlate(prev => prev.slice(0, -1));

  const toggleNoPlate = () => {
    setNoPlate(prev => {
      if (!prev) { setPlate(''); setPlateLetters(''); setPlateProv(''); setPlateColor('white'); }
      else { setPlateProv('ນະຄອນຫລວງ'); }
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
      });
      const t = data.data || data;
      setResult(t);
      toast.success(`ສຳເລັດ! Ticket: ${t.ticketNumber}`);
    } catch (e: any) { toast.error(e.response?.data?.message || 'Failed'); }
    finally { setLoading(false); }
  };

  const reset = () => { setSelType(null); setPlate(''); setPlateLetters(''); setPlateProv('ນະຄອນຫລວງ'); setPlateColor('white'); setNoPlate(false); setResult(null); };

  if (result) return (
    <div className="max-w-lg mx-auto animate-scale-in">
      <div className="glass-card p-6 md:p-8 text-center">
        <div className="w-16 h-16 mx-auto rounded-full gradient-success flex items-center justify-center mb-4 shadow-lg shadow-accent-500/30">
          <Check className="w-8 h-8 text-white" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-1">ລົດເຂົ້າສຳເລັດ!</h2>
        <p className="text-gray-500 text-sm mb-6">Check-in Successful</p>
        <div className="bg-gray-50 rounded-xl p-5 mb-6 text-left space-y-3 border border-gray-100">
          {[
            ['Ticket #', result.ticketNumber],
            ['ປະເພດລົດ', result.vehicleType?.label],
            ['ທະບຽນ', result.plateNumber ? `${result.plateProvince || ''} ${result.plateNumber}` : 'ບໍ່ມີ'],
            ['ເວລາເຂົ້າ', new Date(result.checkInAt).toLocaleString()],
          ].map(([l, v]) => (
            <div key={l as string} className="flex justify-between">
              <span className="text-gray-500">{l}</span>
              <span className="text-gray-900 font-bold">{v}</span>
            </div>
          ))}
        </div>
        <div className="bg-white p-4 rounded-xl inline-block mb-6">
          <QRCodeSVG value={result.qrCodeData || result.ticketNumber} size={180} level="H" />
        </div>
        <div className="flex gap-3">
          <button onClick={() => toast.success('🖨️ Printing...')} className="btn-primary flex-1 flex items-center justify-center gap-2">
            <Printer size={20} /> ພິມໃບບິນ
          </button>
          <button onClick={reset} className="btn-secondary flex-1 flex items-center justify-center gap-2">
            <RotateCcw size={20} /> ຄັນຕໍ່ໄປ
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="w-full">
      <div className="mb-6">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900">ລົດເຂົ້າ (Check-in)</h1>
        <p className="text-gray-500 mt-1">ເລືອກປະເພດລົດແລ້ວກົດ Check-in</p>
      </div>
      {/* Vehicle Types */}
      <div className="glass-card p-6 mb-4">
        <p className="text-sm font-bold text-gray-400 mb-4 uppercase tracking-wider">1.ເລືອກປະເພດລົດ</p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {types.map(vt => (
            <button key={vt.id} onClick={() => setSelType(vt.id)}
              className={`vehicle-card ${selType === vt.id ? 'selected' : ''}`}>
              <div className="text-3xl mb-2">{icons[vt.name] || <Car size={40} />}</div>
              <span className="text-sm font-medium">{vt.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Plate — Redesigned */}
      <div className="glass-card p-6 mb-4">
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm font-bold text-gray-400 uppercase tracking-wider">2.ທະບຽນລົດ</p>
          <button
            type="button"
            onClick={toggleNoPlate}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all duration-200 ${noPlate
                ? 'bg-red-500 text-white shadow-md shadow-red-500/20'
                : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
              }`}
          >
            <Ban size={18} />
            ບໍ່ມີປ້າຍທະບຽນ
          </button>
        </div>

        {noPlate ? (
          <div className="flex items-center justify-center py-10 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200">
            <div className="text-center">
              <Ban size={48} className="mx-auto text-gray-300 mb-3" />
              <p className="text-gray-400 font-bold text-lg">ບໍ່ມີປ້າຍທະບຽນລົດ</p>
              <p className="text-gray-300 text-sm mt-1">ລົດຄັນນີ້ຈະ check-in ໂດຍບໍ່ມີຂໍ້ມູນທະບຽນ</p>
            </div>
          </div>
        ) : (
          <>
            {/* Input fields row */}
            <div className="flex gap-3 mb-5">
              {/* ເລກທະບຽນລົດ */}
              <div className="flex-[2]">
                <label className="block text-sm font-bold text-gray-700 mb-1.5">ເລກທະບຽນລົດ</label>
                <input
                  value={plate}
                  onChange={e => setPlate(e.target.value.replace(/\D/g, '').slice(0, 4))}
                  className="w-full px-4 py-3 rounded-xl text-center font-bold text-xl tracking-[0.25em] border-2 border-amber-100 bg-amber-50/60 text-gray-900 focus:outline-none focus:ring-2 focus:ring-sky-400 focus:border-sky-400 transition-all"
                  placeholder="0000"
                  readOnly
                />
              </div>
              {/* ຕົວອັກສອນ */}
              <div className="flex-1">
                <label className="block text-sm font-bold text-gray-700 mb-1.5">ຕົວອັກສອນ</label>
                <input
                  value={plateLetters}
                  onChange={e => setPlateLetters(e.target.value.toUpperCase())}
                  className="w-full px-3 py-3 rounded-xl text-center font-bold text-xl uppercase border-2 border-amber-100 bg-amber-50/60 text-gray-900 focus:outline-none focus:ring-2 focus:ring-sky-400 focus:border-sky-400 transition-all"
                  placeholder="ກກ"
                  maxLength={4}
                />
              </div>
              {/* ແຂວງ */}
              <div className="flex-[2]">
                <label className="block text-sm font-bold text-gray-700 mb-1.5">ແຂວງ</label>
                <select
                  value={plateProv}
                  onChange={e => setPlateProv(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl text-center font-bold text-base border-2 border-amber-100 bg-amber-50/60 text-gray-900 cursor-pointer appearance-none focus:outline-none focus:ring-2 focus:ring-sky-400 focus:border-sky-400 transition-all"
                >
                  <option value="">-- ເລືອກ --</option>
                  {laosProvinces.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>
            </div>

            {/* Number pad + Color selection */}
            <div className="flex gap-6">
              {/* Number pad (left) */}
              <div className="grid grid-cols-3 gap-2.5" style={{ width: '240px' }}>
                {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(n => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => handleNumPad(String(n))}
                    className="numpad-btn"
                  >
                    {n}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => handleNumPad('0')}
                  className="numpad-btn"
                >
                  0
                </button>
                <button
                  type="button"
                  onClick={handleNumPadBackspace}
                  className="numpad-btn !bg-amber-400 hover:!bg-amber-500 !text-white"
                >
                  <Delete size={22} />
                </button>
                <button
                  type="button"
                  onClick={handleNumPadClear}
                  className="numpad-btn !bg-red-400 hover:!bg-red-500 !text-white text-sm"
                >
                  CLR
                </button>
              </div>

              {/* Plate color selection (right) */}
              <div className="flex-1 flex flex-col justify-end">
                <label className="block text-sm font-bold text-gray-700 mb-2">ສີປ້າຍລົດ</label>
                <div className="flex gap-2 flex-wrap">
                  {plateColors.map(c => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => setPlateColor(c.id)}
                      className={`plate-color-btn ${plateColor === c.id ? 'ring-2 ring-offset-2 ring-sky-500 scale-105' : ''}`}
                      style={{
                        backgroundColor: c.bg,
                        color: c.text,
                        borderColor: c.border,
                      }}
                    >
                      {c.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Parking Type */}
      <div className="glass-card p-6 mb-6">
        <p className="text-sm font-bold text-gray-400 mb-4 uppercase tracking-wider">3.ປະເພດການຈອດ</p>
        <div className="flex flex-wrap gap-2">
          {[['HOURLY', 'ລາຍຊົ່ວໂມງ'], ['DAILY', 'ລາຍມື້'], ['WEEKLY', 'ລາຍອາທິດ'], ['MONTHLY', 'ລາຍເດືອນ']].map(([v, l]) => (
            <button key={v} onClick={() => setPType(v)}
              className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${pType === v ? 'bg-primary-500 text-white shadow-md shadow-primary-500/20' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}>
              {l}
            </button>
          ))}
        </div>
      </div>
      <button onClick={handleCheckIn} disabled={!selType || loading}
        className="btn-success w-full text-lg py-4 flex items-center justify-center gap-2 disabled:opacity-50">
        {loading ? '⏳' : <><Check size={24} /> ລົດເຂົ້າ (Check-in)</>}
      </button>
    </div>
  );
}
