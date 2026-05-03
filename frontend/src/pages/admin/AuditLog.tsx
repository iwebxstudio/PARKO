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
      const { data } = await api.get(`/audit?page=${page}&limit=30${filter ? `&entityType=${filter}` : ''}`);
      const r = data.data || data;
      setLogs(r.logs || []);
      setTotal(r.pagination?.totalPages || 1);
    } catch { }
  };
  useEffect(() => { load(); }, [page, filter]);

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Audit Log</h1>
        <p className="text-gray-500 mt-1">ບັນທຶກທຸກການກະທຳໃນລະບົບ</p>
      </div>
      <div className="bg-white shadow-sm border border-gray-100 p-6">
        <div className="flex gap-2 flex-wrap mb-6 border-b border-gray-100 pb-6">
          {['', 'Parking', 'Users', 'LostTicket', 'Pricing', 'Settings'].map(f => (
            <button key={f} onClick={() => { setFilter(f); setPage(1); }}
              className={`px-5 py-2.5 rounded-full text-sm font-bold transition-all ${filter === f ? 'bg-[#14B8A6] text-white shadow-sm' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
              {f || 'ທັງໝົດ'}
            </button>
          ))}
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="py-4 font-bold text-gray-500 uppercase text-xs tracking-wider">ເວລາ</th>
                <th className="py-4 font-bold text-gray-500 uppercase text-xs tracking-wider">ຜູ້ໃຊ້</th>
                <th className="py-4 font-bold text-gray-500 uppercase text-xs tracking-wider">ACTION</th>
                <th className="py-4 font-bold text-gray-500 uppercase text-xs tracking-wider">ENTITY</th>
                <th className="py-4 font-bold text-gray-500 uppercase text-xs tracking-wider">IP</th>
              </tr>
            </thead>
            <tbody>
              {logs.map(l => (
                <tr key={l.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                  <td className="py-4 pr-4 text-gray-500 text-sm whitespace-nowrap">{new Date(l.createdAt).toLocaleString()}</td>
                  <td className="py-4 pr-4 text-gray-900 font-bold text-sm">{l.user?.displayName || 'System'}</td>
                  <td className="py-4 pr-4">
                    <span className="bg-[#ccfbf1] text-[#0f766e] px-3 py-1.5 rounded-full text-xs font-bold tracking-wide">
                      {l.action}
                    </span>
                  </td>
                  <td className="py-4 pr-4 text-gray-600 text-sm">{l.entityType}{l.entityId ? ` #${l.entityId.slice(0, 8)}` : ''}</td>
                  <td className="py-4 text-gray-400 text-xs font-mono">{l.ipAddress}</td>
                </tr>
              ))}
              {logs.length === 0 && <tr><td colSpan={5} className="text-center text-gray-400 py-12">ບໍ່ມີຂໍ້ມູນ</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
      {total > 1 && (
        <div className="flex justify-center gap-2 mt-4">
          {Array.from({ length: Math.min(total, 10) }, (_, i) => (
            <button key={i} onClick={() => setPage(i + 1)}
              className={`w-10 h-10 rounded-xl text-sm font-bold shadow-sm ${page === i + 1 ? 'bg-primary-500 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
              {i + 1}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
