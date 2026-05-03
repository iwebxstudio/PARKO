// PARKO — Admin Dashboard (Real-time)
import React, { useState, useEffect } from 'react';
import { Car, LogIn, LogOut, DollarSign, TrendingUp, Activity, X, Clock, Calendar, ShieldCheck, Printer, Search, Trash2 } from 'lucide-react';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, PointElement, LineElement, BarElement, Filler } from 'chart.js';
import { Doughnut, Line } from 'react-chartjs-2';
import { io } from 'socket.io-client';
import toast from 'react-hot-toast';
import api from '../../api/client';
import type { DashboardStats } from '../../types';

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, PointElement, LineElement, BarElement, Filler);

const WS = import.meta.env.VITE_WS_URL || 'http://localhost:3000';

export default function Dashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recent, setRecent] = useState<any[]>([]);
  const [revenue, setRevenue] = useState<any>(null);
  const [selectedTicket, setSelectedTicket] = useState<any | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 7;

  const loadData = async () => {
    try {
      const [s, r, rev] = await Promise.all([
        api.get('/parking/dashboard'),
        api.get('/parking/recent?limit=100'),
        api.get('/reports/revenue?period=daily'),
      ]);
      setStats(s.data.data || s.data);
      setRecent(r.data.data || r.data);
      setRevenue(rev.data.data || rev.data);
    } catch { }
  };

  useEffect(() => {
    loadData();
    const socket = io(`${WS}/parking`, { transports: ['websocket'] });
    socket.on('parking_update', (data: any) => {
      if (data?.type === 'CAPACITY_ALERT') {
        toast.error(data.message, { duration: 8000, icon: '🚨' });
      }
      loadData();
    });
    socket.on('stats_refresh', () => loadData());
    const iv = setInterval(loadData, 30000);
    return () => { socket.disconnect(); clearInterval(iv); };
  }, []);

  const handlePrint = async () => {
    if (!selectedTicket) return;
    toast.success('🖨️ ກຳລັງສົ່ງໄປທີ່ Print Agent...');
    try {
      await fetch('http://localhost:8080/print', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ticket: selectedTicket }),
      });
    } catch {
      toast.error('Print Agent ບໍ່ຕອບສະໜອງ');
    }
  };

  const handleAdminCheckOut = (ticket: any) => {
    toast((t) => (
      <div className="flex flex-col gap-3">
        <p className="font-bold text-gray-800">ຢືນຢັນການລົດອອກ Ticket #{ticket.ticketNumber}?</p>
        <div className="flex gap-2 mt-1">
          <button
            onClick={async () => {
              toast.dismiss(t.id);
              const tId = toast.loading('ກຳລັງດຳເນີນການ...');
              try {
                await api.post('/parking/check-out', {
                  identifier: ticket.ticketNumber,
                  paymentMethod: 'CASH',
                  paymentStatus: 'PAID'
                });
                toast.success('Check-out ສຳເລັດ!', { id: tId });
                setSelectedTicket(null);
                loadData();
              } catch (e: any) {
                const errMsgs = e.response?.data?.message;
                const errorText = Array.isArray(errMsgs) ? errMsgs.join(', ') : errMsgs;
                toast.error(errorText || 'Failed to checkout', { id: tId });
              }
            }}
            className="bg-secondary-500 hover:bg-secondary-600 text-white px-4 py-2 rounded-lg text-sm font-bold flex-1"
          >
            ຢືນຢັນ
          </button>
          <button onClick={() => toast.dismiss(t.id)} className="bg-gray-100 hover:bg-gray-200 text-gray-800 px-4 py-2 rounded-lg text-sm font-bold flex-1 border border-gray-200">
            ຍົກເລີກ
          </button>
        </div>
      </div>
    ), { duration: Infinity });
  };

  const executeDelete = async (id: string) => {
    const tId = toast.loading('ກຳລັງດຳເນີນການ...');
    try {
      await api.post(`/parking/delete/${id}`);
      toast.success('ລົບ Ticket ສຳເລັດ!', { id: tId });
      setSelectedTicket(null);
      loadData();
    } catch (err: any) {
      const errMsgs = err.response?.data?.message;
      const errorText = Array.isArray(errMsgs) ? errMsgs.join(', ') : errMsgs;
      toast.error(errorText || 'Delete Failed', { id: tId });
    }
  };

  const confirmDelete = (e: React.MouseEvent | null, id: string, ticketNumber: string) => {
    if (e) e.stopPropagation();
    toast((t) => (
      <div className="flex flex-col gap-3">
        <p className="font-bold text-red-600">ຢືນຢັນການລົບ Ticket #{ticketNumber} ແທ້ບໍ?</p>
        <div className="flex gap-2 mt-1">
          <button
            onClick={() => { toast.dismiss(t.id); executeDelete(id); }}
            className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-bold flex-1 shadow-sm"
          >
            ລົບເລີຍ
          </button>
          <button onClick={() => toast.dismiss(t.id)} className="bg-gray-100 hover:bg-gray-200 text-gray-800 px-4 py-2 rounded-lg text-sm font-bold flex-1 border border-gray-200">
            ຍົກເລີກ
          </button>
        </div>
      </div>
    ), { duration: Infinity });
  };

  const fmt = (n: number) => new Intl.NumberFormat('lo-LA').format(n);

  const statCards = stats ? [
    { label: 'ລົດກຳລັງຈອດ', value: stats.activeVehicles, icon: Car, gradient: 'gradient-primary', shadow: 'shadow-primary-500/20' },
    { label: 'ລົດເຂົ້າວັນນີ້', value: stats.todayCheckIns, icon: LogIn, gradient: 'gradient-success', shadow: 'shadow-accent-500/20' },
    { label: 'ລົດອອກວັນນີ້', value: stats.todayCheckOuts, icon: LogOut, gradient: 'gradient-purple', shadow: 'shadow-purple-500/20' },
    { label: 'ລາຍຮັບວັນນີ້', value: `${fmt(stats.todayRevenue)} ₭`, icon: DollarSign, gradient: 'gradient-warning', shadow: 'shadow-yellow-500/20' },
  ] : [];

  const doughnutData = stats ? {
    labels: stats.vehicleBreakdown.map(v => v.vehicleType),
    datasets: [{
      data: stats.vehicleBreakdown.map(v => v.count),
      backgroundColor: ['#3b82f6', '#22c55e', '#f59e0b', '#8b5cf6'],
      borderWidth: 0,
    }],
  } : null;

  const lineData = revenue ? {
    labels: revenue.data?.map((d: any) => d.date) || [],
    datasets: [{
      label: 'ລາຍຮັບ (₭)',
      data: revenue.data?.map((d: any) => d.total) || [],
      borderColor: '#3b82f6',
      backgroundColor: 'rgba(59,130,246,0.1)',
      fill: true, tension: 0.4,
    }],
  } : null;

  const filteredRecent = recent.filter((t: any) =>
    t.ticketNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (t.plateNumber && t.plateNumber.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const totalPages = Math.ceil(filteredRecent.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentRecent = filteredRecent.slice(startIndex, startIndex + itemsPerPage);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">ແຜງຄວບຄຸມ</h1>
          <p className="text-gray-500 mt-1 flex items-center gap-2">
            <span className="text-gray-500 mt-1">Real-time</span>
          </p>
        </div>
      </div>
      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {statCards.map((s, i) => (
          <div key={i} className={`stat-card hover:scale-[1.02] transition-transform`} style={{ animationDelay: `${i * 100}ms` }}>
            <div className={`w-12 h-12 rounded-xl ${s.gradient} flex items-center justify-center shadow-md ${s.shadow}`}>
              <s.icon className="w-6 h-6 text-white" />
            </div>
            <p className="text-gray-500 font-bold text-sm mt-3">{s.label}</p>
            <p className="text-2xl font-bold text-gray-900">{s.value}</p>
          </div>
        ))}
      </div>
      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        <div className="glass-card p-6 lg:col-span-2">
          <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            <TrendingUp size={20} className="text-primary-500" /> ລາຍຮັບ 30 ມື້
          </h3>
          <div className="h-64">
            {lineData && <Line data={lineData} options={{
              responsive: true, maintainAspectRatio: false,
              plugins: { legend: { display: false } },
              scales: {
                x: { ticks: { color: '#6B7280' }, grid: { display: false } },
                y: { ticks: { color: '#6B7280' }, grid: { color: 'rgba(229,231,235,0.5)' } }
              }
            }} />}
          </div>
        </div>
        <div className="glass-card p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4">ປະເພດລົດ</h3>
          <div className="h-64 flex items-center justify-center">
            {doughnutData && <Doughnut data={doughnutData} options={{
              responsive: true, maintainAspectRatio: false,
              plugins: { legend: { position: 'bottom', labels: { color: '#6B7280', padding: 12 } } }
            }} />}
          </div>
        </div>
      </div>
      {/* Recent Activity */}
      <div className="glass-card p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
          <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <Activity size={20} className="text-accent-500" /> ລາຍລະອ່ຽດລົດ
          </h3>
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white stroke-[3px]" size={22} />
            <input
              type="text"
              placeholder="ຄົ້ນຫາ Ticket ຫຼື ທະບຽນ"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-12 pr-6 py-2.5 bg-[#14B8A6] text-white placeholder-white/90 rounded-full font-bold text-base focus:outline-none focus:ring-2 focus:ring-[#0D9488] focus:ring-offset-2 w-full md:w-[320px] transition-all shadow-sm"
            />
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead><tr>
              <th>Ticket</th><th>ປະເພດ</th><th>ທະບຽນ</th><th>ສະຖານະ</th><th>ເວລາເຂົ້າ</th><th>Staff</th><th className="w-10"></th>
            </tr></thead>
            <tbody>
              {currentRecent.map((t: any) => (
                <tr key={t.id} onClick={() => setSelectedTicket(t)} className="cursor-pointer hover:!bg-primary-50 transition-colors">
                  <td className="font-mono font-bold text-primary-600">{t.ticketNumber}</td>
                  <td className="font-medium text-gray-900">{t.vehicleType?.icon} {t.vehicleType?.label}</td>
                  <td className="font-medium text-gray-900">{t.plateNumber || '-'}</td>
                  <td><span className={`badge ${t.status === 'ACTIVE' ? 'badge-active' : t.status === 'COMPLETED' ? 'badge-completed' : 'badge-lost'}`}>{t.status}</span></td>
                  <td className="text-gray-500 text-xs">{new Date(t.checkInAt).toLocaleString()}</td>
                  <td className="text-gray-600">{t.checkedInBy?.displayName}</td>
                  <td className="text-right">
                    <button
                      onClick={(e) => confirmDelete(e, t.id, t.ticketNumber)}
                      className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                      title="ລົບ Ticket"
                    >
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))}
              {filteredRecent.length === 0 && <tr><td colSpan={7} className="text-center text-gray-400 py-8">ບໍ່ມີຂໍ້ມູນ</td></tr>}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="flex flex-wrap items-center justify-center gap-2 mt-6 pt-4">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm font-bold text-gray-800 disabled:opacity-50 hover:bg-gray-50 transition-colors shadow-sm"
            >
              Return
            </button>
            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm font-bold text-gray-800 disabled:opacity-50 hover:bg-gray-50 transition-colors shadow-sm"
            >
              next
            </button>

            {(() => {
              let startPage = Math.max(1, currentPage - 4);
              let endPage = Math.min(totalPages, startPage + 9);
              if (endPage - startPage < 9) {
                startPage = Math.max(1, endPage - 9);
              }
              const visiblePages = Array.from({ length: endPage - startPage + 1 }, (_, i) => startPage + i);

              return visiblePages.map(page => (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={`w-11 h-11 flex items-center justify-center rounded-2xl font-bold text-base transition-all shadow-sm ${currentPage === page
                      ? 'bg-[#10B981] text-white'
                      : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
                    }`}
                >
                  {page}
                </button>
              ));
            })()}
          </div>
        )}
      </div>

      {/* Ticket Details Modal */}
      {selectedTicket && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden animate-scale-in border border-gray-100">
            {/* Header */}
            <div className="flex items-center justify-between p-5 border-b border-gray-100 bg-gray-50/80">
              <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <Car className="text-primary-500" /> ລາຍລະອຽດລົດ
              </h3>
              <div className="flex items-center gap-1">
                <button onClick={() => confirmDelete(null, selectedTicket.id, selectedTicket.ticketNumber)} className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors" title="ລົບ Ticket">
                  <Trash2 size={20} />
                </button>
                <button onClick={() => setSelectedTicket(null)} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-200 rounded-xl transition-colors" title="ປິດ">
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="p-6 space-y-5">
              {/* Ticket Hero */}
              <div className="flex justify-between items-center bg-primary-50 p-4 rounded-2xl border border-primary-100">
                <div>
                  <p className="text-xs font-bold text-primary-500 uppercase tracking-wider mb-1">Ticket Number</p>
                  <p className="text-3xl font-mono font-bold text-primary-700">#{selectedTicket.ticketNumber}</p>
                </div>
                <div className="text-right">
                  <span className={`badge ${selectedTicket.status === 'ACTIVE' ? 'badge-active bg-primary-500 text-white shadow-md' : selectedTicket.status === 'COMPLETED' ? 'badge-completed bg-secondary-500 text-white shadow-md' : 'badge-lost bg-red-500 text-white shadow-md'} px-3 py-1.5 text-sm`}>
                    {selectedTicket.status}
                  </span>
                </div>
              </div>

              {/* Data List */}
              <div className="space-y-3 px-1">
                <div className="flex justify-between items-center py-2 border-b border-gray-50">
                  <span className="text-sm text-gray-500 flex items-center gap-2"><Car size={16} /> ປະເພດ</span>
                  <span className="font-bold text-gray-900">{selectedTicket.vehicleType?.icon} {selectedTicket.vehicleType?.label}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-gray-50">
                  <span className="text-sm text-gray-500 flex items-center gap-2"><ShieldCheck size={16} /> ທະບຽນ</span>
                  <span className="font-bold text-gray-900">{selectedTicket.plateNumber ? `${selectedTicket.plateProvince || ''} ${selectedTicket.plateNumber}` : 'ບໍ່ມີ'}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-gray-50">
                  <span className="text-sm text-gray-500 flex items-center gap-2"><Calendar size={16} /> ເວລາເຂົ້າ</span>
                  <span className="font-medium text-gray-800 text-sm">{new Date(selectedTicket.checkInAt).toLocaleString('lo-LA')}</span>
                </div>
                {selectedTicket.checkOutAt && (
                  <div className="flex justify-between items-center py-2 border-b border-gray-50">
                    <span className="text-sm text-gray-500 flex items-center gap-2"><Clock size={16} /> ເວລາອອກ</span>
                    <span className="font-medium text-gray-800 text-sm">{new Date(selectedTicket.checkOutAt).toLocaleString('lo-LA')}</span>
                  </div>
                )}
                <div className="flex justify-between items-center py-2">
                  <span className="text-sm text-gray-500">Staff (Check-in)</span>
                  <span className="font-medium text-gray-800 text-sm">{selectedTicket.checkedInBy?.displayName || '-'}</span>
                </div>

                {/* Payment Status (if checked out) */}
                {selectedTicket.paymentStatus && selectedTicket.paymentStatus !== 'UNPAID' && (
                  <div className="flex justify-between items-center py-3 mt-4 bg-emerald-50 px-4 rounded-xl border border-emerald-100">
                    <span className="text-sm text-emerald-600 font-bold uppercase tracking-wider">ສະຖານະການຈ່າຍ</span>
                    <span className="font-bold text-emerald-700">{selectedTicket.paymentStatus}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Footer Action */}
            <div className="p-4 bg-gray-50 border-t border-gray-100 flex gap-2">
              {selectedTicket.status === 'ACTIVE' && (
                <button onClick={() => handleAdminCheckOut(selectedTicket)} className="flex-1 py-3 bg-secondary-500 text-white rounded-xl font-bold hover:bg-secondary-600 transition-colors flex items-center justify-center gap-2 shadow-md">
                  <LogOut size={18} /> ລົດອອກ
                </button>
              )}
              <button onClick={handlePrint} className="flex-1 py-3 bg-primary-500 text-white rounded-xl font-bold hover:bg-primary-600 transition-colors flex items-center justify-center gap-2 shadow-md">
                <Printer size={18} /> ພິມ
              </button>
              <button onClick={() => setSelectedTicket(null)} className="flex-[0.5] py-3 bg-white border border-gray-200 text-gray-700 rounded-xl font-bold hover:bg-gray-100 transition-colors">
                ປິດ
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
