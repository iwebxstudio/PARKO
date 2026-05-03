// PARKO — User Management (Admin)
import React, { useState, useEffect } from 'react';
import { Users, Plus, Edit2, Trash2, X, Shield, User } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../api/client';

export default function UsersPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState({ username: '', email: '', password: '', displayName: '', role: 'STAFF' });

  const load = async () => {
    try { const { data } = await api.get('/users'); setUsers((data.data || data).users || []); } catch {}
  };
  useEffect(() => { load(); }, []);

  const handleSave = async () => {
    try {
      if (editing) {
        await api.patch(`/users/${editing.id}`, { displayName: form.displayName, email: form.email, role: form.role });
        if (form.password && form.password.trim().length > 0) {
          await api.post(`/users/${editing.id}/reset-password`, { newPassword: form.password });
        }
      } else {
        await api.post('/users', form);
      }
      toast.success(editing ? 'ອັບເດດສຳເລັດ' : 'ສ້າງສຳເລັດ');
      setShowForm(false); setEditing(null); setForm({ username: '', email: '', password: '', displayName: '', role: 'STAFF' });
      load();
    } catch (e: any) { toast.error(e.response?.data?.message || 'Failed'); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('ຢືນຢັນການລຶບ?')) return;
    try { await api.delete(`/users/${id}`); toast.success('ລຶບສຳເລັດ'); load(); }
    catch { toast.error('Failed'); }
  };

  const openEdit = (u: any) => {
    setEditing(u);
    setForm({ username: u.username, email: u.email, password: '', displayName: u.displayName, role: u.role });
    setShowForm(true);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">ຈັດການຜູ້ໃຊ້</h1>
          <p className="text-gray-500 mt-1">ເພີ່ມ, ແກ້ໄຂ, ລຶບ ຜູ້ໃຊ້ງານ</p>
        </div>
        <button onClick={() => { setShowForm(true); setEditing(null); setForm({ username:'',email:'',password:'',displayName:'',role:'STAFF' }); }}
          className="btn-primary flex items-center gap-2"><Plus size={20} /> ເພີ່ມຜູ້ໃຊ້</button>
      </div>

      {/* Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="glass-card p-6 w-full max-w-md animate-scale-in">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-gray-900">{editing ? 'ແກ້ໄຂ' : 'ເພີ່ມ'} ຜູ້ໃຊ້</h2>
              <button onClick={() => setShowForm(false)} className="text-gray-500 hover:text-gray-900"><X size={24} /></button>
            </div>
            <div className="space-y-4">
              {!editing && <input value={form.username} onChange={e=>setForm({...form,username:e.target.value})} className="input-field" placeholder="Username" />}
              <input value={form.displayName} onChange={e=>setForm({...form,displayName:e.target.value})} className="input-field" placeholder="Display Name" />
              <input value={form.email} onChange={e=>setForm({...form,email:e.target.value})} className="input-field" placeholder="Email" type="email" />
              <input value={form.password} onChange={e=>setForm({...form,password:e.target.value})} className="input-field" placeholder={editing ? "ປ່ຽນລະຫັດຜ່ານໃໝ່ (ປ່ອຍວ່າງຖ້າບໍ່ປ່ຽນ)" : "Password"} type="password" />
              <select value={form.role} onChange={e=>setForm({...form,role:e.target.value})} className="input-field">
                <option value="STAFF">Staff</option>
                <option value="ADMIN">Admin</option>
              </select>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={handleSave} className="btn-primary flex-1">ບັນທຶກ</button>
              <button onClick={() => setShowForm(false)} className="btn-secondary flex-1">ຍົກເລີກ</button>
            </div>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="glass-card overflow-hidden">
        <table className="data-table">
          <thead><tr><th>ຜູ້ໃຊ້</th><th>Email</th><th>Role</th><th>ສະຖານະ</th><th>ວັນສ້າງ</th><th></th></tr></thead>
          <tbody>
            {users.map(u => (
              <tr key={u.id}>
                <td className="font-bold text-gray-900">{u.displayName}<br/><span className="text-xs text-gray-500 font-medium">@{u.username}</span></td>
                <td className="text-gray-500">{u.email}</td>
                <td><span className={`badge ${u.role==='ADMIN'?'badge-active':'badge-completed'}`}>{u.role}</span></td>
                <td><span className={`badge ${u.isActive?'badge-active':'badge-lost'}`}>{u.isActive?'Active':'Disabled'}</span></td>
                <td className="text-gray-500 text-xs">{new Date(u.createdAt).toLocaleDateString()}</td>
                <td><div className="flex gap-2">
                  <button onClick={()=>openEdit(u)} className="p-2 hover:bg-gray-100 rounded-lg text-gray-500 hover:text-primary-600"><Edit2 size={16}/></button>
                  <button onClick={()=>handleDelete(u.id)} className="p-2 hover:bg-gray-100 rounded-lg text-gray-500 hover:text-red-500"><Trash2 size={16}/></button>
                </div></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
