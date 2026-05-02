// PARKO — Lost Ticket Page
import React, { useState } from 'react';
import { AlertTriangle, Camera, Upload, Check, Search } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../api/client';

export default function LostTicket() {
  const [query, setQuery] = useState('');
  const [ticket, setTicket] = useState<any>(null);
  const [notes, setNotes] = useState('');
  const [penaltyAmount, setPenaltyAmount] = useState<number | ''>('');
  const [photos, setPhotos] = useState<any>({});
  const [loading, setLoading] = useState(false);
  const [loadingPhoto, setLoadingPhoto] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const search = async () => {
    if (!query.trim()) return;
    try {
      const { data } = await api.get(`/parking/find/${query.trim()}`);
      setTicket(data.data || data);
    } catch { toast.error('ບໍ່ພົບ Ticket'); }
  };

  const handlePhoto = (key: string) => {
    document.getElementById(key)?.click();
  };

  const uploadPhoto = async (file: File, type: string) => {
    setLoadingPhoto(type);
    const formData = new FormData();
    formData.append('file', file);
    try {
      const { data } = await api.post('/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      const url = (data.data || data).url;
      setPhotos((prev: any) => ({ ...prev, [type]: url }));
      toast.success('ອັບໂຫລດສຳເລັດ');
    } catch { toast.error('ອັບໂຫລດລົ້ມເຫລວ'); }
    finally { setLoadingPhoto(null); }
  };

  const handleSubmit = async () => {
    if (!ticket || !notes.trim()) return toast.error('ກະລຸນາໃສ່ໝາຍເຫດ');
    setLoading(true);
    try {
      await api.post('/lost-tickets', {
        ticketId: ticket.id, 
        notes,
        penaltyAmount: Number(penaltyAmount) || 0,
        vehiclePhotoUrl: photos.vehicle, 
        driverPhotoUrl: photos.driver,
        idCardPhotoUrl: photos.idCard,
      });
      setDone(true);
      toast.success('ບັນທຶກ Lost Ticket ສຳເລັດ');
    } catch (e: any) { toast.error(e.response?.data?.message || 'Failed'); }
    finally { setLoading(false); }
  };

  if (done) return (
    <div className="max-w-lg mx-auto animate-scale-in">
      <div className="glass-card p-8 text-center">
        <div className="w-16 h-16 mx-auto rounded-full gradient-warning flex items-center justify-center mb-4">
          <Check className="w-8 h-8 text-white" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">ບັນທຶກສຳເລັດ</h2>
        <p className="text-gray-500 mb-6">Lost Ticket Case has been recorded</p>
        <button onClick={() => { setDone(false); setTicket(null); setNotes(''); setPhotos({}); setQuery(''); }}
          className="btn-primary">ສ້າງ Case ໃໝ່</button>
      </div>
    </div>
  );

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 flex items-center gap-3">
          <AlertTriangle className="text-red-500" /> ໃບບິນຫາຍ (Lost Ticket)
        </h1>
        <p className="text-gray-500 mt-1">ບັນທຶກຫຼັກຖານກໍລະນີໃບບິນຫາຍ</p>
      </div>
      {/* Search Ticket */}
      <div className="glass-card p-6 mb-6">
        <p className="text-sm font-bold text-gray-400 mb-3 uppercase tracking-wider">ຄົ້ນຫາ Ticket</p>
        <div className="flex gap-3">
          <input value={query} onChange={e => setQuery(e.target.value)} onKeyDown={e => e.key==='Enter' && search()}
            className="input-field flex-1" placeholder="ID ຫຼື ທະບຽນລົດ..." />
          <button onClick={search} className="btn-secondary whitespace-nowrap">ຄົ້ນຫາ</button>
        </div>
        {ticket && (
          <div className="mt-4 p-4 bg-gray-50 border border-gray-100 rounded-xl text-sm space-y-2 animate-slide-down">
            <p className="text-gray-500">Ticket: <span className="text-gray-900 font-bold">{ticket.ticketNumber}</span></p>
            <p className="text-gray-500">ປະເພດ: <span className="text-gray-900">{ticket.vehicleType?.label}</span></p>
            <p className="text-gray-500">ທະບຽນ: <span className="text-gray-900">{ticket.plateNumber || 'ບໍ່ມີ'}</span></p>
          </div>
        )}
      </div>
      {/* Evidence Photos */}
      <div className="glass-card p-6 mb-6">
        <p className="text-sm font-bold text-gray-400 mb-4 uppercase tracking-wider">📸 ຫຼັກຖານ</p>
        <div className="grid grid-cols-2 gap-4">
          {[
            { key: 'face_photo', label: 'ຮູບໜ້າເຈົ້າຂອງລົດ' },
            { key: 'id_card_photo', label: 'ຮູບປື້ມສຳມະໂນ/ບັດປຊຊ' },
            { key: 'vehicle_doc_photo', label: 'ໃບທະບຽນລົດ' },
            { key: 'vehicle_front_photo', label: 'ຮູບລົດດ້ານໜ້າ' },
          ].map(({ key, label }) => (
            <div key={key} className="border-2 border-dashed border-gray-200 rounded-xl p-4 text-center cursor-pointer hover:bg-gray-50 hover:border-blue-400 transition-colors relative"
              onClick={() => handlePhoto(key)}>
              {loadingPhoto === key ? (
                <div className="flex flex-col items-center"><span className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full" /><span className="text-xs mt-2 text-gray-500">ກຳລັງອັບໂຫລດ...</span></div>
              ) : (
                <div className="flex flex-col items-center">
                  {photos[key] ? <Check className="text-blue-500" size={32} /> : <Camera className="text-gray-400" size={32} />}
                  <span className="text-xs text-gray-500 font-bold mt-2">{label}</span>
                </div>
              )}
              <input id={key} type="file" accept="image/*" capture="environment" className="hidden"
                onChange={e => e.target.files?.[0] && uploadPhoto(e.target.files[0], key)} />
            </div>
          ))}
        </div>
      </div>
      {/* Penalty & Notes */}
      <div className="glass-card p-6 mb-6">
        <div className="mb-4">
          <p className="text-sm font-bold text-gray-400 mb-2 uppercase tracking-wider">💰 ຄ່າປັບໃໝ (Penalty Fee)</p>
          <input type="number" value={penaltyAmount} onChange={(e) => setPenaltyAmount(Number(e.target.value))} className="input-field" placeholder="100000" min="0" />
        </div>
        <div>
          <p className="text-sm font-bold text-gray-400 mb-2 uppercase tracking-wider">📝 ໝາຍເຫດ</p>
          <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={3}
            className="input-field resize-none" placeholder="ລາຍລະອຽດ..." />
        </div>
      </div>
      <button onClick={handleSubmit} disabled={!ticket || !notes.trim() || loading}
        className="btn-danger w-full text-lg py-4 flex items-center justify-center gap-2 disabled:opacity-50">
        {loading ? '⏳' : <><AlertTriangle size={20} /> ບັນທຶກ ແລະ ລໍຖ້າອະນຸມັດ (Pending Approval)</>}
      </button>
    </div>
  );
}
