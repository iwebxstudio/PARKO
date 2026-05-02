// PARKO — Audit Log (Admin)
import React, { useState, useEffect } from 'react';
import { ClipboardList, Search } from 'lucide-react';
import api from '../../api/client';

export default function AuditLog() {
  const [logs, setLogs] = useState<any[]>([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [filter, setFilter] = useState('');

  const load = async () => {
    try {
      const { data } = await api.get(`/audit?page=${page}&limit=30${filter?`&entityType=${filter}`:''}`);
      const r = data.data || data;
      setLogs(r.logs || []);
      setTotal(r.pagination?.totalPages || 1);
    } catch {}
  };
  useEffect(() => { load(); }, [page, filter]);

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 flex items-center gap-3">
          <ClipboardList className="text-gray-500" /> Audit Log
        </h1>
        <p className="text-gray-500 mt-1">ບັນທຶກທຸກການກະທຳໃນລະບົບ</p>
      </div>
      <div className="glass-card p-4 mb-4">
        <div className="flex gap-3 flex-wrap">
          {['','Parking','Users','LostTicket','Pricing','Settings'].map(f => (
            <button key={f} onClick={() => { setFilter(f); setPage(1); }}
              className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${filter===f?'bg-primary-500 text-white shadow-md shadow-primary-500/20':'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
              {f || 'ທັງໝົດ'}
            </button>
          ))}
        </div>
      </div>
      <div className="glass-card overflow-hidden">
        <table className="data-table">
          <thead><tr><th>ເວລາ</th><th>ຜູ້ໃຊ້</th><th>Action</th><th>Entity</th><th>IP</th></tr></thead>
          <tbody>
            {logs.map(l => (
              <tr key={l.id}>
                <td className="text-gray-500 text-xs whitespace-nowrap">{new Date(l.createdAt).toLocaleString()}</td>
                <td className="text-gray-900 font-bold">{l.user?.displayName || 'System'}</td>
                <td><span className="badge badge-active">{l.action}</span></td>
                <td className="text-gray-600">{l.entityType}{l.entityId ? ` #${l.entityId.slice(0,8)}` : ''}</td>
                <td className="text-gray-400 text-xs">{l.ipAddress}</td>
              </tr>
            ))}
            {logs.length === 0 && <tr><td colSpan={5} className="text-center text-gray-400 py-8">ບໍ່ມີຂໍ້ມູນ</td></tr>}
          </tbody>
        </table>
      </div>
      {total > 1 && (
        <div className="flex justify-center gap-2 mt-4">
          {Array.from({length: Math.min(total, 10)}, (_,i) => (
            <button key={i} onClick={() => setPage(i+1)}
              className={`w-10 h-10 rounded-xl text-sm font-bold shadow-sm ${page===i+1?'bg-primary-500 text-white':'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
              {i+1}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
