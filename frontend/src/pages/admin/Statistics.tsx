// PARKO — Statistics / ສະຖິຕິ (Admin & Staff)
import React, { useState, useEffect } from 'react';
import {
  Wallet, Loader2, RefreshCw,
  LogIn, LogOut, BarChart3,
  CircleParking, CalendarDays, CalendarRange, TrendingUp,
  CalendarCheck2, History, Layers,
  Banknote, Coins, CircleDollarSign
} from 'lucide-react';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Tooltip, Legend } from 'chart.js';
import { Bar } from 'react-chartjs-2';
import toast from 'react-hot-toast';
import api from '../../api/client';
import { useAuth } from '../../contexts/AuthContext';

import carIcon from '../../components/icons/car.svg?raw';
import motorbikeIcon from '../../components/icons/motorbike.svg?raw';
import zapIcon from '../../components/icons/zap.svg?raw';
import truckIcon from '../../components/icons/truck.svg?raw';

function SvgIcon({ raw, className = "w-5 h-5" }: { raw: string; className?: string }) {
  return (
    <span
      className={`inline-flex items-center justify-center shrink-0 [&>svg]:w-full [&>svg]:h-full [&>svg]:stroke-current ${className}`}
      dangerouslySetInnerHTML={{ __html: raw }}
    />
  );
}

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend);

interface StatCardProps {
  title: string;
  value: string | number;
  unit?: string;
  icon?: any;
  iconRaw?: string;
  bannerBg: string;
  className?: string;
}

const StatCard = ({ title, value, unit, icon: Icon, iconRaw, bannerBg, className = '' }: StatCardProps) => (
  <div
    className={`bg-white rounded-none shadow-[0_4px_16px_rgba(0,0,0,0.14)] hover:shadow-[0_12px_28px_rgba(0,0,0,0.22)] hover:-translate-y-1 transition-all duration-200 flex flex-col h-full overflow-hidden select-none ${className}`}
    style={{ borderRadius: 0 }}
  >
    {/* Top solid colored banner with centered icon (No border, No gradient) */}
    <div
      className={`${bannerBg} py-2.5 sm:py-3 flex justify-center items-center text-white shrink-0`}
      style={{ borderRadius: 0 }}
    >
      {iconRaw ? (
        <SvgIcon raw={iconRaw} className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
      ) : Icon ? (
        <Icon size={24} className="text-white shrink-0" />
      ) : null}
    </div>

    {/* Body content */}
    <div className="p-3 sm:p-3.5 text-center flex flex-col items-center justify-center flex-1 bg-white">
      <p className="text-xs sm:text-[13px] font-bold text-gray-700 leading-snug mb-1 text-center">{title}</p>
      <div className="flex items-baseline justify-center mt-0.5">
        <span className="text-base sm:text-lg md:text-[20px] font-black text-gray-900 tracking-tight leading-none">
          {value}{unit ? `/${unit}` : ''}
        </span>
      </div>
    </div>
  </div>
);

