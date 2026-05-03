// PARKO — Reports & Export (Admin)
import React, { useState, useEffect } from 'react';
import {
  Download, CalendarDays, Wallet, Receipt, CarFront,
  Filter, Loader2, FileSpreadsheet, RefreshCw, LogIn, LogOut, Banknote, Car, FileDown, FileText,
  BarChart3, Bike, Zap, Truck
} from 'lucide-react';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Tooltip, Legend } from 'chart.js';
import { Bar } from 'react-chartjs-2';
import toast from 'react-hot-toast';
import * as XLSX from 'xlsx';
import api from '../../api/client';

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend);

const StatCard = ({ title, value, unit }: any) => (
  <div className="bg-white p-5 shadow-sm border border-gray-100 flex flex-col justify-between group hover:shadow-md transition-all h-full relative overflow-hidden">
    <div className="flex justify-between items-start mb-2 relative">
      <p className="text-sm font-semibold text-gray-500 leading-tight pr-2">{title}</p>
    </div>
    <div className="flex items-baseline gap-1 mt-2 relative">
      <h3 className="text-2xl sm:text-3xl font-bold text-gray-900">{value}</h3>
      {unit && <span className="text-gray-400 font-semibold text-sm ml-1">{unit}</span>}
    </div>
  </div>
);

const ChartBox = ({ title, icon: Icon, colorClass, chartData, unit, loading }: any) => (
  <div className="bg-white p-5 shadow-sm border border-gray-100 relative mt-4">
    <div className="flex items-center gap-2 mb-4">
      <div className={`p-2 rounded-lg ${colorClass}`}>
        <Icon size={18} />
      </div>
      <h3 className="text-md font-bold text-gray-900">{title}</h3>
    </div>
    <div className="h-64 w-full relative">
      {loading ? (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/80 z-10 rounded-xl border border-dashed border-gray-200">
          <Loader2 size={24} className="text-primary-500 animate-spin mb-2" />
          <p className="text-xs text-gray-500 font-medium">ກຳລັງໂຫຼດ...</p>
        </div>
      ) : !chartData || chartData.datasets[0].data.length === 0 ? (
        <div className="absolute inset-0 flex flex-col items-center justify-center rounded-xl border border-dashed border-gray-200 bg-gray-50/50">
          <BarChart3 size={32} className="text-gray-300 mb-2" />
          <p className="text-sm text-gray-500 font-medium">ບໍ່ມີຂໍ້ມູນ</p>
        </div>
      ) : (
        <Bar data={chartData} options={{
          responsive: true, maintainAspectRatio: false,
          plugins: {
            legend: { display: false },
            tooltip: {
              backgroundColor: 'rgba(17, 24, 39, 0.9)', titleFont: { family: 'Inter', size: 12 }, bodyFont: { family: 'Inter', size: 13, weight: 'bold' as const }, padding: 10, cornerRadius: 6, displayColors: false,
              callbacks: { label: (ctx: any) => `${ctx.dataset.label}: ${new Intl.NumberFormat('lo-LA').format(ctx.parsed.y)} ${unit}` }
            }
          },
          scales: {
            x: { ticks: { color: '#6B7280', font: { family: 'Inter' } }, grid: { display: true, color: 'rgba(229,231,235,0.5)' }, border: { display: false } },
            y: { beginAtZero: true, ticks: { color: '#6B7280', font: { family: 'Inter' }, callback: (value: any) => new Intl.NumberFormat('lo-LA', { notation: "compact" }).format(value) }, grid: { display: true, color: 'rgba(229,231,235,0.5)' }, border: { display: false } }
          },
          interaction: { intersect: false, mode: 'index' as const },
        }} />
      )}
    </div>
  </div>
);

