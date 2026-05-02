// PARKO — Check-in Page (Fast 1-2 click)
import React, { useState, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Car, Bike, Zap, Truck, Printer, Check, RotateCcw } from 'lucide-react';
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

export default function CheckIn() {
  const [types, setTypes] = useState<VehicleType[]>([]);
  const [selType, setSelType] = useState<number | null>(null);
  const [plate, setPlate] = useState('');
  const [plateLetters, setPlateLetters] = useState('');
  const [plateProv, setPlateProv] = useState('ນະຄອນຫລວງ');
  const [pType, setPType] = useState('HOURLY');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ParkingTicket | null>(null);

  useEffect(() => {
    api.get('/pricing/vehicle-types').then(r => setTypes(r.data.data || r.data)).catch(() => toast.error('Load failed'));
  }, []);

  const handleCheckIn = async () => {
    if (!selType) return toast.error('ກະລຸນາເລືອກປະເພດລົດ');
    setLoading(true);
    try {
      const finalPlateNumber = (plateLetters + ' ' + plate).trim();
      const { data } = await api.post('/parking/check-in', {
        vehicleTypeId: selType,
        plateNumber: finalPlateNumber || undefined,
        plateProvince: plateProv || undefined,
        parkingType: pType,
      });
      const t = data.data || data;
      setResult(t);
      toast.success(`ສຳເລັດ! Ticket: ${t.ticketNumber}`);
    } catch (e: any) { toast.error(e.response?.data?.message || 'Failed'); }
    finally { setLoading(false); }
  };

  const reset = () => { setSelType(null); setPlate(''); setPlateLetters(''); setPlateProv('ນະຄອນຫລວງ'); setResult(null); };

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
    <div className="max-w-2xl mx-auto">
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
      {/* Plate */}
      <div className="glass-card p-6 mb-4">
        <p className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4">2.ທະບຽນລົດ</p>

        <div className="flex gap-2">
          <div className="w-2/5">
            <label className="block text-xs font-bold text-gray-500 mb-1">ແຂວງ</label>
            <select
              value={plateProv}
              onChange={e => setPlateProv(e.target.value)}
              className="input-field text-center font-bold text-sm bg-gray-50 cursor-pointer appearance-none"
            >
              <option value="">-- ເລືອກ --</option>
              {laosProvinces.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>
          <div className="w-1/5">
            <label className="block text-xs font-bold text-gray-500 mb-1">ຕົວອັກສອນ</label>
            <input
              value={plateLetters}
              onChange={e => setPlateLetters(e.target.value.toUpperCase())}
              className="input-field text-center font-bold text-lg uppercase bg-yellow-50 focus:bg-white text-gray-900 border-yellow-200 focus:border-primary-500 px-1"
              placeholder="ກກ"
              maxLength={4}
            />
          </div>
          <div className="w-2/5">
            <label className="block text-xs font-bold text-gray-500 mb-1">ເລກທະບຽນ</label>
            <input
              value={plate}
              onChange={e => setPlate(e.target.value)}
              className="input-field text-center font-bold text-lg tracking-widest bg-yellow-50 focus:bg-white text-gray-900 border-yellow-200 focus:border-primary-500"
              placeholder="1234"
              type="number"
              maxLength={4}
            />
          </div>
        </div>
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
