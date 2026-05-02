// PARKO — Reports & Export (Admin)
import React, { useState } from 'react';
import { BarChart3, Download, Calendar } from 'lucide-react';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Tooltip, Legend } from 'chart.js';
import { Bar } from 'react-chartjs-2';
import toast from 'react-hot-toast';
import api from '../../api/client';

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend);

export default function Reports() {
  const [period, setPeriod] = useState<'daily'|'monthly'|'yearly'>('daily');
  const [dateFrom, setDateFrom] = useState(new Date(Date.now()-30*86400000).toISOString().split('T')[0]);
  const [dateTo, setDateTo] = useState(new Date().toISOString().split('T')[0]);
  const [revData, setRevData] = useState<any>(null);
  const [vehData, setVehData] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const [r, v] = await Promise.all([
        api.get(`/reports/revenue?period=${period}&dateFrom=${dateFrom}&dateTo=${dateTo}`),
        api.get(`/reports/vehicles?period=${period}&dateFrom=${dateFrom}&dateTo=${dateTo}`),
      ]);
      setRevData(r.data.data || r.data);
      setVehData(v.data.data || v.data);
    } catch { toast.error('Load failed'); }
    finally { setLoading(false); }
  };

  const fmt = (n: number) => new Intl.NumberFormat('lo-LA').format(n);

  const chartData = revData ? {
    labels: revData.data?.map((d: any) => d.date) || [],
    datasets: [{
      label: 'ລາຍຮັບ (₭)', data: revData.data?.map((d: any) => d.total) || [],
      backgroundColor: 'rgba(59,130,246,0.6)', borderRadius: 8,
    }],
  } : null;

  const exportCSV = () => {
    if (!revData?.data) return;
    const csv = 'Date,Revenue,Count\n' + revData.data.map((d:any) => `${d.date},${d.total},${d.count}`).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = `parko-report-${period}.csv`; a.click();
    toast.success('Export ສຳເລັດ');
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">ລາຍງານ</h1>
          <p className="text-gray-500 mt-1">ສະຖິຕິລາຍຮັບ ແລະ ຈຳນວນລົດ</p>
        </div>
        <button onClick={exportCSV} className="btn-secondary flex items-center gap-2"><Download size={18}/> Export CSV</button>
      </div>
      {/* Filters */}
      <div className="glass-card p-6 mb-6">
        <div className="flex flex-wrap gap-4 items-end">
          <div>
            <label className="block text-xs font-bold text-gray-600 mb-1">ຊ່ວງເວລາ</label>
            <div className="flex gap-2">
              {(['daily','monthly','yearly'] as const).map(p => (
                <button key={p} onClick={() => setPeriod(p)}
                  className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${period===p?'bg-primary-500 text-white shadow-md shadow-primary-500/20':'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                  {p==='daily'?'ລາຍວັນ':p==='monthly'?'ລາຍເດືອນ':'ລາຍປີ'}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-600 mb-1">ຈາກວັນ</label>
            <input type="date" value={dateFrom} onChange={e=>setDateFrom(e.target.value)} className="input-field" />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-600 mb-1">ຮອດວັນ</label>
            <input type="date" value={dateTo} onChange={e=>setDateTo(e.target.value)} className="input-field" />
          </div>
          <button onClick={load} disabled={loading} className="btn-primary">
            {loading ? '⏳' : 'ສະແດງ'}
          </button>
        </div>
      </div>
      {/* Summary */}
      {revData && (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
          <div className="stat-card">
            <p className="text-gray-500 font-bold text-sm">ລາຍຮັບລວມ</p>
            <p className="text-2xl font-bold text-gray-900">{fmt(revData.summary?.totalRevenue || 0)} ₭</p>
          </div>
          <div className="stat-card">
            <p className="text-gray-500 font-bold text-sm">ຈຳນວນລາຍການ</p>
            <p className="text-2xl font-bold text-gray-900">{revData.summary?.totalTransactions || 0}</p>
          </div>
          <div className="stat-card">
            <p className="text-gray-500 font-bold text-sm">ລົດທັງໝົດ</p>
            <p className="text-2xl font-bold text-gray-900">{vehData?.summary?.totalVehicles || 0}</p>
          </div>
        </div>
      )}
      {/* Chart */}
      {chartData && (
        <div className="glass-card p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            <BarChart3 size={20} className="text-primary-500" /> ກຣາຟລາຍຮັບ
          </h3>
          <div className="h-72">
            <Bar data={chartData} options={{ responsive:true, maintainAspectRatio:false,
              plugins:{legend:{display:false}},
              scales:{x:{ticks:{color:'#6B7280'},grid:{display:false}},y:{ticks:{color:'#6B7280'},grid:{color:'rgba(229,231,235,0.5)'}}}
            }} />
          </div>
        </div>
      )}
    </div>
  );
}