export default function Reports() {
  const [period] = useState<'daily' | 'monthly' | 'yearly'>('daily');
  const [dateFrom, setDateFrom] = useState(new Date(Date.now() - 30 * 86400000).toISOString().split('T')[0]);
  const [dateTo, setDateTo] = useState(new Date().toISOString().split('T')[0]);

  const [stats, setStats] = useState<any>(null);
  const [revData, setRevData] = useState<any>(null);
  const [vehInData, setVehInData] = useState<any>(null);
  const [vehOutData, setVehOutData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const dateToEnd = dateTo + 'T23:59:59';
      const [s, r, vi, vo] = await Promise.all([
        api.get(`/reports/dashboard-stats`),
        api.get(`/reports/revenue?period=${period}&dateFrom=${dateFrom}&dateTo=${dateToEnd}`),
        api.get(`/reports/vehicles?period=${period}&dateFrom=${dateFrom}&dateTo=${dateToEnd}&type=in`),
        api.get(`/reports/vehicles?period=${period}&dateFrom=${dateFrom}&dateTo=${dateToEnd}&type=out`),
      ]);
      const statsData = s.data?.data || s.data;
      setStats(statsData);

      const revPayload = r.data?.data || r.data;
      const viPayload = vi.data?.data || vi.data;
      const voPayload = vo.data?.data || vo.data;
      setRevData(revPayload);
      setVehInData(viPayload);
      setVehOutData(voPayload);
    } catch {
      toast.error('ໂຫຼດຂໍ້ມູນບໍ່ສຳເລັດ (Load failed)');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const fmt = (n: number | undefined) => n !== undefined ? new Intl.NumberFormat('lo-LA').format(n) : '---';

  const chartVehIn = vehInData ? {
    labels: vehInData.data?.map((d: any) => d.date) || [],
    datasets: [{
      label: 'ລົດເຂົ້າ', data: vehInData.data?.map((d: any) => d.total) || [],
      backgroundColor: 'rgba(59, 130, 246, 0.15)', borderColor: 'rgba(59, 130, 246, 0.8)', borderWidth: 2, hoverBackgroundColor: 'rgba(59, 130, 246, 0.25)', borderRadius: 4,
    }],
  } : null;

  const chartVehOut = vehOutData ? {
    labels: vehOutData.data?.map((d: any) => d.date) || [],
    datasets: [{
      label: 'ລົດອອກ', data: vehOutData.data?.map((d: any) => d.total) || [],
      backgroundColor: 'rgba(249, 115, 22, 0.15)', borderColor: 'rgba(249, 115, 22, 0.8)', borderWidth: 2, hoverBackgroundColor: 'rgba(249, 115, 22, 0.25)', borderRadius: 4,
    }],
  } : null;

  const chartRev = revData ? {
    labels: revData.data?.map((d: any) => d.date) || [],
    datasets: [{
      label: 'ລາຍຮັບ', data: revData.data?.map((d: any) => d.total) || [],
      backgroundColor: 'rgba(16, 185, 129, 0.15)', borderColor: 'rgba(16, 185, 129, 0.8)', borderWidth: 2, hoverBackgroundColor: 'rgba(16, 185, 129, 0.25)', borderRadius: 4,
    }],
  } : null;



  // ── Export helpers ──
  const doExport = async (format: 'xlsx' | 'csv') => {
    setExporting(true);
    const toastId = toast.loading(format === 'xlsx' ? 'ກຳລັງສ້າງ Excel...' : 'ກຳລັງສ້າງ CSV...');
    try {
      const aoa: any[][] = [];
      aoa.push(['ລາຍງານລະບົບຈອດລົດ PARKO (Dashboard Report)']);
      aoa.push(['ວັນທີເລີ່ມ (Date From)', dateFrom, 'ວັນທີສິ້ນສຸດ (Date To)', dateTo]);
      aoa.push([]);

      // 1. Check In
      aoa.push(['1. ກ່ຽວກັບລົດເຂົ້າ (Check In)']);
      aoa.push(['ວັນທີ (Date)', 'ຈຳນວນລົດເຂົ້າ (Total Check-In)']);
      if (vehInData?.data?.length) {
        vehInData.data.forEach((d: any) => aoa.push([d.date, d.total]));
      } else {
        aoa.push(['ບໍ່ມີຂໍ້ມູນ (No data)']);
      }
      aoa.push([]);

      // 2. Check Out
      aoa.push(['2. ກ່ຽວກັບລົດອອກ (Check Out)']);
      aoa.push(['ວັນທີ (Date)', 'ຈຳນວນລົດອອກ (Total Check-Out)']);
      if (vehOutData?.data?.length) {
        vehOutData.data.forEach((d: any) => aoa.push([d.date, d.total]));
      } else {
        aoa.push(['ບໍ່ມີຂໍ້ມູນ (No data)']);
      }
      aoa.push([]);

      // 3. Revenue
      aoa.push(['3. ກ່ຽວກັບເງິນ (Revenue)']);
      aoa.push(['ວັນທີ (Date)', 'ລາຍຮັບ (Revenue ₭)']);
      if (revData?.data?.length) {
        revData.data.forEach((d: any) => aoa.push([d.date, d.total]));
      } else {
        aoa.push(['ບໍ່ມີຂໍ້ມູນ (No data)']);
      }
      aoa.push([]);

      // 4. Vehicle Types
      aoa.push(['4. ກ່ຽວກັບປະເພດລົດ (Vehicle Types)']);
      aoa.push(['ປະເພດລົດ (Vehicle Type)', 'ຈຳນວນ (Count)']);
      if (stats?.vehicleBreakdown?.length) {
        stats.vehicleBreakdown.forEach((v: any) => aoa.push([v.vehicleType, v.count]));
      } else {
        aoa.push(['ບໍ່ມີຂໍ້ມູນ (No data)']);
      }

      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.aoa_to_sheet(aoa);
      ws['!cols'] = [{ wch: 35 }, { wch: 35 }, { wch: 25 }, { wch: 25 }];
      XLSX.utils.book_append_sheet(wb, ws, 'Dashboard Report');

      const fname = `PARKO_Dashboard_Report_${dateFrom}_${dateTo}`;

      if (format === 'xlsx') {
        const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
        const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8' });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${fname}.xlsx`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        setTimeout(() => window.URL.revokeObjectURL(url), 2000);
      } else {
        const csvContent = XLSX.utils.sheet_to_csv(ws);
        const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${fname}.csv`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        setTimeout(() => window.URL.revokeObjectURL(url), 2000);
      }

      toast.success(format === 'xlsx' ? `ສ້າງ Excel ສຳເລັດ` : `ສ້າງ CSV ສຳເລັດ`, { id: toastId });
    } catch {
      toast.error('Export ບໍ່ສຳເລັດ — ກະລຸນາລອງໃໝ່', { id: toastId });
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-10 animate-fade-in">
      <div className="mb-6">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900">ລາຍງານ ແລະ ສະຖິຕິ</h1>
        <p className="text-gray-500 mt-1">ພາບລວມຂອງລາຍຮັບ ແລະ ການເຂົ້າອອກຂອງລົດທັງໝົດ</p>
      </div>

      {/* Export Section */}
      <div className="bg-white p-5 shadow-sm border border-gray-100">
        <div className="flex items-center gap-2 mb-3 text-gray-800 font-bold">
            <Download size={16} className="text-gray-500" />
            <h2 className="text-sm">Export ຂໍ້ມູນ (Export Data)</h2>
          </div>
          <div className="flex flex-col md:flex-row gap-3 items-end">
            {/* Date range pickers */}
            <div className="flex flex-1 gap-3 w-full md:w-auto">
              <div className="flex-1">
                <label className="text-xs font-medium text-gray-500 mb-1 block">ວັນທີເລີ່ມ (From)</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <CalendarDays size={14} className="text-gray-400" />
                  </div>
                  <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 bg-gray-50 border border-gray-200 text-gray-900 text-sm rounded-xl focus:ring-2 focus:ring-primary-500 outline-none"
                  />
                </div>
              </div>
              <div className="flex-1">
                <label className="text-xs font-medium text-gray-500 mb-1 block">ວັນທີສຸດ (To)</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <CalendarDays size={14} className="text-gray-400" />
                  </div>
                  <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 bg-gray-50 border border-gray-200 text-gray-900 text-sm rounded-xl focus:ring-2 focus:ring-primary-500 outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Export buttons */}
            <div className="flex gap-2 w-full md:w-auto">
              <button
                onClick={() => doExport('xlsx')}
                disabled={exporting}
                className="flex-1 md:flex-none flex items-center justify-center gap-2 px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-semibold shadow-sm disabled:opacity-60 transition-all text-sm"
              >
                {exporting ? <Loader2 size={16} className="animate-spin" /> : <FileSpreadsheet size={16} />}
                <span>Export Excel</span>
              </button>
              <button
                onClick={() => doExport('csv')}
                disabled={exporting}
                className="flex-1 md:flex-none flex items-center justify-center gap-2 px-5 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-xl font-semibold shadow-sm disabled:opacity-60 transition-all text-sm"
              >
                {exporting ? <Loader2 size={16} className="animate-spin" /> : <FileText size={16} />}
                <span>Export CSV</span>
              </button>
            </div>
          </div>
        </div>

      {/* SECTION 1: CHECK IN */}
      <div>
        <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2 border-b pb-2">
          <LogIn className="text-blue-500" /> ກ່ຽວກັບລົດເຂົ້າ (Check In)
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <StatCard title="1. ລົດກຳລັງຈອດ" value={fmt(stats?.vehicles?.parked)} unit="ຄັນ" icon={Car} colorClass="bg-red-50 text-red-600" />
          <StatCard title="2. ລົດເຂົ້າວັນນີ້" value={fmt(stats?.vehicles?.in?.today)} unit="ຄັນ" icon={LogIn} colorClass="bg-blue-50 text-blue-600" />
          <StatCard title="3. ລົດເຂົ້າຈອດເດືອນນີ້" value={fmt(stats?.vehicles?.in?.month)} unit="ຄັນ" icon={LogIn} colorClass="bg-blue-50 text-blue-600" />
          <StatCard title="4. ລົດເຂົ້າປີນີ້" value={fmt(stats?.vehicles?.in?.year)} unit="ຄັນ" icon={LogIn} colorClass="bg-blue-50 text-blue-600" />
          <StatCard title="5. ລົດເຂົ້າຈອດທັງໝົດ" value={fmt(stats?.vehicles?.in?.all)} unit="ຄັນ" icon={LogIn} colorClass="bg-blue-50 text-blue-600" />
        </div>
        <ChartBox title="ກຣາຟແທ່ງສະຖິຕິລົດເຂົ້າ (Column Chart)" icon={BarChart3} colorClass="bg-blue-50 text-blue-600" chartData={chartVehIn} unit="ຄັນ" loading={loading} />
      </div>

      {/* SECTION 2: CHECK OUT */}
      <div className="pt-4">
        <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2 border-b pb-2">
          <LogOut className="text-orange-500" /> ກ່ຽວກັບລົດອອກ (Check Out)
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard title="1. ລົດອອກວັນນີ້" value={fmt(stats?.vehicles?.out?.today)} unit="ຄັນ" icon={LogOut} colorClass="bg-orange-50 text-orange-600" />
          <StatCard title="2. ລົດອອກເດືອນນີ້" value={fmt(stats?.vehicles?.out?.month)} unit="ຄັນ" icon={LogOut} colorClass="bg-orange-50 text-orange-600" />
          <StatCard title="3. ລົດອອກປີນີ້" value={fmt(stats?.vehicles?.out?.year)} unit="ຄັນ" icon={LogOut} colorClass="bg-orange-50 text-orange-600" />
          <StatCard title="4. ລົດອອກທັງໝົດ" value={fmt(stats?.vehicles?.out?.all)} unit="ຄັນ" icon={LogOut} colorClass="bg-orange-50 text-orange-600" />
        </div>
        <ChartBox title="ກຣາຟແທ່ງສະຖິຕິລົດອອກ (Column Chart)" icon={BarChart3} colorClass="bg-orange-50 text-orange-600" chartData={chartVehOut} unit="ຄັນ" loading={loading} />
      </div>

      {/* SECTION 3: REVENUE */}
      <div className="pt-4">
        <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2 border-b pb-2">
          <Banknote className="text-emerald-500" /> ກ່ຽວກັບເງິນ (Revenue)
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard title="1. ລາຍຮັບວັນນີ້" value={fmt(stats?.revenue?.today)} unit="₭" icon={Wallet} colorClass="bg-emerald-50 text-emerald-600" />
          <StatCard title="2. ລາຍຮັບເດືອນນີ້" value={fmt(stats?.revenue?.month)} unit="₭" icon={Wallet} colorClass="bg-emerald-50 text-emerald-600" />
          <StatCard title="3. ລາຍຮັບປີນີ້" value={fmt(stats?.revenue?.year)} unit="₭" icon={Wallet} colorClass="bg-emerald-50 text-emerald-600" />
          <StatCard title="4. ລາຍຮັບລວມທັງໝົດ" value={fmt(stats?.revenue?.all)} unit="₭" icon={Wallet} colorClass="bg-emerald-50 text-emerald-600" />
        </div>
        <ChartBox title="ກຣາຟແທ່ງສະຖິຕິລາຍຮັບ (Column Chart)" icon={BarChart3} colorClass="bg-emerald-50 text-emerald-600" chartData={chartRev} unit="₭" loading={loading} />
      </div>

      {/* SECTION 4: VEHICLE TYPES */}
      <div className="pt-4 pb-8">
        <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2 border-b pb-2">
          <CarFront className="text-indigo-500" /> ກ່ຽວກັບປະເພດລົດ
        </h2>
        <div className="flex flex-wrap gap-4">
          {['motorcycle', 'ev_motorcycle', 'car', 'truck'].map((vType) => {
            const typeData = stats?.vehicles?.byType?.find((t: any) => t.name === vType) || { count: 0 };

            // Map keys to specific icons to match exactly the screenshot
            let Icon = Car;
            if (vType === 'motorcycle') Icon = Bike;
            if (vType === 'ev_motorcycle') Icon = Zap;
            if (vType === 'car') Icon = CarFront;
            if (vType === 'truck') Icon = Truck;

            return (
              <div key={vType} className="bg-white px-8 py-6 flex-1 min-w-[120px] flex flex-col items-center justify-center gap-4">
                <Icon size={24} className="text-slate-800 stroke-[2.5px]" />
                <div className="text-center">
                  <span className="text-xl font-medium text-slate-800">{typeData.count}</span>
                  <span className="text-slate-500 font-medium ml-2 text-sm">ຄັນ</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
}
