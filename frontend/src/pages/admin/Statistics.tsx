/**
 * ໂມດູນຫນ້າສະຖິຕິລະບົບ PARKO (Statistics Page)
 * ສ່ວນຕິດຕໍ່ຜູ້ໃຊ້ງານລະດັບຜູ້ບໍລິຫານ (Admin) ແລະ ພະນັກງານ (Staff) ເພື່ອສະແດງກຣາຟ ແລະ ບັດສະຖິຕິ
 * ສະຫຼຸບລົດເຂົ້າ, ລົດອອກ, ລາຍຮັບ ແລະ ປະເພດພາຫະນະຕ່າງໆໃນລະບົບບ່ອນຈອດລົດ.
 */
import React, { useState, useEffect } from 'react';
import {
  Wallet, Loader2, RefreshCw,
  LogIn, LogOut, BarChart3,
  CircleParking, CalendarDays, CalendarRange, TrendingUp,
  CalendarCheck2, History, Layers,
  Banknote, Coins, CircleDollarSign,
  FileWarning, AlertTriangle, CheckCircle2, Clock,
  ChevronRight, ExternalLink, FileText
} from 'lucide-react';
import { Link } from 'react-router-dom';
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
    {/* ແຖບຫົວກາດສີທຶບພ້ອມໄອຄອນຢູ່ເຄິ່ງກາງ (Top Solid Colored Banner) ບໍ່ມີເສັ້ນຂອບ ແລະ ບໍ່ມີສີໄລ່ລະດັບ */}
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

    {/* ສ່ວນເນື້ອໃນຫຼັກຂອງກາດສະຖິຕິ (StatCard Body Content) ສະແດງຫົວຂໍ້, ຕົວເລກສະຖິຕິ ແລະ ຫົວໜ່ວຍ */}
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
  const [lostData, setLostData] = useState<any>(null);
  const [lostChartData, setLostChartData] = useState<any>(null);
  const [recentCases, setRecentCases] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  const load = async () => {
    setLoading(true);
    try {
      const dateToEnd = dateTo + 'T23:59:59';
      const [s, r, vi, vo, ltReport, ltList] = await Promise.allSettled([
        api.get(`/reports/dashboard-stats`),
        api.get(`/reports/revenue?period=${period}&dateFrom=${dateFrom}&dateTo=${dateToEnd}`),
        api.get(`/reports/vehicles?period=${period}&dateFrom=${dateFrom}&dateTo=${dateToEnd}&type=in`),
        api.get(`/reports/vehicles?period=${period}&dateFrom=${dateFrom}&dateTo=${dateToEnd}&type=out`),
        api.get(`/reports/lost-tickets?period=${period}&dateFrom=${dateFrom}&dateTo=${dateToEnd}`),
        api.get(`/lost-tickets?limit=5`),
      ]);

      let statsObj: any = null;
      if (s.status === 'fulfilled') {
        statsObj = s.value.data?.data || s.value.data;
        setStats(statsObj);
        if (statsObj?.lostTickets) {
          setLostData(statsObj.lostTickets);
        }
      }

      if (r.status === 'fulfilled') {
        setRevData(r.value.data?.data || r.value.data);
      }
      if (vi.status === 'fulfilled') {
        setVehInData(vi.value.data?.data || vi.value.data);
      }
      if (vo.status === 'fulfilled') {
        setVehOutData(vo.value.data?.data || vo.value.data);
      }
      if (ltReport.status === 'fulfilled') {
        const ltr = ltReport.value.data?.data || ltReport.value.data;
        setLostChartData(ltr);
        if (ltr?.summary) {
          setLostData((prev: any) => ({
            today: prev?.today ?? 0,
            month: prev?.month ?? 0,
            year: prev?.year ?? 0,
            all: ltr.summary.totalCases ?? 0,
            pending: ltr.summary.pendingCases ?? 0,
            resolved: ltr.summary.resolvedCases ?? 0,
            escalated: ltr.summary.escalatedCases ?? 0,
            totalPenalty: ltr.summary.totalPenalty ?? 0,
          }));
        }
      }
      if (ltList.status === 'fulfilled') {
        const listData = ltList.value.data?.data || ltList.value.data;
        setRecentCases(listData?.cases || []);
      }

      // Fallback: ຖ້າ backend ຍັງບໍ່ທັນສົ່ງ lostTickets ມາໃນ dashboard-stats
      if (!statsObj?.lostTickets) {
        try {
          const { data: allCasesResp } = await api.get('/lost-tickets?limit=100');
          const allCases = (allCasesResp?.data?.cases || allCasesResp?.cases || []) as any[];
          const now = new Date();
          const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
          const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
          const startOfYear = new Date(now.getFullYear(), 0, 1).getTime();

          const todayCount = allCases.filter(c => new Date(c.createdAt).getTime() >= startOfToday).length;
          const monthCount = allCases.filter(c => new Date(c.createdAt).getTime() >= startOfMonth).length;
          const yearCount = allCases.filter(c => new Date(c.createdAt).getTime() >= startOfYear).length;
          const pendingCount = allCases.filter(c => c.resolution === 'PENDING').length;
          const resolvedCount = allCases.filter(c => c.resolution === 'RESOLVED').length;
          const escalatedCount = allCases.filter(c => c.resolution === 'ESCALATED').length;
          const totalPenalty = allCases.reduce((sum, c) => sum + Number(c.penaltyAmount || 0), 0);

          setLostData({
            today: todayCount,
            month: monthCount,
            year: yearCount,
            all: allCasesResp?.pagination?.total ?? allCases.length,
            pending: pendingCount,
            resolved: resolvedCount,
            escalated: escalatedCount,
            totalPenalty: totalPenalty,
          });

          if (ltReport.status !== 'fulfilled' || !ltReport.value.data) {
            const dateMap = new Map<string, number>();
            allCases.forEach(c => {
              const dStr = new Date(c.createdAt).toISOString().split('T')[0];
              dateMap.set(dStr, (dateMap.get(dStr) || 0) + 1);
            });
            const sortedDates = Array.from(dateMap.keys()).sort();
            setLostChartData({
              data: sortedDates.map(d => ({ date: d, total: dateMap.get(d) || 0 }))
            });
          }
        } catch {
          // Ignored fallback
        }
      }

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

  const chartLost = lostChartData ? {
    labels: lostChartData.data?.map((d: any) => d.date) || [],
    datasets: [{
      label: 'ປີ້ເສຍ', data: lostChartData.data?.map((d: any) => d.total) || [],
      backgroundColor: '#EA580C', borderWidth: 0, hoverBackgroundColor: '#C2410C', borderRadius: 0,
    }],
  } : null;

  return (
    <div className="font-sans w-full flex flex-col pb-6">
      {/* ກາດບັນຈຸຫຼັກຂອງໜ້າສະຖິຕິ (Main Container Card) */}
      <div
        className="shadow-[0_12px_36px_rgba(0,0,0,0.22),0_4px_14px_rgba(0,0,0,0.12)] rounded-none overflow-visible w-full border-0 flex flex-col"
        style={{ borderRadius: 0 }}
      >
        {/* ແຖບຫົວດ້ານເທິງສຸດ (Top Header Bar) ພື້ນຫຼັງສີເທົາເຂັ້ມ (#5D5D5D) */}
        <div
          className="bg-[#5D5D5D] px-3 py-2.5 md:py-0 min-h-[60px] md:h-16 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-2 md:gap-3 lg:gap-3 rounded-none shrink-0"
          style={{ borderRadius: 0 }}
        >
          {/* ດ້ານຊ້າຍ: ໄອຄອນ ແລະ ຊື່ໜ້າສະຖິຕິ */}
          <div className="flex items-center justify-between w-full md:w-auto h-10">
            <div className="flex items-center gap-2.5">
              <BarChart3 size={20} className="w-5 h-5 text-white shrink-0" />
              <h1 className="text-base md:text-[17px] font-bold text-white tracking-normal whitespace-nowrap">
                ສະຖິຕິ
              </h1>
            </div>
          </div>

          {/* ດ້ານຂວາ: ປຸ່ມໂຫຼດຂໍ້ມູນຄືນໃໝ່ (Refresh Button) */}
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

        {/* ເສັ້ນຂັ້ນສີແດງດ້ານເທິງ (Top Red Stripe Divider) */}
        <div className="h-[2.5px] bg-[#B02019] w-full shrink-0" />

        {/* ສ່ວນເນື້ອໃນຫຼັກ (Main Body) ພື້ນຫຼັງສີສົ້ມເຫຼືອງ (#F9A825) */}
        <div className="bg-[#F9A825] p-3.5 flex flex-col justify-start space-y-3.5">
          {/* ໝວດທີ 1: ສະຖິຕິລົດເຂົ້າ (Section 1: Check In Statistics) */}
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

          {/* ໝວດທີ 2: ສະຖິຕິລົດອອກ (Section 2: Check Out Statistics) */}
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

          {/* ໝວດທີ 3: ສະຖິຕິລາຍຮັບ (Section 3: Revenue Statistics) */}
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

          {/* ໝວດທີ 4: ສະຖິຕິແຍກຕາມປະເພດພາຫະນະ (Section 4: Vehicle Types Statistics) */}
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

          {/* ໝວດທີ 5: ສະຖິຕິລົດປີ້ຫາຍ (Section 5: Lost Ticket Statistics) */}
          <div>
            <div className="flex items-center justify-between mb-3.5">
              <div className="flex items-center gap-2 text-black font-bold text-base md:text-[17px]">
                <FileWarning size={20} className="text-black shrink-0" />
                <span>ລົດປີ້ຫາຍ / ປີ້ເສຍ (Lost Tickets)</span>
              </div>
              <Link
                to="/admin/lost-tickets"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-gray-100 text-black text-xs md:text-sm font-bold shadow-sm transition-all border border-gray-200"
                style={{ borderRadius: 0 }}
              >
                <span>ຈັດການປີ້ເສຍທັງໝົດ</span>
                <ChevronRight size={15} />
              </Link>
            </div>

            {/* ບັດສະຖິຕິລົດປີ້ຫາຍ (Lost Ticket Stat Cards) */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 sm:gap-3">
              <StatCard
                title="ປີ້ເສຍວັນນີ້"
                value={fmt(lostData?.today ?? stats?.lostTickets?.today)}
                unit="ກໍລະນີ"
                icon={FileWarning}
                bannerBg="bg-[#D97706]"
              />
              <StatCard
                title="ປີ້ເສຍເດືອນນີ້"
                value={fmt(lostData?.month ?? stats?.lostTickets?.month)}
                unit="ກໍລະນີ"
                icon={CalendarDays}
                bannerBg="bg-[#7C3AED]"
              />
              <StatCard
                title="ລໍຖ້າແກ້ໄຂ"
                value={fmt(lostData?.pending ?? stats?.lostTickets?.pending)}
                unit="ກໍລະນີ"
                icon={Clock}
                bannerBg="bg-[#DC2626]"
              />
              <StatCard
                title="ແກ້ໄຂສຳເລັດ"
                value={fmt(lostData?.resolved ?? stats?.lostTickets?.resolved)}
                unit="ກໍລະນີ"
                icon={CheckCircle2}
                bannerBg="bg-[#059669]"
              />
              <StatCard
                title="ປີ້ເສຍທັງໝົດ"
                value={fmt(lostData?.all ?? stats?.lostTickets?.all)}
                unit="ກໍລະນີ"
                icon={Layers}
                bannerBg="bg-[#1E293B]"
              />
              <StatCard
                title="ລວມຄ່າປັບໃໝ"
                value={fmt(lostData?.totalPenalty ?? stats?.lostTickets?.totalPenalty)}
                unit="₭"
                icon={CircleDollarSign}
                bannerBg="bg-[#B02019]"
              />
            </div>

            {/* ກຣາຟສະຖິຕິປີ້ເສຍ (Lost Ticket Chart) */}
            <ChartBox
              title="ກຣາຟສະຖິຕິລົດປີ້ຫາຍ (Lost Ticket Trend)"
              icon={FileWarning}
              colorClass="bg-amber-50 text-amber-600"
              chartData={chartLost}
              unit="ກໍລະນີ"
              loading={loading}
            />

            {/* ກາດລາຍການລົດປີ້ຫາຍລ່າສຸດ (Recent Lost Ticket Vehicles Card) */}
            <div
              className="bg-white p-4 shadow-[0_4px_12px_rgba(0,0,0,0.12)] rounded-none mt-3"
              style={{ borderRadius: 0 }}
            >
              <div className="flex items-center justify-between mb-3 pb-1 border-b border-gray-100">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-none bg-red-50 text-red-600" style={{ borderRadius: 0 }}>
                    <AlertTriangle size={18} className="shrink-0" />
                  </div>
                  <h3 className="text-base md:text-[17px] font-bold text-gray-900">
                    ລາຍການລົດປີ້ຫາຍລ່າສຸດ (Recent Lost Ticket Cases)
                  </h3>
                </div>
                <div className="flex items-center gap-2">
                  <Link
                    to="/admin/reports"
                    className="inline-flex items-center gap-1 px-2.5 py-1 bg-[#B02019] hover:bg-[#8e1913] text-white text-xs font-bold shadow-sm transition-all rounded-none"
                    style={{ borderRadius: 0 }}
                  >
                    <FileText size={13} />
                    <span>ລາຍງານ PDF</span>
                  </Link>
                  <Link
                    to="/admin/lost-tickets"
                    className="text-xs md:text-sm font-bold text-[#B02019] hover:underline inline-flex items-center gap-1"
                  >
                    <span>ເບິ່ງທັງໝົດ</span>
                    <ExternalLink size={14} />
                  </Link>
                </div>
              </div>

              {recentCases.length === 0 ? (
                <div className="py-8 text-center text-gray-500 font-medium text-sm">
                  ບໍ່ມີລາຍການລົດປີ້ຫາຍໃນລະບົບ
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs md:text-sm">
                    <thead>
                      <tr className="bg-gray-100 border-b border-gray-200 text-gray-700 font-bold uppercase text-[11px] md:text-xs">
                        <th className="py-2.5 px-3">ເລກປີ້</th>
                        <th className="py-2.5 px-3">ປ້າຍທະບຽນ</th>
                        <th className="py-2.5 px-3">ປະເພດລົດ</th>
                        <th className="py-2.5 px-3">ວັນທີແຈ້ງເສຍ</th>
                        <th className="py-2.5 px-3 text-right">ຄ່າປັບໃໝ</th>
                        <th className="py-2.5 px-3 text-center">ສະຖານະ</th>
                        <th className="py-2.5 px-3 text-right">ຈັດການ</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 font-medium">
                      {recentCases.map((c: any) => (
                        <tr key={c.id} className="hover:bg-amber-50/40 transition-colors">
                          <td className="py-2.5 px-3 font-bold text-gray-900 font-mono">
                            {c.ticket?.ticketNumber || '---'}
                          </td>
                          <td className="py-2.5 px-3 font-bold text-gray-800">
                            {c.ticket?.plateLetters ? `${c.ticket?.plateLetters} ` : ''}
                            {c.ticket?.plateNumber || '---'}
                            {c.ticket?.plateProvince ? (
                              <span className="text-[11px] text-gray-500 ml-1">({c.ticket?.plateProvince})</span>
                            ) : null}
                          </td>
                          <td className="py-2.5 px-3 text-gray-600">
                            {c.ticket?.vehicleType?.label || c.ticket?.vehicleType?.name || '---'}
                          </td>
                          <td className="py-2.5 px-3 text-gray-600 whitespace-nowrap">
                            {new Date(c.createdAt).toLocaleDateString('lo-LA')} {new Date(c.createdAt).toLocaleTimeString('lo-LA', { hour: '2-digit', minute: '2-digit' })}
                          </td>
                          <td className="py-2.5 px-3 text-right font-bold text-[#B02019] whitespace-nowrap">
                            {Number(c.penaltyAmount || 0).toLocaleString('lo-LA')} ₭
                          </td>
                          <td className="py-2.5 px-3 text-center">
                            <span
                              className={`inline-block px-2 py-0.5 text-[11px] font-bold ${
                                c.resolution === 'RESOLVED'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : c.resolution === 'ESCALATED'
                                  ? 'bg-purple-100 text-purple-800'
                                  : 'bg-red-100 text-red-800'
                              }`}
                            >
                              {c.resolution === 'RESOLVED'
                                ? 'ແກ້ໄຂແລ້ວ'
                                : c.resolution === 'ESCALATED'
                                ? 'ສົ່ງຕໍ່ກວດສອບ'
                                : 'ລໍຖ້າແກ້ໄຂ'}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-right">
                            <Link
                              to="/admin/lost-tickets"
                              className="text-xs font-bold text-[#1D4ED8] hover:text-[#1E40AF] underline"
                            >
                              ກວດສອບ
                            </Link>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ເສັ້ນຂັ້ນສີແດງດ້ານລຸ່ມ (Bottom Red Stripe Divider) */}
        <div className="h-[2.5px] bg-[#B02019] w-full shrink-0" />

        {/* ແຖບສ່ວນທ້າຍດ້ານລຸ່ມສຸດ (Bottom Footer Bar) ພື້ນຫຼັງສີເທົາເຂັ້ມ ສະແດງຈຳນວນລົດກຳລັງຈອດ ແລະ ເວລາອັບເດດລ່າສຸດ */}
        <div
          className="bg-[#5D5D5D] px-3 py-3 md:py-0 min-h-[60px] md:h-16 flex flex-col sm:flex-row items-center justify-between gap-3 rounded-none shrink-0"
          style={{ borderRadius: 0 }}
        >
          {/* ດ້ານຊ້າຍ: ປ້າຍສະແດງຈຳນວນລົດທີ່ກຳລັງຈອດຢູ່ໃນປັດຈຸບັນ */}
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

          {/* ດ້ານຂວາ: ຂໍ້ຄວາມສະແດງວັນທີ ແລະ ເວລາອັບເດດຂໍ້ມູນລ່າສຸດ */}
          <div className="flex items-center gap-2 text-white font-bold text-base md:text-[17px]">
            <span>ອັບເດດລ່າສຸດ: {lastUpdated.toLocaleDateString('lo-LA')} {lastUpdated.toLocaleTimeString('lo-LA')}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
