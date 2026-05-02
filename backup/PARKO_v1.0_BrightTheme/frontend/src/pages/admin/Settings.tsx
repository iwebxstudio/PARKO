// PARKO — System Settings (Admin)
import React, { useState, useEffect } from 'react';
import { Settings as SettingsIcon, Save, Upload } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../api/client';

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
      const pn = s.find((x:any) => x.key === 'parking_name');
      if (pn) { setParkingName(pn.value.name || ''); setParkingSub(pn.value.subtitle || ''); }
      const rf = s.find((x:any) => x.key === 'receipt_footer');
      if (rf) setReceiptFooter(rf.value.text || '');
      const pc = s.find((x:any) => x.key === 'printer_config');
      if (pc) setPrinterType(pc.value.type || 'bluetooth');
    } catch {}
  };
  useEffect(() => { load(); }, []);

  const saveSetting = async (key: string, value: any, desc: string) => {
    try {
      await api.post('/settings', { key, value, description: desc });
      toast.success('ບັນທຶກສຳເລັດ');
    } catch { toast.error('Failed'); }
  };

  const uploadQR = async (file: File) => {
    const fd = new FormData(); fd.append('file', file);
    try {
      const { data } = await api.post('/upload', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      const url = (data.data || data).url;
      await saveSetting('qr_payment_image', { url, enabled: true }, 'QR Payment Image');
      toast.success('QR Payment ອັບໂຫລດສຳເລັດ');
    } catch { toast.error('Upload failed'); }
  };

  const uploadLogo = async (file: File) => {
    const fd = new FormData(); fd.append('file', file);
    try {
      const { data } = await api.post('/upload', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      const url = (data.data || data).url;
      await saveSetting('parking_logo', { url, enabled: true }, 'Parking Logo');
      toast.success('Logo ອັບໂຫລດສຳເລັດ');
    } catch { toast.error('Upload failed'); }
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 flex items-center gap-3">
          <SettingsIcon className="text-gray-500" /> ຕັ້ງຄ່າລະບົບ
        </h1>
      </div>
      <div className="space-y-4">
        {/* Parking Name */}
        <div className="glass-card p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4">🏢 ຊື່ລານຈອດລົດ</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-gray-600 mb-1 block">ຊື່ (ພາສາອັງກິດ)</label>
              <input value={parkingName} onChange={e=>setParkingName(e.target.value)} className="input-field" />
            </div>
            <div>
              <label className="text-xs font-bold text-gray-600 mb-1 block">ຊື່ (ພາສາລາວ)</label>
              <input value={parkingSub} onChange={e=>setParkingSub(e.target.value)} className="input-field" />
            </div>
          </div>
          <button onClick={()=>saveSetting('parking_name',{name:parkingName,subtitle:parkingSub},'Parking name')}
            className="btn-primary text-sm flex items-center gap-2"><Save size={16}/> ບັນທຶກ</button>
        </div>
        {/* Logo & QR */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="glass-card p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">🖼️ Logo</h3>
            <label className="flex items-center gap-6">
              <div className="w-24 h-24 rounded-xl border-2 border-dashed border-gray-200 flex items-center justify-center bg-gray-50 hover:bg-gray-100 cursor-pointer transition-colors">
                <div className="text-center"><Upload className="mx-auto text-gray-400" /><p className="text-xs font-bold text-gray-500 mt-2">ອັບໂຫລດ Logo</p></div>
              </div>
              <input type="file" accept="image/*" className="hidden" onChange={e=>e.target.files?.[0] && uploadLogo(e.target.files[0])} />
            </label>
          </div>
          <div className="glass-card p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">💳 QR Payment</h3>
            <label className="flex items-center gap-6">
              <div className="w-32 h-32 rounded-xl border-2 border-dashed border-gray-200 flex items-center justify-center bg-gray-50 hover:bg-gray-100 cursor-pointer transition-colors">
                <div className="text-center"><Upload className="mx-auto text-gray-400" /><p className="text-xs font-bold text-gray-500 mt-2">ອັບໂຫລດ QR Payment</p></div>
              </div>
              <input type="file" accept="image/*" className="hidden" onChange={e=>e.target.files?.[0] && uploadQR(e.target.files[0])} />
            </label>
          </div>
        </div>
        {/* Receipt Footer */}
        <div className="glass-card p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4">🧾 ໃບບິນ</h3>
          <label className="text-xs font-bold text-gray-600 mb-1 block">Footer ໃບບິນ</label>
          <input value={receiptFooter} onChange={e=>setReceiptFooter(e.target.value)} className="input-field mb-4" />
          <button onClick={()=>saveSetting('receipt_footer',{text:receiptFooter},'Receipt footer')}
            className="btn-primary text-sm flex items-center gap-2"><Save size={16}/> ບັນທຶກ</button>
        </div>
        {/* Printer */}
        <div className="glass-card p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4">🖨️ Printer</h3>
          <div className="flex gap-2 mb-4">
            {['USB','BLUETOOTH','NETWORK'].map(t => (
              <button key={t} onClick={()=>setPrinterType(t.toLowerCase())}
                className={`px-6 py-3 rounded-2xl text-sm font-bold transition-all ${printerType===t.toLowerCase()?'bg-primary-500 text-white shadow-md shadow-primary-500/20':'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                {t}
              </button>
            ))}
          </div>
          <button onClick={()=>saveSetting('printer_config',{type:printerType,paperWidth:58,encoding:'UTF-8'},'Printer config')}
            className="btn-primary text-sm flex items-center gap-2"><Save size={16}/> ບັນທຶກ</button>
        </div>
      </div>
    </div>
  );
}