const ChartBox = ({ title, icon: Icon, colorClass, chartData, unit, loading }: any) => (
  <div
    className="bg-white p-4 shadow-[0_4px_12px_rgba(0,0,0,0.12)] rounded-none mt-3"
    style={{ borderRadius: 0 }}
  >
    <div className="flex items-center gap-2 mb-3 pb-1">
      <div className={`p-1.5 rounded-none ${colorClass}`} style={{ borderRadius: 0 }}>
        <Icon size={18} className="shrink-0" />
      </div>
      <h3 className="text-base md:text-[17px] font-bold text-gray-900">{title}</h3>
    </div>
    <div className="h-64 w-full relative">
      {loading ? (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/80 z-10 border border-dashed border-gray-200">
          <Loader2 size={24} className="text-[#F9A825] animate-spin mb-2" />
          <p className="text-xs text-gray-500 font-bold">ກຳລັງໂຫຼດ...</p>
        </div>
      ) : !chartData || chartData.datasets[0].data.length === 0 ? (
        <div className="absolute inset-0 flex flex-col items-center justify-center border border-dashed border-gray-200 bg-gray-50/50">
          <BarChart3 size={32} className="text-gray-300 mb-2" />
          <p className="text-sm text-gray-500 font-bold">ບໍ່ມີຂໍ້ມູນ</p>
        </div>
      ) : (
        <Bar data={chartData} options={{
          responsive: true, maintainAspectRatio: false,
          plugins: {
            legend: { display: false },
            tooltip: {
              backgroundColor: 'rgba(17, 24, 39, 0.9)', titleFont: { family: 'Inter', size: 12 }, bodyFont: { family: 'Inter', size: 13, weight: 'bold' as const }, padding: 10, cornerRadius: 0, displayColors: false,
              callbacks: { label: (ctx: any) => `${ctx.dataset.label}: ${new Intl.NumberFormat('lo-LA').format(ctx.parsed.y)} ${unit}` }
            }
          },
          scales: {
            x: { ticks: { color: '#4B5563', font: { family: 'Inter', weight: 'bold' } }, grid: { display: true, color: 'rgba(229,231,235,0.5)' }, border: { display: false } },
            y: { beginAtZero: true, ticks: { color: '#4B5563', font: { family: 'Inter', weight: 'bold' }, callback: (value: any) => new Intl.NumberFormat('lo-LA', { notation: "compact" }).format(value) }, grid: { display: true, color: 'rgba(229,231,235,0.5)' }, border: { display: false } }
          },
          interaction: { intersect: false, mode: 'index' as const },
        }} />
      )}
    </div>
  </div>
);

