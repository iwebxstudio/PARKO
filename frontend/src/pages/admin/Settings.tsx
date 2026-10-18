/**
 * ໂມດູນຫນ້າຕັ້ງຄ່າລະບົບ PARKO (System Settings Page)
 * ສ່ວນຕິດຕໍ່ຜູ້ໃຊ້ງານລະດັບຜູ້ບໍລິຫານ (Admin) ເພື່ອກຳນົດຄ່າອັດຕາຄ່າບໍລິການຈອດລົດແຍກຕາມປະເພດພາຫະນະ,
 * ຊື່ສະຖານທີ່, ໂລໂກ ແລະ QR Code ຮັບເງິນ, ຂໍ້ຄວາມທ້າຍໃບບິນ ແລະ ການເຊື່ອມຕໍ່ເຄື່ອງພິມໃບບິນ.
 */
import React, { useState, useEffect } from 'react';
import {
  Settings as SettingsIcon, Save, Upload, DollarSign,
  Pencil, X, AlertTriangle, Loader2, Printer, Store, Image, FileText
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../api/client';

function Pricing() {
  const [rules, setRules] = useState<any[]>([]);
  const [editing, setEditing] = useState<string | null>(null);
  const [dailyRate, setDailyRate] = useState('');
  const [weeklyRate, setWeeklyRate] = useState('');
  const [monthlyRate, setMonthlyRate] = useState('');
  const [yearlyRate, setYearlyRate] = useState('');
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
    setYearlyRate(String(Number(r.yearlyRate || 0)));
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

    if (!yearlyRate || yearlyRate.trim() === '') errs.yearlyRate = 'ຫ້າມເປັນຄ່າວ່າງ';
    else if (Number(yearlyRate) < 0) errs.yearlyRate = 'ຫ້າມຕິດລົບ';

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
        yearlyRate: Number(yearlyRate),
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
      <div className="flex flex-col items-center justify-center py-12 bg-white shadow-sm">
        <Loader2 size={36} className="text-[#F9A825] animate-spin mb-3" />
        <p className="text-gray-800 font-bold text-base md:text-[17px]">ກຳລັງໂຫຼດຂໍ້ມູນລາຄາ...</p>
      </div>
    );
  }

  return (
    <div className="space-y-3.5">
      {rules.map(r => {
        const isEditing = editing === r.id;

        return (
          <div
            key={r.id}
            className="bg-white shadow-[0_4px_14px_rgba(0,0,0,0.08)] border border-gray-200 rounded-none overflow-hidden transition-all hover:shadow-[0_8px_20px_rgba(0,0,0,0.12)]"
            style={{ borderRadius: 0 }}
          >
            {/* ແຖບຫົວກາດລາຄາ (Card Header) ສະແດງໄອຄອນ, ຊື່ປະເພດພາຫະນະ ແລະ ປຸ່ມແກ້ໄຂ */}
            <div
              className="bg-[#F8F9FA] px-4 py-3 border-b border-gray-200 flex items-center justify-between"
              style={{ borderRadius: 0 }}
            >
              <div className="flex items-center gap-3">
                <div
                  className="w-10 h-10 bg-white border border-gray-200 flex items-center justify-center text-2xl shrink-0 shadow-2xs"
                  style={{ borderRadius: 0 }}
                >
                  {r.vehicleType?.icon}
                </div>
                <div>
                  <h3 className="text-base md:text-[17px] font-bold text-gray-900 leading-tight">{r.vehicleType?.label}</h3>
                </div>
              </div>

              {!isEditing ? (
                <button
                  type="button"
                  onClick={() => startEdit(r)}
                  className="bg-[#F9A825] hover:bg-[#e0921a] active:bg-[#c97d10] text-black px-4 h-9 font-bold text-sm flex items-center gap-1.5 shadow-xs transition-all active:scale-95 cursor-pointer rounded-none border-0"
                  style={{ borderRadius: 0 }}
                >
                  <Pencil size={15} /> <span>ແກ້ໄຂ</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={cancelEdit}
                  className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-4 h-9 font-bold text-sm flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer rounded-none border-0"
                  style={{ borderRadius: 0 }}
                >
                  <X size={15} /> <span>ຍົກເລີກ</span>
                </button>
              )}
            </div>

            {/* ເນື້ອໃນກາດລາຄາ (Card Body) ສະແດງ ແລະ ແກ້ໄຂອັດຕາຄ່າຈອດລາຍວັນ, ລາຍອາທິດ, ລາຍເດືອນ, ລາຍປີ */}
            <div className="p-4">
              {isEditing ? (
                <div className="space-y-3.5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3.5">
                    {/* ອັດຕາຄ່າບໍລິການລາຍວັນ (Daily Rate) */}
                    <div className="bg-[#FAFBFD] p-3 border border-gray-200" style={{ borderRadius: 0 }}>
                      <div className="flex items-center justify-between mb-1.5">
                        <label className="text-xs font-bold text-gray-700">ລາຍມື້ (Day)</label>
                        <span className="text-[10px] font-black bg-[#B02019] text-white px-1.5 py-0.5 rounded-none" style={{ borderRadius: 0 }}>₭/DAY</span>
                      </div>
                      <input
                        type="number"
                        value={dailyRate}
                        onChange={e => {
                          setDailyRate(e.target.value);
                          if (errors.dailyRate) {
                            const n = { ...errors };
                            delete n.dailyRate;
                            setErrors(n);
                          }
                        }}
                        min={0}
                        className={`w-full h-10 px-3 bg-white border border-gray-300 font-bold text-base md:text-[17px] rounded-none focus:outline-none focus:border-[#B02019] ${
                          errors.dailyRate ? 'border-red-500 bg-red-50' : ''
                        }`}
                        style={{ borderRadius: 0 }}
                      />
                      {errors.dailyRate && <p className="text-xs font-bold text-red-600 mt-1">{errors.dailyRate}</p>}
                    </div>

                    {/* ອັດຕາຄ່າບໍລິການລາຍອາທິດ (Weekly Rate) */}
                    <div className="bg-[#FAFBFD] p-3 border border-gray-200" style={{ borderRadius: 0 }}>
                      <div className="flex items-center justify-between mb-1.5">
                        <label className="text-xs font-bold text-gray-700">ລາຍອາທິດ (Week)</label>
                        <span className="text-[10px] font-black bg-[#1D4ED8] text-white px-1.5 py-0.5 rounded-none" style={{ borderRadius: 0 }}>₭/WEEK</span>
                      </div>
                      <input
                        type="number"
                        value={weeklyRate}
                        onChange={e => {
                          setWeeklyRate(e.target.value);
                          if (errors.weeklyRate) {
                            const n = { ...errors };
                            delete n.weeklyRate;
                            setErrors(n);
                          }
                        }}
                        min={0}
                        className={`w-full h-10 px-3 bg-white border border-gray-300 font-bold text-base md:text-[17px] rounded-none focus:outline-none focus:border-[#B02019] ${
                          errors.weeklyRate ? 'border-red-500 bg-red-50' : ''
                        }`}
                        style={{ borderRadius: 0 }}
                      />
                      {errors.weeklyRate && <p className="text-xs font-bold text-red-600 mt-1">{errors.weeklyRate}</p>}
                    </div>

                    {/* ອັດຕາຄ່າບໍລິການລາຍເດືອນ (Monthly Rate) */}
                    <div className="bg-[#FAFBFD] p-3 border border-gray-200" style={{ borderRadius: 0 }}>
                      <div className="flex items-center justify-between mb-1.5">
                        <label className="text-xs font-bold text-gray-700">ລາຍເດືອນ (Month)</label>
                        <span className="text-[10px] font-black bg-[#0D9488] text-white px-1.5 py-0.5 rounded-none" style={{ borderRadius: 0 }}>₭/MONTH</span>
                      </div>
                      <input
                        type="number"
                        value={monthlyRate}
                        onChange={e => {
                          setMonthlyRate(e.target.value);
                          if (errors.monthlyRate) {
                            const n = { ...errors };
                            delete n.monthlyRate;
                            setErrors(n);
                          }
                        }}
                        min={0}
                        className={`w-full h-10 px-3 bg-white border border-gray-300 font-bold text-base md:text-[17px] rounded-none focus:outline-none focus:border-[#B02019] ${
                          errors.monthlyRate ? 'border-red-500 bg-red-50' : ''
                        }`}
                        style={{ borderRadius: 0 }}
                      />
                      {errors.monthlyRate && <p className="text-xs font-bold text-red-600 mt-1">{errors.monthlyRate}</p>}
                    </div>

                    {/* ອັດຕາຄ່າບໍລິການລາຍປີ (Yearly Rate) */}
                    <div className="bg-[#FAFBFD] p-3 border border-gray-200" style={{ borderRadius: 0 }}>
                      <div className="flex items-center justify-between mb-1.5">
                        <label className="text-xs font-bold text-gray-700">ລາຍປີ (Year)</label>
                        <span className="text-[10px] font-black bg-[#9333EA] text-white px-1.5 py-0.5 rounded-none" style={{ borderRadius: 0 }}>₭/YEAR</span>
                      </div>
                      <input
                        type="number"
                        value={yearlyRate}
                        onChange={e => {
                          setYearlyRate(e.target.value);
                          if (errors.yearlyRate) {
                            const n = { ...errors };
                            delete n.yearlyRate;
                            setErrors(n);
                          }
                        }}
                        min={0}
                        className={`w-full h-10 px-3 bg-white border border-gray-300 font-bold text-base md:text-[17px] rounded-none focus:outline-none focus:border-[#B02019] ${
                          errors.yearlyRate ? 'border-red-500 bg-red-50' : ''
                        }`}
                        style={{ borderRadius: 0 }}
                      />
                      {errors.yearlyRate && <p className="text-xs font-bold text-red-600 mt-1">{errors.yearlyRate}</p>}
                    </div>
                  </div>

                  <div className="flex justify-end gap-2 pt-3 border-t border-gray-100">
                    <button
                      type="button"
                      onClick={() => save(r.id)}
                      disabled={saving}
                      className="bg-[#B02019] hover:bg-[#961b15] active:bg-[#7d1611] text-white font-bold h-10 px-5 shadow-sm text-base md:text-[16px] flex items-center gap-2 transition-all active:scale-95 disabled:opacity-50 cursor-pointer rounded-none border-0"
                      style={{ borderRadius: 0 }}
                    >
                      {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                      <span>ບັນທຶກລາຄາ</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                  <div className="bg-[#FAFBFD] p-3.5 border border-gray-200 flex flex-col justify-between" style={{ borderRadius: 0 }}>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">ລາຍມື້ (Day)</span>
                      <span className="text-[10px] font-black bg-[#B02019] text-white px-1.5 py-0.5 rounded-none" style={{ borderRadius: 0 }}>DAY</span>
                    </div>
                    <div className="flex justify-between items-baseline font-bold mt-1">
                      <span className="text-xl md:text-2xl font-black text-gray-900 tracking-tight">{fmt(Number(r.dailyRate))}</span>
                      <span className="text-gray-500 text-sm font-bold">₭</span>
                    </div>
                  </div>
                  <div className="bg-[#FAFBFD] p-3.5 border border-gray-200 flex flex-col justify-between" style={{ borderRadius: 0 }}>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">ລາຍອາທິດ (Week)</span>
                      <span className="text-[10px] font-black bg-[#1D4ED8] text-white px-1.5 py-0.5 rounded-none" style={{ borderRadius: 0 }}>WEEK</span>
                    </div>
                    <div className="flex justify-between items-baseline font-bold mt-1">
                      <span className="text-xl md:text-2xl font-black text-gray-900 tracking-tight">{fmt(Number(r.weeklyRate))}</span>
                      <span className="text-gray-500 text-sm font-bold">₭</span>
                    </div>
                  </div>
                  <div className="bg-[#FAFBFD] p-3.5 border border-gray-200 flex flex-col justify-between" style={{ borderRadius: 0 }}>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">ລາຍເດືອນ (Month)</span>
                      <span className="text-[10px] font-black bg-[#0D9488] text-white px-1.5 py-0.5 rounded-none" style={{ borderRadius: 0 }}>MONTH</span>
                    </div>
                    <div className="flex justify-between items-baseline font-bold mt-1">
                      <span className="text-xl md:text-2xl font-black text-gray-900 tracking-tight">{fmt(Number(r.monthlyRate))}</span>
                      <span className="text-gray-500 text-sm font-bold">₭</span>
                    </div>
                  </div>
                  <div className="bg-[#FAFBFD] p-3.5 border border-gray-200 flex flex-col justify-between" style={{ borderRadius: 0 }}>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">ລາຍປີ (Year)</span>
                      <span className="text-[10px] font-black bg-[#9333EA] text-white px-1.5 py-0.5 rounded-none" style={{ borderRadius: 0 }}>YEAR</span>
                    </div>
                    <div className="flex justify-between items-baseline font-bold mt-1">
                      <span className="text-xl md:text-2xl font-black text-gray-900 tracking-tight">{fmt(Number(r.yearlyRate || 0))}</span>
                      <span className="text-gray-500 text-sm font-bold">₭</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
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

  const API_URL = import.meta.env.VITE_API_URL?.replace('/api', '') || '';
  const logoUrl = settings.find((x: any) => x.key === 'parking_logo')?.value?.url;
  const qrUrl = settings.find((x: any) => x.key === 'qr_payment_image')?.value?.url;

  const imgSrc = (url: string) => url.startsWith('http') ? url : `${API_URL}${url}`;

  return (
    <div className="font-sans w-full flex flex-col pb-6">
      {/* ກາດບັນຈຸຫຼັກຂອງໜ້າຕັ້ງຄ່າລະບົບ (Main Container Card) */}
      <div
        className="shadow-[0_12px_36px_rgba(0,0,0,0.22),0_4px_14px_rgba(0,0,0,0.12)] rounded-none overflow-visible w-full border-0 flex flex-col"
        style={{ borderRadius: 0 }}
      >
        {/* ແຖບຫົວດ້ານເທິງສຸດ (Top Header Bar) ພື້ນຫຼັງສີເທົາເຂັ້ມ (#5D5D5D) */}
        <div
          className="bg-[#5D5D5D] px-3 py-2.5 md:py-0 min-h-[60px] md:h-16 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-2 md:gap-3 lg:gap-3 rounded-none shrink-0"
          style={{ borderRadius: 0 }}
        >
          {/* ດ້ານຊ້າຍ: ໄອຄອນ ແລະ ຊື່ໜ້າຕັ້ງຄ່າລະບົບ */}
          <div className="flex items-center justify-between w-full md:w-auto h-10">
            <div className="flex items-center gap-2.5">
              <SettingsIcon size={20} className="w-5 h-5 text-white shrink-0" />
              <h1 className="text-base md:text-[17px] font-bold text-white tracking-normal whitespace-nowrap">
                ຕັ້ງຄ່າລະບົບ
              </h1>
            </div>
          </div>
        </div>

        {/* ເສັ້ນຂັ້ນສີແດງດ້ານເທິງ (Top Red Stripe Divider) */}
        <div className="h-[2.5px] bg-[#B02019] w-full shrink-0" />

        {/* ສ່ວນເນື້ອໃນຫຼັກ (Main Body) ພື້ນຫຼັງສີສົ້ມເຫຼືອງ (#F9A825) */}
        <div className="bg-[#F9A825] p-3.5 flex flex-col justify-start space-y-3.5">
          {/* ໝວດທີ 1: ຕັ້ງຄ່າລາຄາຄ່າຈອດ (Section 1: Pricing Rules) */}
          <div>
            <div className="flex items-center gap-2 text-black font-bold text-base md:text-[17px] mb-3.5">
              <DollarSign size={20} className="text-black shrink-0" />
              <span>ຕັ້ງຄ່າລາຄາຄ່າຈອດ (Parking Pricing)</span>
            </div>
            <Pricing />
          </div>

          {/* ໝວດທີ 2: ຕັ້ງຄ່າຊື່ສະຖານທີ່ຈອດລົດ (Section 2: Parking Location Name) */}
          <div>
            <div className="flex items-center gap-2 text-black font-bold text-base md:text-[17px] mb-3.5">
              <Store size={20} className="text-black shrink-0" />
              <span>ຊື່ສະຖານທີ່ຈອດລົດ (Parking Name)</span>
            </div>
            <div
              className="bg-white shadow-[0_4px_14px_rgba(0,0,0,0.08)] border border-gray-200 rounded-none p-4 sm:p-5"
              style={{ borderRadius: 0 }}
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="text-xs font-bold text-gray-700 mb-1.5 block">ຊື່ຫຼັກ / ພາສາອັງກິດ (Main Name)</label>
                  <input
                    value={parkingName}
                    onChange={e => setParkingName(e.target.value)}
                    placeholder="ຊື່ບ່ອນຈອດລົດ"
                    className="w-full h-11 px-3.5 bg-gray-50/60 border border-gray-300 font-bold text-base md:text-[17px] text-gray-900 rounded-none focus:bg-white focus:outline-none focus:border-[#B02019] transition-colors"
                    style={{ borderRadius: 0 }}
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-700 mb-1.5 block">ຄຳອະທິບາຍ / ພາສາລາວ (Subtitle)</label>
                  <input
                    value={parkingSub}
                    onChange={e => setParkingSub(e.target.value)}
                    placeholder="ຄຳອະທິບາຍເພີ່ມເຕີມ"
                    className="w-full h-11 px-3.5 bg-gray-50/60 border border-gray-300 font-bold text-base md:text-[17px] text-gray-900 rounded-none focus:bg-white focus:outline-none focus:border-[#B02019] transition-colors"
                    style={{ borderRadius: 0 }}
                  />
                </div>
              </div>
              <div className="flex justify-end pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => saveSetting('parking_name', { name: parkingName, subtitle: parkingSub }, 'Parking name')}
                  className="bg-[#B02019] hover:bg-[#961b15] active:bg-[#7d1611] text-white font-bold h-10 px-6 rounded-none shadow-sm text-base md:text-[16px] flex items-center gap-2 transition-all active:scale-95 cursor-pointer border-0"
                  style={{ borderRadius: 0 }}
                >
                  <Save size={16} />
                  <span>ບັນທຶກຊື່</span>
                </button>
              </div>
            </div>
          </div>

          {/* ໝວດທີ 3: ຕັ້ງຄ່າໂລໂກ ແລະ QR Code ຮັບເງິນ (Section 3: Logo & QR Payment) */}
          <div>
            <div className="flex items-center gap-2 text-black font-bold text-base md:text-[17px] mb-3.5">
              <Image size={20} className="text-black shrink-0" />
              <span>ໂລໂກ ແລະ QR Code ຮັບເງິນ</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {/* ກາດຈັດການຮູບພາບໂລໂກປີ້ລົດ (Ticket Logo Card) */}
              <div
                className="bg-white shadow-[0_4px_14px_rgba(0,0,0,0.08)] border border-gray-200 rounded-none p-4 sm:p-5 flex flex-col justify-between"
                style={{ borderRadius: 0 }}
              >
                <div>
                  <div className="flex items-center gap-2.5 pb-3 mb-4 border-b border-gray-100">
                    <div
                      className="w-8 h-8 bg-[#B02019] text-white flex items-center justify-center shrink-0 rounded-none"
                      style={{ borderRadius: 0 }}
                    >
                      <Image size={18} />
                    </div>
                    <div>
                      <h3 className="text-base md:text-[17px] font-bold text-gray-900">ໂລໂກຢູ່ປີ້ລົດ (Ticket Logo)</h3>
                      <p className="text-xs font-semibold text-gray-500">ຮູບພາບຈະຖືກພິມຢູ່ຫົວໃບບິນປີ້ລົດ</p>
                    </div>
                  </div>
                  <div className="flex flex-col sm:flex-row items-center gap-4">
                    {logoUrl ? (
                      <div
                        className="relative w-28 h-28 border-2 border-gray-300 bg-white flex items-center justify-center shrink-0 rounded-none overflow-hidden group shadow-2xs"
                        style={{ borderRadius: 0 }}
                      >
                        <img src={imgSrc(logoUrl)} className="w-full h-full object-contain p-2" alt="Logo" />
                      </div>
                    ) : (
                      <div
                        className="w-28 h-28 border-2 border-dashed border-gray-300 bg-gray-50 flex flex-col items-center justify-center shrink-0 rounded-none text-gray-400"
                        style={{ borderRadius: 0 }}
                      >
                        <Image size={28} className="text-gray-300 mb-1" />
                        <span className="text-[11px] font-bold text-gray-500">ບໍ່ມີໂລໂກ</span>
                      </div>
                    )}
                    <div className="flex-1 flex flex-col items-start gap-2 w-full">
                      <label
                        className="bg-[#B02019] hover:bg-[#961b15] active:bg-[#7d1611] text-white font-bold h-10 px-5 rounded-none shadow-sm text-sm sm:text-base flex items-center justify-center gap-2 cursor-pointer transition-all w-full sm:w-auto border-0"
                        style={{ borderRadius: 0 }}
                      >
                        <Upload size={16} />
                        <span>ອັບໂຫລດ Logo</span>
                        <input type="file" accept="image/*" className="hidden" onChange={e => e.target.files?.[0] && uploadLogo(e.target.files[0])} />
                      </label>
                      <p className="text-xs text-gray-500 font-semibold">ຮອງຮັບໄຟລ໌ PNG, JPG ຂະໜາດນ້ອຍ</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* ກາດຈັດການຮູບພາບ QR Code ຮັບເງິນ (QR Code Payment Card) */}
              <div
                className="bg-white shadow-[0_4px_14px_rgba(0,0,0,0.08)] border border-gray-200 rounded-none p-4 sm:p-5 flex flex-col justify-between"
                style={{ borderRadius: 0 }}
              >
                <div>
                  <div className="flex items-center gap-2.5 pb-3 mb-4 border-b border-gray-100">
                    <div
                      className="w-8 h-8 bg-[#1D4ED8] text-white flex items-center justify-center shrink-0 rounded-none"
                      style={{ borderRadius: 0 }}
                    >
                      <DollarSign size={18} />
                    </div>
                    <div>
                      <h3 className="text-base md:text-[17px] font-bold text-gray-900">QR ໂອນເງິນ (QR Payment)</h3>
                      <p className="text-xs font-semibold text-gray-500">ສຳລັບສະແກນຊຳລະເງິນຄ່າຈອດລົດ</p>
                    </div>
                  </div>
                  <div className="flex flex-col sm:flex-row items-center gap-4">
                    {qrUrl ? (
                      <div
                        className="relative w-28 h-28 border-2 border-gray-300 bg-white flex items-center justify-center shrink-0 rounded-none overflow-hidden group shadow-2xs"
                        style={{ borderRadius: 0 }}
                      >
                        <img src={imgSrc(qrUrl)} className="w-full h-full object-contain p-2" alt="QR Payment" />
                      </div>
                    ) : (
                      <div
                        className="w-28 h-28 border-2 border-dashed border-gray-300 bg-gray-50 flex flex-col items-center justify-center shrink-0 rounded-none text-gray-400"
                        style={{ borderRadius: 0 }}
                      >
                        <DollarSign size={28} className="text-gray-300 mb-1" />
                        <span className="text-[11px] font-bold text-gray-500">ບໍ່ມີ QR</span>
                      </div>
                    )}
                    <div className="flex-1 flex flex-col items-start gap-2 w-full">
                      <label
                        className="bg-[#B02019] hover:bg-[#961b15] active:bg-[#7d1611] text-white font-bold h-10 px-5 rounded-none shadow-sm text-sm sm:text-base flex items-center justify-center gap-2 cursor-pointer transition-all w-full sm:w-auto border-0"
                        style={{ borderRadius: 0 }}
                      >
                        <Upload size={16} />
                        <span>ອັບໂຫລດ QR Code</span>
                        <input type="file" accept="image/*" className="hidden" onChange={e => e.target.files?.[0] && uploadQR(e.target.files[0])} />
                      </label>
                      <p className="text-xs text-gray-500 font-semibold">ຮອງຮັບໄຟລ໌ຮູບພາບ QR Code ທຸກທະນາຄານ</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ໝວດທີ 4: ຕັ້ງຄ່າຂໍ້ຄວາມທ້າຍໃບບິນປີ້ລົດ (Section 4: Receipt Footer Text) */}
          <div>
            <div className="flex items-center gap-2 text-black font-bold text-base md:text-[17px] mb-3.5">
              <FileText size={20} className="text-black shrink-0" />
              <span>ຂໍ້ຄວາມທ້າຍປີ້ (Receipt Footer)</span>
            </div>
            <div
              className="bg-white shadow-[0_4px_14px_rgba(0,0,0,0.08)] border border-gray-200 rounded-none p-4 sm:p-5"
              style={{ borderRadius: 0 }}
            >
              <label className="text-xs font-bold text-gray-700 mb-1.5 block">ຂໍ້ຄວາມທ້າຍໃບບິນ (Receipt Footer Text)</label>
              <input
                value={receiptFooter}
                onChange={e => setReceiptFooter(e.target.value)}
                placeholder="ຂໍ້ຄວາມທ້າຍໃບບິນ ເຊັ່ນ: ຂອບໃຈທີ່ໃຊ້ບໍລິການ"
                className="w-full h-11 px-3.5 bg-gray-50/60 border border-gray-300 font-bold text-base md:text-[17px] text-gray-900 rounded-none focus:bg-white focus:outline-none focus:border-[#B02019] mb-4 transition-colors"
                style={{ borderRadius: 0 }}
              />
              <div className="flex justify-end pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => saveSetting('receipt_footer', { text: receiptFooter }, 'Receipt footer')}
                  className="bg-[#B02019] hover:bg-[#961b15] active:bg-[#7d1611] text-white font-bold h-10 px-6 rounded-none shadow-sm text-base md:text-[16px] flex items-center gap-2 transition-all active:scale-95 cursor-pointer border-0"
                  style={{ borderRadius: 0 }}
                >
                  <Save size={16} />
                  <span>ບັນທຶກທ້າຍປີ້</span>
                </button>
              </div>
            </div>
          </div>

          {/* ໝວດທີ 5: ຕັ້ງຄ່າການເຊື່ອມຕໍ່ເຄື່ອງພິມໃບບິນ (Section 5: Printer Configuration) */}
          <div>
            <div className="flex items-center gap-2 text-black font-bold text-base md:text-[17px] mb-3.5">
              <Printer size={20} className="text-black shrink-0" />
              <span>ຕັ້ງຄ່າເຄື່ອງພິມ (Printer Setup)</span>
            </div>
            <div
              className="bg-white shadow-[0_4px_14px_rgba(0,0,0,0.08)] border border-gray-200 rounded-none p-4 sm:p-5"
              style={{ borderRadius: 0 }}
            >
              <label className="text-xs font-bold text-gray-700 mb-2 block">ປະເພດການເຊື່ອມຕໍ່ເຄື່ອງພິມ (Connection Interface)</label>
              <div className="flex flex-wrap gap-2.5 mb-4">
                {['USB', 'BLUETOOTH', 'NETWORK'].map(t => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setPrinterType(t.toLowerCase())}
                    className={`h-11 px-6 rounded-none text-base md:text-[17px] font-bold transition-all border-2 outline-none cursor-pointer flex items-center gap-2 ${
                      printerType === t.toLowerCase()
                        ? 'bg-[#B02019] text-white border-[#B02019] shadow-sm'
                        : 'bg-white text-gray-800 border-gray-300 hover:border-gray-400 hover:bg-gray-50'
                    }`}
                    style={{ borderRadius: 0 }}
                  >
                    <Printer size={18} className={printerType === t.toLowerCase() ? 'text-white' : 'text-gray-500'} />
                    <span>{t}</span>
                  </button>
                ))}
              </div>
              <div className="flex justify-end pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => saveSetting('printer_config', { type: printerType, paperWidth: 58, encoding: 'UTF-8' }, 'Printer config')}
                  className="bg-[#B02019] hover:bg-[#961b15] active:bg-[#7d1611] text-white font-bold h-10 px-6 rounded-none shadow-sm text-base md:text-[16px] flex items-center gap-2 transition-all active:scale-95 cursor-pointer border-0"
                  style={{ borderRadius: 0 }}
                >
                  <Save size={16} />
                  <span>ບັນທຶກ Printer</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* ເສັ້ນຂັ້ນສີແດງດ້ານລຸ່ມ (Bottom Red Stripe Divider) */}
        <div className="h-[2.5px] bg-[#B02019] w-full shrink-0" />

        {/* ແຖບສ່ວນທ້າຍດ້ານລຸ່ມສຸດ (Bottom Footer Bar) ພື້ນຫຼັງສີເທົາເຂັ້ມ */}
        <div
          className="bg-[#5D5D5D] px-6 min-h-[60px] md:h-16 rounded-none shrink-0"
          style={{ borderRadius: 0 }}
        />
      </div>
    </div>
  );
}
