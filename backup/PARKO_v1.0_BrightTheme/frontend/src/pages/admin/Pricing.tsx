// PARKO — Pricing Settings (Admin)
import React, { useState, useEffect } from 'react';
import { DollarSign, Save, Edit2 } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../api/client';

export default function Pricing() {
  const [rules, setRules] = useState<any[]>([]);
  const [editing, setEditing] = useState<string|null>(null);
  const [form, setForm] = useState<any>({});

  const load = async () => {
    try { const { data } = await api.get('/pricing'); setRules(data.data || data); } catch {}
  };
  useEffect(() => { load(); }, []);

  const startEdit = (r: any) => {
    setEditing(r.id);
    setForm({ hourlyRate: Number(r.hourlyRate), dailyRate: Number(r.dailyRate),
      weeklyRate: Number(r.weeklyRate), monthlyRate: Number(r.monthlyRate), freeMinutes: r.freeMinutes });
  };

  const save = async (id: string) => {
    try {
      await api.patch(`/pricing/${id}`, form);
      toast.success('ບັນທຶກສຳເລັດ');
      setEditing(null); load();
    } catch { toast.error('Failed'); }
  };

  const fmt = (n: number) => new Intl.NumberFormat('lo-LA').format(n);

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 flex items-center gap-3">
          <DollarSign className="text-accent-500" /> ຕັ້ງຄ່າລາຄາ
        </h1>
        <p className="text-gray-500 mt-1">ກຳນົດລາຄາຕໍ່ປະເພດລົດ (ສະກຸນເງິນ: ₭ LAK)</p>
      </div>
      <div className="space-y-4">
        {rules.map(r => (
          <div key={r.id} className="glass-card p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <span className="text-2xl">{r.vehicleType?.icon}</span>
                <div>
                  <h3 className="text-lg font-bold text-gray-900">{r.vehicleType?.label}</h3>
                  <p className="text-xs text-gray-500">{r.vehicleType?.description}</p>
                </div>
              </div>
              {editing !== r.id ? (
                <button onClick={() => startEdit(r)} className="btn-secondary text-sm flex items-center gap-2">
                  <Edit2 size={16} /> ແກ້ໄຂ
                </button>
              ) : (
                <button onClick={() => save(r.id)} className="btn-success text-sm flex items-center gap-2">
                  <Save size={16} /> ບັນທຶກ
                </button>
              )}
            </div>
            {editing === r.id ? (
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                {[['hourlyRate','ຊົ່ວໂມງ'],['dailyRate','ມື້'],['weeklyRate','ອາທິດ'],['monthlyRate','ເດືອນ'],['freeMinutes','ຟຣີ (ນາທີ)']].map(([k,l]) => (
                  <div key={k}>
                    <label className="text-xs font-bold text-gray-600">{l}</label>
                    <input type="number" value={form[k]} onChange={e=>setForm({...form,[k]:Number(e.target.value)})}
                      className="input-field mt-1" />
                  </div>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                {[['ຊົ່ວໂມງ',r.hourlyRate],['ມື້',r.dailyRate],['ອາທິດ',r.weeklyRate],['ເດືອນ',r.monthlyRate],['ຟຣີ',`${r.freeMinutes} ນາທີ`]].map(([l,v]) => (
                  <div key={l as string} className="bg-gray-50 border border-gray-100 rounded-xl p-3 text-center">
                    <p className="text-xs font-bold text-gray-500 mb-1">{l}</p>
                    <p className="text-lg font-bold text-gray-900">{typeof v==='number'?`${fmt(Number(v))} ₭`:v}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