export default function Statistics() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'ADMIN';
  const [period] = useState<'daily' | 'monthly' | 'yearly'>('daily');
  const [dateFrom] = useState(new Date(Date.now() - 30 * 86400000).toISOString().split('T')[0]);
  const [dateTo] = useState(new Date().toISOString().split('T')[0]);

  const [stats, setStats] = useState<any>(null);
  const [revData, setRevData] = useState<any>(null);
  const [vehInData, setVehInData] = useState<any>(null);
  const [vehOutData, setVehOutData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

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
      setLastUpdated(new Date());
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
      backgroundColor: '#3B82F6', borderWidth: 0, hoverBackgroundColor: '#2563EB', borderRadius: 0,
    }],
  } : null;

  const chartVehOut = vehOutData ? {
    labels: vehOutData.data?.map((d: any) => d.date) || [],
    datasets: [{
      label: 'ລົດອອກ', data: vehOutData.data?.map((d: any) => d.total) || [],
      backgroundColor: '#7C3AED', borderWidth: 0, hoverBackgroundColor: '#6D28D9', borderRadius: 0,
    }],
  } : null;

  const chartRev = revData ? {
    labels: revData.data?.map((d: any) => d.date) || [],
    datasets: [{
      label: 'ລາຍຮັບ', data: revData.data?.map((d: any) => d.total) || [],
      backgroundColor: '#10B981', borderWidth: 0, hoverBackgroundColor: '#059669', borderRadius: 0,
    }],
  } : null;

  return (
    <div className="font-sans w-full flex flex-col pb-6">
      {/* Main Container Card */}
      <div
        className="shadow-[0_12px_36px_rgba(0,0,0,0.22),0_4px_14px_rgba(0,0,0,0.12)] rounded-none overflow-visible w-full border-0 flex flex-col"
        style={{ borderRadius: 0 }}
      >
        {/* Top Header Bar — Dark Gray (#5D5D5D) */}
        <div
          className="bg-[#5D5D5D] px-3 py-2.5 md:py-0 min-h-[60px] md:h-16 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-2 md:gap-3 lg:gap-3 rounded-none shrink-0"
          style={{ borderRadius: 0 }}
        >
          {/* Left: Icon + Title */}
          <div className="flex items-center justify-between w-full md:w-auto h-10">
            <div className="flex items-center gap-2.5">
              <BarChart3 size={20} className="w-5 h-5 text-white shrink-0" />
              <h1 className="text-base md:text-[17px] font-bold text-white tracking-normal whitespace-nowrap">
                ສະຖິຕິ
              </h1>
            </div>
          </div>

          {/* Right: Refresh button */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={load}
              disabled={loading}
              className="bg-white hover:bg-gray-100 active:bg-gray-200 text-black font-bold h-10 px-4 flex items-center justify-center gap-2 text-base md:text-[17px] transition-colors shadow-sm rounded-none border-0 outline-none cursor-pointer"
              style={{ borderRadius: 0 }}
            >
              <RefreshCw size={17} className={`text-black shrink-0 ${loading ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>
          </div>
        </div>

        {/* Top Red Stripe Divider */}
        <div className="h-[2.5px] bg-[#B02019] w-full shrink-0" />

        {/* Main Body — Orange Background */}
        <div className="bg-[#F9A825] p-3.5 flex flex-col justify-start space-y-3.5">
          {/* SECTION 1: CHECK IN */}
          <div>
            <div className="flex items-center gap-2 text-black font-bold text-base md:text-[17px] mb-3.5">
              <LogIn size={20} className="text-black shrink-0" />
              <span>ລົດເຂົ້າ (Check In)</span>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-2.5 sm:gap-3">
              <StatCard title="ລົດກຳລັງຈອດ" value={fmt(stats?.vehicles?.parked)} unit="ຄັນ" icon={CircleParking} bannerBg="bg-[#B02019]" />
              <StatCard title="ລົດເຂົ້າວັນນີ້" value={fmt(stats?.vehicles?.in?.today)} unit="ຄັນ" icon={LogIn} bannerBg="bg-[#1D4ED8]" />
              <StatCard title="ລົດເຂົ້າເດືອນນີ້" value={fmt(stats?.vehicles?.in?.month)} unit="ຄັນ" icon={CalendarDays} bannerBg="bg-[#0D9488]" />
              <StatCard title="ລົດເຂົ້າປີນີ້" value={fmt(stats?.vehicles?.in?.year)} unit="ຄັນ" icon={CalendarRange} bannerBg="bg-[#4F46E5]" />
              <StatCard title="ລົດເຂົ້າທັງໝົດ" value={fmt(stats?.vehicles?.in?.all)} unit="ຄັນ" icon={TrendingUp} bannerBg="bg-[#334155]" className="col-span-2 sm:col-span-1 md:col-span-1" />
            </div>
            <ChartBox title="ກຣາຟສະຖິຕິລົດເຂົ້າ" icon={BarChart3} colorClass="bg-blue-50 text-blue-600" chartData={chartVehIn} unit="ຄັນ" loading={loading} />
          </div>

          {/* SECTION 2: CHECK OUT */}
          <div>
            <div className="flex items-center gap-2 text-black font-bold text-base md:text-[17px] mb-3.5">
              <LogOut size={20} className="text-black shrink-0 rotate-180" />
              <span>ລົດອອກ (Check Out)</span>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 sm:gap-3">
              <StatCard title="ລົດອອກວັນນີ້" value={fmt(stats?.vehicles?.out?.today)} unit="ຄັນ" icon={LogOut} bannerBg="bg-[#7C3AED]" />
              <StatCard title="ລົດອອກເດືອນນີ້" value={fmt(stats?.vehicles?.out?.month)} unit="ຄັນ" icon={CalendarCheck2} bannerBg="bg-[#C026D3]" />
              <StatCard title="ລົດອອກປີນີ້" value={fmt(stats?.vehicles?.out?.year)} unit="ຄັນ" icon={History} bannerBg="bg-[#BE123C]" />
              <StatCard title="ລົດອອກທັງໝົດ" value={fmt(stats?.vehicles?.out?.all)} unit="ຄັນ" icon={Layers} bannerBg="bg-[#1E1B4B]" />
            </div>
            <ChartBox title="ກຣາຟສະຖິຕິລົດອອກ" icon={BarChart3} colorClass="bg-orange-50 text-orange-600" chartData={chartVehOut} unit="ຄັນ" loading={loading} />
          </div>

          {/* SECTION 3: REVENUE */}
          {isAdmin && (
            <div>
              <div className="flex items-center gap-2 text-black font-bold text-base md:text-[17px] mb-3.5">
                <Wallet size={20} className="text-black shrink-0" />
                <span>ລາຍຮັບ (Revenue)</span>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 sm:gap-3">
                <StatCard title="ລາຍຮັບວັນນີ້" value={fmt(stats?.revenue?.today)} unit="₭" icon={Wallet} bannerBg="bg-[#059669]" />
                <StatCard title="ລາຍຮັບເດືອນນີ້" value={fmt(stats?.revenue?.month)} unit="₭" icon={Banknote} bannerBg="bg-[#0F766E]" />
                <StatCard title="ລາຍຮັບປີນີ້" value={fmt(stats?.revenue?.year)} unit="₭" icon={Coins} bannerBg="bg-[#0284C7]" />
                <StatCard title="ລາຍຮັບລວມທັງໝົດ" value={fmt(stats?.revenue?.all)} unit="₭" icon={CircleDollarSign} bannerBg="bg-[#14532D]" />
              </div>
              <ChartBox title="ກຣາຟແທ່ງສະຖິຕິລາຍຮັບ (Column Chart)" icon={BarChart3} colorClass="bg-emerald-50 text-emerald-600" chartData={chartRev} unit="₭" loading={loading} />
            </div>
          )}

          {/* SECTION 4: VEHICLE TYPES */}
          <div>
            <div className="flex items-center gap-2 text-black font-bold text-base md:text-[17px] mb-3.5">
              <BarChart3 size={20} className="text-black shrink-0" />
              <span>ປະເພດລົດ (Vehicle Types)</span>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 sm:gap-3">
              {[
                { key: 'car', label: 'ລົດໃຫຍ່', raw: carIcon, bg: 'bg-[#B02019]' },
                { key: 'motorcycle', label: 'ລົດຈັກ', raw: motorbikeIcon, bg: 'bg-[#1D4ED8]' },
                { key: 'ev_motorcycle', label: 'ລົດໄຟຟ້າ', raw: zapIcon, bg: 'bg-[#059669]' },
                { key: 'truck', label: 'ລົດບັນທຸກ', raw: truckIcon, bg: 'bg-[#7C3AED]' }
              ].map((v) => {
                const typeData = stats?.vehicles?.byType?.find((t: any) => t.name === v.key) || { count: 0 };
                return (
                  <StatCard
                    key={v.key}
                    title={v.label}
                    value={fmt(typeData.count)}
                    unit="ຄັນ"
                    iconRaw={v.raw}
                    bannerBg={v.bg}
                  />
                );
              })}
            </div>
          </div>
        </div>

        {/* Bottom Red Stripe Divider */}
        <div className="h-[2.5px] bg-[#B02019] w-full shrink-0" />

        {/* Bottom Footer Bar — Dark Gray (matching CheckOut footer) */}
        <div
          className="bg-[#5D5D5D] px-3 py-3 md:py-0 min-h-[60px] md:h-16 flex flex-col sm:flex-row items-center justify-between gap-3 rounded-none shrink-0"
          style={{ borderRadius: 0 }}
        >
          {/* Left: Parked count badge (Square w-10 h-10) */}
          <div className="flex items-center gap-2 text-white font-bold text-base md:text-[17px]">
            <span>ລົດກຳລັງຈອດ</span>
            <span
              className="bg-[#B02019] text-white h-10 min-w-10 px-2 flex items-center justify-center text-base md:text-[17px] font-bold shadow-sm rounded-none border-0 shrink-0 text-center"
              style={{ borderRadius: 0 }}
            >
              {stats?.vehicles?.parked ?? 0}
            </span>
            <span>ຄັນ</span>
          </div>

          {/* Right: Summary info */}
          <div className="flex items-center gap-2 text-white font-bold text-base md:text-[17px]">
            <span>ອັບເດດລ່າສຸດ: {lastUpdated.toLocaleDateString('lo-LA')} {lastUpdated.toLocaleTimeString('lo-LA')}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
