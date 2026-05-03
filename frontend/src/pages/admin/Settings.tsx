import React, { useState, useEffect } from 'react';
import { Settings as SettingsIcon, Save, Upload, DollarSign, Pencil, X, AlertTriangle, Info, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../api/client';

function Pricing() {
  const [rules, setRules] = useState<any[]>([]);
  const [editing, setEditing] = useState<string | null>(null);
  const [dailyRate, setDailyRate] = useState('');
  const [weeklyRate, setWeeklyRate] = useState('');
  const [monthlyRate, setMonthlyRate] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [loadingData, setLoadingData] = useState(true);

  const load = async () => {
    setLoadingData(true);
    try {
      const { data } = await api.get('/pricing');
      setRules(data.data || data);
    } catch {
      toast.error('ໂຫຼດຂໍ້ມູນລາຄາລົ້ມເຫຼວ');
    } finally {
      setLoadingData(false);
    }
  };

  useEffect(() => { load(); }, []);

  const startEdit = (r: any) => {
    setEditing(r.id);
    setDailyRate(String(Number(r.dailyRate)));
    setWeeklyRate(String(Number(r.weeklyRate)));
    setMonthlyRate(String(Number(r.monthlyRate)));
    setErrors({});
  };

  const cancelEdit = () => {
    setEditing(null);
    setErrors({});
  };

  const validate = (): boolean => {
    const errs: Record<string, string> = {};
    if (!dailyRate || dailyRate.trim() === '') errs.dailyRate = 'ຫ້າມເປັນຄ່າວ່າງ';
    else if (Number(dailyRate) < 0) errs.dailyRate = 'ຫ້າມຕິດລົບ';

    if (!weeklyRate || weeklyRate.trim() === '') errs.weeklyRate = 'ຫ້າມເປັນຄ່າວ່າງ';
    else if (Number(weeklyRate) < 0) errs.weeklyRate = 'ຫ້າມຕິດລົບ';

    if (!monthlyRate || monthlyRate.trim() === '') errs.monthlyRate = 'ຫ້າມເປັນຄ່າວ່າງ';
    else if (Number(monthlyRate) < 0) errs.monthlyRate = 'ຫ້າມຕິດລົບ';

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const save = async (id: string) => {
    if (!validate()) {
      toast.error('ກະລຸນາກວດສອບຂໍ້ມູນ');
      return;
    }
    setSaving(true);
    try {
      await api.patch(`/pricing/${id}`, {
        dailyRate: Number(dailyRate),
        weeklyRate: Number(weeklyRate),
        monthlyRate: Number(monthlyRate),
      });
      toast.success('✅ ບັນທຶກລາຄາສຳເລັດແລ້ວ!');
      setEditing(null);
      setErrors({});
      await load();
    } catch (e: any) {
      console.error('Save error:', e?.response?.data);
      toast.error(e?.response?.data?.message || 'ບັນທຶກລົ້ມເຫຼວ');
    } finally {
      setSaving(false);
    }
  };

  const fmt = (n: number) => new Intl.NumberFormat('lo-LA').format(n);

  if (loadingData) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <Loader2 size={40} className="text-emerald-500 animate-spin mb-4" />
        <p className="text-gray-400 font-medium">ກຳລັງໂຫຼດຂໍ້ມູນລາຄາ...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {rules.map(r => {
        const isEditing = editing === r.id;

        return (
          <div key={r.id} className="glass-card p-6">
            {/* Card Header */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <span className="text-3xl">{r.vehicleType?.icon}</span>
                <div>
                  <h3 className="text-lg font-bold text-gray-900">{r.vehicleType?.label}</h3>
                  <p className="text-xs text-gray-500">{r.vehicleType?.description}</p>
                </div>
              </div>

              {!isEditing ? (
                <button
                  onClick={() => startEdit(r)}
                  className="btn-secondary text-sm flex items-center gap-2 !py-2 !px-4"
                >
                  <Pencil size={14} /> ແກ້ໄຂ
                </button>
              ) : (
                <button
                  onClick={cancelEdit}
                  className="btn-secondary text-sm flex items-center gap-2 !py-2 !px-4 !bg-gray-100 !border-transparent hover:!bg-gray-200"
                >
                  <X size={14} /> ຍົກເລີກ
                </button>
              )}
            </div>

            {/* Card Body */}
            {isEditing ? (
              <>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Daily */}
                  <div>
                    <label className="text-xs font-bold text-gray-600 mb-1 block">ລາຍມື້ (Day)</label>
                    <div className="relative">
                      <input
                        type="number"
                        value={dailyRate}
                        onChange={e => { setDailyRate(e.target.value); if (errors.dailyRate) { const n = { ...errors }; delete n.dailyRate; setErrors(n); } }}
                        min={0}
                        className={`input-field font-bold ${errors.dailyRate ? '!border-red-400 !bg-red-50' : ''}`}
                        placeholder="0"
                      />
                      <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold">₭</span>
                    </div>
                    {errors.dailyRate && <p className="text-xs text-red-500 mt-1">{errors.dailyRate}</p>}
                  </div>

                  {/* Weekly */}
                  <div>
                    <label className="text-xs font-bold text-gray-600 mb-1 block">ລາຍອາທິດ (Week)</label>
                    <div className="relative">
                      <input
                        type="number"
                        value={weeklyRate}
                        onChange={e => { setWeeklyRate(e.target.value); if (errors.weeklyRate) { const n = { ...errors }; delete n.weeklyRate; setErrors(n); } }}
                        min={0}
                        className={`input-field font-bold ${errors.weeklyRate ? '!border-red-400 !bg-red-50' : ''}`}
                        placeholder="0"
                      />
                      <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold">₭</span>
                    </div>
                    {errors.weeklyRate && <p className="text-xs text-red-500 mt-1">{errors.weeklyRate}</p>}
                  </div>

                  {/* Monthly */}
                  <div>
                    <label className="text-xs font-bold text-gray-600 mb-1 block">ລາຍເດືອນ (Month)</label>
                    <div className="relative">
                      <input
                        type="number"
                        value={monthlyRate}
                        onChange={e => { setMonthlyRate(e.target.value); if (errors.monthlyRate) { const n = { ...errors }; delete n.monthlyRate; setErrors(n); } }}
                        min={0}
                        className={`input-field font-bold ${errors.monthlyRate ? '!border-red-400 !bg-red-50' : ''}`}
                        placeholder="0"
                      />
                      <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold">₭</span>
                    </div>
                    {errors.monthlyRate && <p className="text-xs text-red-500 mt-1">{errors.monthlyRate}</p>}
                  </div>
                </div>

                <button
                  onClick={() => save(r.id)}
                  disabled={saving}
                  className="btn-primary text-sm flex items-center gap-2 mt-5 disabled:opacity-50"
                >
                  {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                  ບັນທຶກລາຄາ
                </button>
              </>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="text-xs font-bold text-gray-600 mb-1 block">ລາຍມື້ (Day)</label>
                  <div className="input-field bg-gray-50 border-gray-100 text-gray-600 font-bold flex justify-between">
                    <span>{fmt(Number(r.dailyRate))}</span>
                    <span className="text-gray-400">₭</span>
                  </div>
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-600 mb-1 block">ລາຍອາທິດ (Week)</label>
                  <div className="input-field bg-gray-50 border-gray-100 text-gray-600 font-bold flex justify-between">
                    <span>{fmt(Number(r.weeklyRate))}</span>
                    <span className="text-gray-400">₭</span>
                  </div>
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-600 mb-1 block">ລາຍເດືອນ (Month)</label>
                  <div className="input-field bg-gray-50 border-gray-100 text-gray-600 font-bold flex justify-between">
                    <span>{fmt(Number(r.monthlyRate))}</span>
                    <span className="text-gray-400">₭</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

export default function Settings() {
  const [settings, setSettings] = useState<any[]>([]);
  const [parkingName, setParkingName] = useState('');
  const [parkingSub, setParkingSub] = useState('');
  const [receiptFooter, setReceiptFooter] = useState('');
  const [printerType, setPrinterType] = useState('bluetooth');

  const load = async () => {
    try {
      const { data } = await api.get('/settings');
      const s = data.data || data;
      setSettings(s);
      const pn = s.find((x: any) => x.key === 'parking_name');
      if (pn) { setParkingName(pn.value.name || ''); setParkingSub(pn.value.subtitle || ''); }
      const rf = s.find((x: any) => x.key === 'receipt_footer');
      if (rf) setReceiptFooter(rf.value.text || '');
      const pc = s.find((x: any) => x.key === 'printer_config');
      if (pc) setPrinterType(pc.value.type || 'bluetooth');
    } catch { }
  };
  useEffect(() => { load(); }, []);

  const saveSetting = async (key: string, value: any, desc: string) => {
    try {
      await api.post('/settings', { key, value, description: desc });
      toast.success('ບັນທຶກສຳເລັດ');
      load();
    } catch { toast.error('Failed'); }
  };

  const uploadQR = async (file: File) => {
    const fd = new FormData(); fd.append('file', file);
    try {
      const { data } = await api.post('/upload', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      const url = (data.data || data).url;
      await saveSetting('qr_payment_image', { url, enabled: true }, 'QR Payment Image');
      toast.success('QR Payment ອັບໂຫລດສຳເລັດ');
      await load();
    } catch (e: any) {
      console.error('QR upload error:', e?.response?.data || e);
      toast.error(e?.response?.data?.message || 'Upload failed');
    }
  };

  const uploadLogo = async (file: File) => {
    const fd = new FormData(); fd.append('file', file);
    try {
      const { data } = await api.post('/upload', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      const url = (data.data || data).url;
      await saveSetting('parking_logo', { url, enabled: true }, 'Parking Logo');
      toast.success('Logo ອັບໂຫລດສຳເລັດ');
      await load();
    } catch (e: any) {
      console.error('Logo upload error:', e?.response?.data || e);
      toast.error(e?.response?.data?.message || 'Upload failed');
    }
  };

  const API_URL = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:3000';
  const logoUrl = settings.find((x: any) => x.key === 'parking_logo')?.value?.url;
  const qrUrl = settings.find((x: any) => x.key === 'qr_payment_image')?.value?.url;

  const imgSrc = (url: string) => url.startsWith('http') ? url : `${API_URL}${url}`;

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 flex items-center gap-3">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">ຕັ້ງຄ່າລະບົບ</h1>
        </h1>
        <p className="text-gray-500 mt-1">ຕັ້ງຄ່າລາຄາ, ຂໍ້ມູນບ່ອນຈອດລົດ, Logo, QR Code, ໃບບິນ, Printer</p>
      </div>

      {/* Pricing Settings injected at the top */}
      <div className="mb-10">
        <Pricing />
      </div>

      <div className="space-y-4">
        {/* Parking Name */}
        <div className="glass-card p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4">🏢 ຊື່ລານຈອດລົດ</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-gray-600 mb-1 block">ຊື່ (ພາສາອັງກິດ)</label>
              <input value={parkingName} onChange={e => setParkingName(e.target.value)} className="input-field" />
            </div>
            <div>
              <label className="text-xs font-bold text-gray-600 mb-1 block">ຊື່ (ພາສາລາວ)</label>
              <input value={parkingSub} onChange={e => setParkingSub(e.target.value)} className="input-field" />
            </div>
          </div>
          <button onClick={() => saveSetting('parking_name', { name: parkingName, subtitle: parkingSub }, 'Parking name')}
            className="btn-primary mt-4 w-fit text-sm flex items-center gap-2"><Save size={16} /> ບັນທຶກ</button>
        </div>
        {/* Logo & QR */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="glass-card p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">🖼️ Logo</h3>
            <label className="flex items-center gap-6 cursor-pointer group">
              {logoUrl ? (
                <div className="relative w-24 h-24 rounded-xl border-2 border-gray-200 overflow-hidden bg-white group-hover:border-primary-400 transition-colors">
                  <img src={imgSrc(logoUrl)} className="w-full h-full object-contain p-2" alt="Logo" />
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <Pencil className="text-white w-6 h-6" />
                  </div>
                </div>
              ) : (
                <div className="w-24 h-24 rounded-xl border-2 border-dashed border-gray-200 flex items-center justify-center bg-gray-50 group-hover:bg-gray-100 transition-colors">
                  <div className="text-center"><Upload className="mx-auto text-gray-400" /><p className="text-xs font-bold text-gray-500 mt-2">ອັບໂຫລດ Logo</p></div>
                </div>
              )}
              <div className="text-sm text-gray-500">
                <p className="font-bold text-gray-700 mb-1">ປ່ຽນຮູບ Logo</p>
                <p className="text-xs">ຮອງຮັບ PNG, JPG ຂະໜາດນ້ອຍ</p>
              </div>
              <input type="file" accept="image/*" className="hidden" onChange={e => e.target.files?.[0] && uploadLogo(e.target.files[0])} />
            </label>
          </div>
          <div className="glass-card p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">💳 QR Payment</h3>
            <label className="flex items-center gap-6 cursor-pointer group">
              {qrUrl ? (
                <div className="relative w-32 h-32 rounded-xl border-2 border-gray-200 overflow-hidden bg-white group-hover:border-primary-400 transition-colors">
                  <img src={imgSrc(qrUrl)} className="w-full h-full object-contain p-2" alt="QR Payment" />
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <Pencil className="text-white w-8 h-8" />
                  </div>
                </div>
              ) : (
                <div className="w-32 h-32 rounded-xl border-2 border-dashed border-gray-200 flex items-center justify-center bg-gray-50 group-hover:bg-gray-100 transition-colors">
                  <div className="text-center"><Upload className="mx-auto text-gray-400" /><p className="text-xs font-bold text-gray-500 mt-2">ອັບໂຫລດ QR Payment</p></div>
                </div>
              )}
              <div className="text-sm text-gray-500">
                <p className="font-bold text-gray-700 mb-1">ປ່ຽນຮູບ QR Code</p>
                <p className="text-xs">ສຳລັບສະແກນຈ່າຍເງິນ</p>
              </div>
              <input type="file" accept="image/*" className="hidden" onChange={e => e.target.files?.[0] && uploadQR(e.target.files[0])} />
            </label>
          </div>
        </div>
        {/* Receipt Footer */}
        <div className="glass-card p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4">🧾 ໃບບິນ</h3>
          <label className="text-xs font-bold text-gray-600 mb-1 block">Footer ໃບບິນ</label>
          <input value={receiptFooter} onChange={e => setReceiptFooter(e.target.value)} className="input-field mb-4" />
          <button onClick={() => saveSetting('receipt_footer', { text: receiptFooter }, 'Receipt footer')}
            className="btn-primary text-sm flex items-center gap-2"><Save size={16} /> ບັນທຶກ</button>
        </div>
        {/* Printer */}
        <div className="glass-card p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4">🖨️ Printer</h3>
          <div className="flex gap-2 mb-4">
            {['USB', 'BLUETOOTH', 'NETWORK'].map(t => (
              <button key={t} onClick={() => setPrinterType(t.toLowerCase())}
                className={`px-6 py-3 rounded-2xl text-sm font-bold transition-all ${printerType === t.toLowerCase() ? 'bg-primary-500 text-white shadow-md shadow-primary-500/20' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                {t}
              </button>
            ))}
          </div>
          <button onClick={() => saveSetting('printer_config', { type: printerType, paperWidth: 58, encoding: 'UTF-8' }, 'Printer config')}
            className="btn-primary text-sm flex items-center gap-2"><Save size={16} /> ບັນທຶກ</button>
        </div>
      </div>
    </div>
  );
}
