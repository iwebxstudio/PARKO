// PARKO — Reports & Export / ລາຍງານ (Admin & Staff)
// Redesigned to 4-Section Dashboard UI & New Export Format
import React, { useState, useEffect } from 'react';
import {
  CircleParking, LogIn, LogOut, CalendarDays, CalendarRange, CalendarCheck2,
  History, Layers, Wallet, Banknote, Coins, CircleDollarSign, Car,
  FileSpreadsheet, FileText, RefreshCw, Loader2
} from 'lucide-react';
import toast from 'react-hot-toast';
import * as XLSX from 'xlsx';
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

// Inline SVG strings for printable PDF documents
const svgParking = `<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2.2"><circle cx="12" cy="12" r="10"/><path d="M9 17V7h4a3 3 0 0 1 0 6H9"/></svg>`;
const svgLogIn = `<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/><polyline points="10 17 15 12 10 7"/><line x1="15" x2="3" y1="12" y2="12"/></svg>`;
const svgCalendar = `<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2.2"><rect width="18" height="18" x="3" y="4" rx="0"/><line x1="16" x2="16" y1="2" y2="6"/><line x1="8" x2="8" y1="2" y2="6"/><line x1="3" x2="21" y1="10" y2="10"/></svg>`;
const svgCalendarRange = `<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2.2"><rect width="18" height="18" x="3" y="4" rx="0"/><line x1="16" x2="16" y1="2" y2="6"/><line x1="8" x2="8" y1="2" y2="6"/><line x1="3" x2="21" y1="10" y2="10"/><path d="M17 14h-6"/><path d="M13 18H7"/><path d="M7 14h.01"/><path d="M17 18h.01"/></svg>`;
const svgLogOut = `<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" x2="9" y1="12" y2="12"/></svg>`;
const svgHistory = `<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/><path d="M12 7v5l4 2"/></svg>`;
const svgLayers = `<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="m12.83 2.18a2 2 0 0 0-1.66 0L2.6 6.08a1 1 0 0 0 0 1.83l8.58 3.91a2 2 0 0 0 1.66 0l8.58-3.9a1 1 0 0 0 0-1.83Z"/><path d="m22 12.65-9.17 4.16a2 2 0 0 1-1.66 0L2 12.65"/><path d="m22 17.65-9.17 4.16a2 2 0 0 1-1.66 0L2 17.65"/></svg>`;
const svgWallet = `<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M19 7V4a1 1 0 0 0-1-1H5a2 2 0 0 0 0 4h15a1 1 0 0 1 1 1v4h-3a2 2 0 0 0 0 4h3a1 1 0 0 0 1-1v-2a1 1 0 0 0-1-1"/><path d="M3 5v14a2 2 0 0 0 2 2h15a1 1 0 0 0 1-1v-4"/></svg>`;
const svgBanknote = `<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2.2"><rect width="20" height="12" x="2" y="6" rx="2"/><circle cx="12" cy="12" r="2"/><path d="M6 12h.01M18 12h.01"/></svg>`;
const svgCoins = `<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2.2"><circle cx="8" cy="8" r="6"/><path d="M18.09 10.37A6 6 0 1 1 10.34 18"/><path d="M7 6h1v4"/><path d="m16.71 13.88.7.71-2.82 2.82"/></svg>`;
const svgDollarCircle = `<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2.2"><circle cx="12" cy="12" r="10"/><path d="M16 8h-6a2 2 0 1 0 0 4h4a2 2 0 1 1 0 4H8"/><path d="M12 18V6"/></svg>`;
const svgCar = `<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.5 2.8C1.4 11.2 1 12.1 1 13v3c0 .6.4 1 1 1h2"/><circle cx="7" cy="17" r="2"/><path d="M9 17h6"/><circle cx="17" cy="17" r="2"/></svg>`;
const svgBike = `<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2.2"><circle cx="18.5" cy="17.5" r="3.5"/><circle cx="5.5" cy="17.5" r="3.5"/><circle cx="15" cy="5" r="1"/><path d="M12 17.5V14l-3-3 4-3 2 3h2"/></svg>`;
const svgZap = `<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2.2"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>`;
const svgTruck = `<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2"/><path d="M15 18H9"/><path d="M19 18h2a1 1 0 0 0 1-1v-3.65a1 1 0 0 0-.22-.624l-3.48-4.35A1 1 0 0 0 17.52 8H14"/><circle cx="17" cy="18.5" r="2.5"/><circle cx="6.5" cy="18.5" r="2.5"/></svg>`;

interface StatCardProps {
  title: string;
  value: string | number;
  unit?: string;
  icon?: any;
  iconRaw?: string;
  bannerBg: string;
}

const StatCard = ({ title, value, unit, icon: Icon, iconRaw, bannerBg }: StatCardProps) => (
  <div
    className="bg-white rounded-none shadow-[0_4px_16px_rgba(0,0,0,0.14)] hover:shadow-[0_12px_28px_rgba(0,0,0,0.22)] hover:-translate-y-1 transition-all duration-200 flex flex-col h-full overflow-hidden select-none"
    style={{ borderRadius: 0 }}
  >
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

export default function Reports() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'ADMIN';

  const defaultDateFrom = new Date(Date.now() - 30 * 86400000).toISOString().split('T')[0];
  const defaultDateTo = new Date().toISOString().split('T')[0];

  // Dates for 4 Sections
  const [dateFrom1, setDateFrom1] = useState(defaultDateFrom);
  const [dateTo1, setDateTo1] = useState(defaultDateTo);

  const [dateFrom2, setDateFrom2] = useState(defaultDateFrom);
  const [dateTo2, setDateTo2] = useState(defaultDateTo);

  const [dateFrom3, setDateFrom3] = useState(defaultDateFrom);
  const [dateTo3, setDateTo3] = useState(defaultDateTo);

  const [dateFrom4, setDateFrom4] = useState(defaultDateFrom);
  const [dateTo4, setDateTo4] = useState(defaultDateTo);

  // Data States
  const [stats, setStats] = useState<any>(null);
  const [vehInData, setVehInData] = useState<any>(null);
  const [vehOutData, setVehOutData] = useState<any>(null);
  const [revData, setRevData] = useState<any>(null);

  // Loading States
  const [loadingStats, setLoadingStats] = useState(false);
  const [loading1, setLoading1] = useState(false);
  const [loading2, setLoading2] = useState(false);
  const [loading3, setLoading3] = useState(false);
  const [loading4, setLoading4] = useState(false);
  const [exportingSection, setExportingSection] = useState<string | null>(null);

  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  const fmt = (n: number | undefined) => (n !== undefined ? new Intl.NumberFormat('lo-LA').format(n) : '0');

  // Load dashboard stats and initial data
  const loadInitial = async () => {
    setLoadingStats(true);
    try {
      const [s, vi, vo, r] = await Promise.all([
        api.get('/reports/dashboard-stats'),
        api.get(`/reports/vehicles?period=daily&dateFrom=${defaultDateFrom}&dateTo=${defaultDateTo}T23:59:59&type=in`),
        api.get(`/reports/vehicles?period=daily&dateFrom=${defaultDateFrom}&dateTo=${defaultDateTo}T23:59:59&type=out`),
        api.get(`/reports/revenue?period=daily&dateFrom=${defaultDateFrom}&dateTo=${defaultDateTo}T23:59:59`),
      ]);
      setStats(s.data?.data || s.data);
      setVehInData(vi.data?.data || vi.data);
      setVehOutData(vo.data?.data || vo.data);
      setRevData(r.data?.data || r.data);
      setLastUpdated(new Date());
    } catch {
      toast.error('ໂຫຼດຂໍ້ມູນບໍ່ສຳເລັດ (Failed to load dashboard data)');
    } finally {
      setLoadingStats(false);
    }
  };

  useEffect(() => {
    loadInitial();
  }, []);

  // Fetch Section 1: Check In
  const fetchCheckIn = async (from = dateFrom1, to = dateTo1) => {
    setLoading1(true);
    try {
      const res = await api.get(`/reports/vehicles?period=daily&dateFrom=${from}&dateTo=${to}T23:59:59&type=in`);
      const data = res.data?.data || res.data;
      setVehInData(data);
      const total = data?.data?.reduce((sum: number, d: any) => sum + (Number(d.total) || 0), 0) || 0;
      toast.success(`ດຶງຂໍ້ມູນລົດເຂົ້າສຳເລັດ: ${fmt(total)} ຄັນ`);
      setLastUpdated(new Date());
      return data;
    } catch {
      toast.error('ດຶງຂໍ້ມູນລົດເຂົ້າບໍ່ສຳເລັດ');
      return null;
    } finally {
      setLoading1(false);
    }
  };

  // Fetch Section 2: Check Out
  const fetchCheckOut = async (from = dateFrom2, to = dateTo2) => {
    setLoading2(true);
    try {
      const res = await api.get(`/reports/vehicles?period=daily&dateFrom=${from}&dateTo=${to}T23:59:59&type=out`);
      const data = res.data?.data || res.data;
      setVehOutData(data);
      const total = data?.data?.reduce((sum: number, d: any) => sum + (Number(d.total) || 0), 0) || 0;
      toast.success(`ດຶງຂໍ້ມູນລົດອອກສຳເລັດ: ${fmt(total)} ຄັນ`);
      setLastUpdated(new Date());
      return data;
    } catch {
      toast.error('ດຶງຂໍ້ມູນລົດອອກບໍ່ສຳເລັດ');
      return null;
    } finally {
      setLoading2(false);
    }
  };

  // Fetch Section 3: Revenue
  const fetchRevenue = async (from = dateFrom3, to = dateTo3) => {
    setLoading3(true);
    try {
      const res = await api.get(`/reports/revenue?period=daily&dateFrom=${from}&dateTo=${to}T23:59:59`);
      const data = res.data?.data || res.data;
      setRevData(data);
      const total = data?.data?.reduce((sum: number, d: any) => sum + (Number(d.total) || 0), 0) || 0;
      toast.success(`ດຶງຂໍ້ມູນລາຍຮັບສຳເລັດ: ${fmt(total)} ₭`);
      setLastUpdated(new Date());
      return data;
    } catch {
      toast.error('ດຶງຂໍ້ມູນລາຍຮັບບໍ່ສຳເລັດ');
      return null;
    } finally {
      setLoading3(false);
    }
  };

  // Fetch Section 4: Vehicle Types
  const fetchVehicleTypes = async () => {
    setLoading4(true);
    try {
      const s = await api.get('/reports/dashboard-stats');
      setStats(s.data?.data || s.data);
      toast.success('ດຶງຂໍ້ມູນປະເພດລົດສຳເລັດ');
      setLastUpdated(new Date());
    } catch {
      toast.error('ດຶງຂໍ້ມູນປະເພດລົດບໍ່ສຳເລັດ');
    } finally {
      setLoading4(false);
    }
  };

  // Counts for Section 4
  const carParked = stats?.vehicles?.byType?.find((v: any) => v.name === 'car' || v.label === 'ລົດໃຫຍ່')?.count || 0;
  const bikeParked = stats?.vehicles?.byType?.find((v: any) => v.name === 'motorcycle' || v.label === 'ລົດຈັກ')?.count || 0;
  const evParked = stats?.vehicles?.byType?.find((v: any) => v.name === 'ev_motorcycle' || v.label?.includes('ໄຟຟ້າ'))?.count || 0;
  const truckParked = stats?.vehicles?.byType?.find((v: any) => v.name === 'truck' || v.label === 'ລົດບັນທຸກ')?.count || 0;

  // Helper to render HTML StatCard for PDF
  const renderPdfCard = (title: string, value: string | number, unit: string, bg: string, svg: string) => `
    <div class="stat-card">
      <div class="stat-banner" style="background-color: ${bg};">
        ${svg}
      </div>
      <div class="stat-body">
        <div class="stat-title">${title}</div>
        <div class="stat-value">${value}${unit ? `/${unit}` : ''}</div>
      </div>
    </div>
  `;

  // =========================================================
  // PDF EXPORT (COMPLETELY REPLACED WITH NEW DATA FORMAT)
  // =========================================================
  const exportPdfSection = async (section: 1 | 2 | 3 | 4 | 'all') => {
    setExportingSection(`pdf-${section}`);
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      toast.error('ກະລຸນາອະນຸຍາດ Popup ເພື່ອສ້າງ PDF (Please allow popups)');
      setExportingSection(null);
      return;
    }

    let title = '';
    let dateRangeStr = '';
    let contentHtml = '';

    if (section === 1) {
      title = 'ລາຍງານລົດເຂົ້າ (Check In Report)';
      dateRangeStr = `ຊ່ວງວັນທີ: ${dateFrom1} ເຖິງ ${dateTo1}`;
      let curData = vehInData;
      if (!curData) curData = await fetchCheckIn(dateFrom1, dateTo1);
      const totalIn = curData?.data?.reduce((sum: number, d: any) => sum + (Number(d.total) || 0), 0) || 0;

      contentHtml = `
        <div class="card-grid">
          ${renderPdfCard('ລົດກຳລັງຈອດ', fmt(stats?.vehicles?.parked), 'ຄັນ', '#B02019', svgParking)}
          ${renderPdfCard('ລົດເຂົ້າວັນນີ້', fmt(stats?.vehicles?.in?.today), 'ຄັນ', '#1D4ED8', svgLogIn)}
          ${renderPdfCard('ລົດເຂົ້າເດືອນນີ້', fmt(stats?.vehicles?.in?.month), 'ຄັນ', '#0D9488', svgCalendar)}
          ${renderPdfCard('ລົດເຂົ້າປີນີ້', fmt(stats?.vehicles?.in?.year), 'ຄັນ', '#4F46E5', svgCalendarRange)}
        </div>

        <div class="section-title">ຕາຕະລາງສະຫຼຸບຂໍ້ມູນລົດເຂົ້າ (Check In Summary Data)</div>
        <table>
          <thead>
            <tr>
              <th class="text-center" style="width: 50px;">ລ/ດ</th>
              <th>ລາຍການ (Item)</th>
              <th class="text-right" style="width: 160px;">ຈຳນວນ (Amount)</th>
              <th class="text-center" style="width: 90px;">ຫົວໜ່ວຍ</th>
              <th>ໝາຍເຫດ (Remarks)</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td class="text-center">1</td>
              <td><strong>ລົດກຳລັງຈອດ (Currently Parked)</strong></td>
              <td class="text-right font-black" style="color: #B02019;">${fmt(stats?.vehicles?.parked)}</td>
              <td class="text-center">ຄັນ</td>
              <td class="text-muted">ຈຳນວນລົດທີ່ກຳລັງຈອດຢູ່ໃນບ່ອນຈອດປັດຈຸບັນ</td>
            </tr>
            <tr>
              <td class="text-center">2</td>
              <td><strong>ລົດເຂົ້າວັນນີ້ (Today)</strong></td>
              <td class="text-right font-black" style="color: #1D4ED8;">${fmt(stats?.vehicles?.in?.today)}</td>
              <td class="text-center">ຄັນ</td>
              <td class="text-muted">ຈຳນວນລົດເຂົ້າໃນວັນທີປັດຈຸບັນ</td>
            </tr>
            <tr>
              <td class="text-center">3</td>
              <td><strong>ລົດເຂົ້າເດືອນນີ້ (This Month)</strong></td>
              <td class="text-right font-black" style="color: #0D9488;">${fmt(stats?.vehicles?.in?.month)}</td>
              <td class="text-center">ຄັນ</td>
              <td class="text-muted">ຈຳນວນລົດເຂົ້າສະສົມໃນເດືອນນີ້</td>
            </tr>
            <tr>
              <td class="text-center">4</td>
              <td><strong>ລົດເຂົ້າປີນີ້ (This Year)</strong></td>
              <td class="text-right font-black" style="color: #4F46E5;">${fmt(stats?.vehicles?.in?.year)}</td>
              <td class="text-center">ຄັນ</td>
              <td class="text-muted">ຈຳນວນລົດເຂົ້າສະສົມໃນປີນີ້</td>
            </tr>
            <tr class="total-row">
              <td class="text-center">5</td>
              <td><strong>ລົດເຂົ້າໃນຊ່ວງທີ່ເລືອກ (${dateFrom1} ຫາ ${dateTo1})</strong></td>
              <td class="text-right font-black" style="color: #1D4ED8;">${fmt(totalIn)}</td>
              <td class="text-center">ຄັນ</td>
              <td class="text-muted">ຈຳນວນລົດເຂົ້າໃນໄລຍະເວລາທີ່ກຳນົດ</td>
            </tr>
          </tbody>
        </table>
      `;
    } else if (section === 2) {
      title = 'ລາຍງານລົດອອກ (Check Out Report)';
      dateRangeStr = `ຊ່ວງວັນທີ: ${dateFrom2} ເຖິງ ${dateTo2}`;
      let curData = vehOutData;
      if (!curData) curData = await fetchCheckOut(dateFrom2, dateTo2);
      const totalOut = curData?.data?.reduce((sum: number, d: any) => sum + (Number(d.total) || 0), 0) || 0;

      contentHtml = `
        <div class="card-grid">
          ${renderPdfCard('ລົດອອກວັນນີ້', fmt(stats?.vehicles?.out?.today), 'ຄັນ', '#7C3AED', svgLogOut)}
          ${renderPdfCard('ລົດອອກເດືອນນີ້', fmt(stats?.vehicles?.out?.month), 'ຄັນ', '#C026D3', svgCalendar)}
          ${renderPdfCard('ລົດອອກປີນີ້', fmt(stats?.vehicles?.out?.year), 'ຄັນ', '#BE123C', svgHistory)}
          ${renderPdfCard('ລົດອອກທັງໝົດ', fmt(stats?.vehicles?.out?.all), 'ຄັນ', '#1E1B4B', svgLayers)}
        </div>

        <div class="section-title">ຕາຕະລາງສະຫຼຸບຂໍ້ມູນລົດອອກ (Check Out Summary Data)</div>
        <table>
          <thead>
            <tr>
              <th class="text-center" style="width: 50px;">ລ/ດ</th>
              <th>ລາຍການ (Item)</th>
              <th class="text-right" style="width: 160px;">ຈຳນວນ (Amount)</th>
              <th class="text-center" style="width: 90px;">ຫົວໜ່ວຍ</th>
              <th>ໝາຍເຫດ (Remarks)</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td class="text-center">1</td>
              <td><strong>ລົດອອກວັນນີ້ (Today)</strong></td>
              <td class="text-right font-black" style="color: #7C3AED;">${fmt(stats?.vehicles?.out?.today)}</td>
              <td class="text-center">ຄັນ</td>
              <td class="text-muted">ຈຳນວນລົດອອກໃນວັນທີປັດຈຸບັນ</td>
            </tr>
            <tr>
              <td class="text-center">2</td>
              <td><strong>ລົດອອກເດືອນນີ້ (This Month)</strong></td>
              <td class="text-right font-black" style="color: #C026D3;">${fmt(stats?.vehicles?.out?.month)}</td>
              <td class="text-center">ຄັນ</td>
              <td class="text-muted">ຈຳນວນລົດອອກສະສົມໃນເດືອນນີ້</td>
            </tr>
            <tr>
              <td class="text-center">3</td>
              <td><strong>ລົດອອກປີນີ້ (This Year)</strong></td>
              <td class="text-right font-black" style="color: #BE123C;">${fmt(stats?.vehicles?.out?.year)}</td>
              <td class="text-center">ຄັນ</td>
              <td class="text-muted">ຈຳນວນລົດອອກສະສົມໃນປີນີ້</td>
            </tr>
            <tr>
              <td class="text-center">4</td>
              <td><strong>ລົດອອກທັງໝົດ (All Time)</strong></td>
              <td class="text-right font-black" style="color: #1E1B4B;">${fmt(stats?.vehicles?.out?.all)}</td>
              <td class="text-center">ຄັນ</td>
              <td class="text-muted">ຈຳນວນລົດອອກທັງໝົດໃນລະບົບ</td>
            </tr>
            <tr class="total-row">
              <td class="text-center">5</td>
              <td><strong>ລົດອອກໃນຊ່ວງທີ່ເລືອກ (${dateFrom2} ຫາ ${dateTo2})</strong></td>
              <td class="text-right font-black" style="color: #7C3AED;">${fmt(totalOut)}</td>
              <td class="text-center">ຄັນ</td>
              <td class="text-muted">ຈຳນວນລົດອອກໃນໄລຍະເວລາທີ່ກຳນົດ</td>
            </tr>
          </tbody>
        </table>
      `;
    } else if (section === 3) {
      title = 'ລາຍງານລາຍຮັບ (Revenue Report)';
      dateRangeStr = `ຊ່ວງວັນທີ: ${dateFrom3} ເຖິງ ${dateTo3}`;
      let curData = revData;
      if (!curData) curData = await fetchRevenue(dateFrom3, dateTo3);
      const totalRev = curData?.data?.reduce((sum: number, d: any) => sum + (Number(d.total) || 0), 0) || 0;

      contentHtml = `
        <div class="card-grid">
          ${renderPdfCard('ລາຍຮັບວັນນີ້', fmt(stats?.revenue?.today), '₭', '#059669', svgWallet)}
          ${renderPdfCard('ລາຍຮັບເດືອນນີ້', fmt(stats?.revenue?.month), '₭', '#0891B2', svgBanknote)}
          ${renderPdfCard('ລາຍຮັບປີນີ້', fmt(stats?.revenue?.year), '₭', '#0284C7', svgCoins)}
          ${renderPdfCard('ລາຍຮັບລວມທັງໝົດ', fmt(stats?.revenue?.all), '₭', '#14532D', svgDollarCircle)}
        </div>

        <div class="section-title">ຕາຕະລາງສະຫຼຸບຂໍ້ມູນລາຍຮັບ (Revenue Summary Data)</div>
        <table>
          <thead>
            <tr>
              <th class="text-center" style="width: 50px;">ລ/ດ</th>
              <th>ລາຍການ (Item)</th>
              <th class="text-right" style="width: 180px;">ຈຳນວນເງິນ (Amount)</th>
              <th class="text-center" style="width: 90px;">ສະກຸນເງິນ</th>
              <th>ໝາຍເຫດ (Remarks)</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td class="text-center">1</td>
              <td><strong>ລາຍຮັບວັນນີ້ (Today)</strong></td>
              <td class="text-right font-black" style="color: #059669;">${fmt(stats?.revenue?.today)}</td>
              <td class="text-center">₭ (KIP)</td>
              <td class="text-muted">ລາຍຮັບຈາກຄ່າຈອດລົດໃນວັນທີປັດຈຸບັນ</td>
            </tr>
            <tr>
              <td class="text-center">2</td>
              <td><strong>ລາຍຮັບເດືອນນີ້ (This Month)</strong></td>
              <td class="text-right font-black" style="color: #0891B2;">${fmt(stats?.revenue?.month)}</td>
              <td class="text-center">₭ (KIP)</td>
              <td class="text-muted">ລາຍຮັບສະສົມໃນເດືອນນີ້</td>
            </tr>
            <tr>
              <td class="text-center">3</td>
              <td><strong>ລາຍຮັບປີນີ້ (This Year)</strong></td>
              <td class="text-right font-black" style="color: #0284C7;">${fmt(stats?.revenue?.year)}</td>
              <td class="text-center">₭ (KIP)</td>
              <td class="text-muted">ລາຍຮັບສະສົມໃນປີນີ້</td>
            </tr>
            <tr>
              <td class="text-center">4</td>
              <td><strong>ລາຍຮັບລວມທັງໝົດ (All Time)</strong></td>
              <td class="text-right font-black" style="color: #14532D;">${fmt(stats?.revenue?.all)}</td>
              <td class="text-center">₭ (KIP)</td>
              <td class="text-muted">ລາຍຮັບລວມທັງໝົດຕັ້ງແຕ່ເລີ່ມລະບົບ</td>
            </tr>
            <tr class="total-row">
              <td class="text-center">5</td>
              <td><strong>ລາຍຮັບໃນຊ່ວງທີ່ເລືອກ (${dateFrom3} ຫາ ${dateTo3})</strong></td>
              <td class="text-right font-black" style="color: #059669;">${fmt(totalRev)}</td>
              <td class="text-center">₭ (KIP)</td>
              <td class="text-muted">ລາຍຮັບລວມໃນໄລຍະເວລາທີ່ກຳນົດ</td>
            </tr>
          </tbody>
        </table>
      `;
    } else if (section === 4) {
      title = 'ລາຍງານປະເພດລົດ (Vehicle Types Report)';
      dateRangeStr = `ຊ່ວງວັນທີ: ${dateFrom4} ເຖິງ ${dateTo4}`;

      const totalParked = stats?.vehicles?.parked || (carParked + bikeParked + evParked + truckParked);

      contentHtml = `
        <div class="card-grid">
          ${renderPdfCard('ລົດໃຫຍ່', fmt(carParked), 'ຄັນ', '#B02019', svgCar)}
          ${renderPdfCard('ລົດຈັກ', fmt(bikeParked), 'ຄັນ', '#1D4ED8', svgBike)}
          ${renderPdfCard('ລົດໄຟຟ້າ', fmt(evParked), 'ຄັນ', '#059669', svgZap)}
          ${renderPdfCard('ລົດບັນທຸກ', fmt(truckParked), 'ຄັນ', '#7C3AED', svgTruck)}
        </div>

        <div class="section-title">ຕາຕະລາງສະຫຼຸບຂໍ້ມູນແຍກຕາມປະເພດລົດ (Vehicle Types Summary Data)</div>
        <table>
          <thead>
            <tr>
              <th class="text-center" style="width: 50px;">ລ/ດ</th>
              <th>ປະເພດລົດ (Vehicle Type)</th>
              <th class="text-right" style="width: 160px;">ກຳລັງຈອດ (Parked)</th>
              <th class="text-center" style="width: 90px;">ຫົວໜ່ວຍ</th>
              <th>ສັດສ່ວນ (%)</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td class="text-center">1</td>
              <td><strong>ລົດໃຫຍ່ (Car)</strong></td>
              <td class="text-right font-black" style="color: #B02019;">${fmt(carParked)}</td>
              <td class="text-center">ຄັນ</td>
              <td class="text-muted">${totalParked > 0 ? ((carParked / totalParked) * 100).toFixed(1) : 0}%</td>
            </tr>
            <tr>
              <td class="text-center">2</td>
              <td><strong>ລົດຈັກ (Bike / Motorcycle)</strong></td>
              <td class="text-right font-black" style="color: #1D4ED8;">${fmt(bikeParked)}</td>
              <td class="text-center">ຄັນ</td>
              <td class="text-muted">${totalParked > 0 ? ((bikeParked / totalParked) * 100).toFixed(1) : 0}%</td>
            </tr>
            <tr>
              <td class="text-center">3</td>
              <td><strong>ລົດໄຟຟ້າ (EV)</strong></td>
              <td class="text-right font-black" style="color: #059669;">${fmt(evParked)}</td>
              <td class="text-center">ຄັນ</td>
              <td class="text-muted">${totalParked > 0 ? ((evParked / totalParked) * 100).toFixed(1) : 0}%</td>
            </tr>
            <tr>
              <td class="text-center">4</td>
              <td><strong>ລົດບັນທຸກ (Truck)</strong></td>
              <td class="text-right font-black" style="color: #7C3AED;">${fmt(truckParked)}</td>
              <td class="text-center">ຄັນ</td>
              <td class="text-muted">${totalParked > 0 ? ((truckParked / totalParked) * 100).toFixed(1) : 0}%</td>
            </tr>
            <tr class="total-row">
              <td colspan="2" class="text-center">ລວມລົດກຳລັງຈອດທັງໝົດ (Total Parked)</td>
              <td class="text-right font-black">${fmt(totalParked)}</td>
              <td class="text-center">ຄັນ</td>
              <td class="text-muted">100%</td>
            </tr>
          </tbody>
        </table>
      `;
    } else {
      // Export All 4 Sections in One Document
      title = 'ລາຍງານລວມລະບົບຈອດລົດ PARKO (System Overview Report)';
      dateRangeStr = '';

      contentHtml = `
        <div class="section-title">1. ລົດເຂົ້າ (Check In)</div>
        <div class="card-grid">
          ${renderPdfCard('ລົດກຳລັງຈອດ', fmt(stats?.vehicles?.parked), 'ຄັນ', '#B02019', svgParking)}
          ${renderPdfCard('ລົດເຂົ້າວັນນີ້', fmt(stats?.vehicles?.in?.today), 'ຄັນ', '#1D4ED8', svgLogIn)}
          ${renderPdfCard('ລົດເຂົ້າເດືອນນີ້', fmt(stats?.vehicles?.in?.month), 'ຄັນ', '#0D9488', svgCalendar)}
          ${renderPdfCard('ລົດເຂົ້າປີນີ້', fmt(stats?.vehicles?.in?.year), 'ຄັນ', '#4F46E5', svgCalendarRange)}
        </div>

        <div class="section-title">2. ລົດອອກ (Check Out)</div>
        <div class="card-grid">
          ${renderPdfCard('ລົດອອກວັນນີ້', fmt(stats?.vehicles?.out?.today), 'ຄັນ', '#7C3AED', svgLogOut)}
          ${renderPdfCard('ລົດອອກເດືອນນີ້', fmt(stats?.vehicles?.out?.month), 'ຄັນ', '#C026D3', svgCalendar)}
          ${renderPdfCard('ລົດອອກປີນີ້', fmt(stats?.vehicles?.out?.year), 'ຄັນ', '#BE123C', svgHistory)}
          ${renderPdfCard('ລົດອອກທັງໝົດ', fmt(stats?.vehicles?.out?.all), 'ຄັນ', '#1E1B4B', svgLayers)}
        </div>

        <div class="section-title">3. ລາຍຮັບ (Revenue)</div>
        <div class="card-grid">
          ${renderPdfCard('ລາຍຮັບວັນນີ້', fmt(stats?.revenue?.today), '₭', '#059669', svgWallet)}
          ${renderPdfCard('ລາຍຮັບເດືອນນີ້', fmt(stats?.revenue?.month), '₭', '#0891B2', svgBanknote)}
          ${renderPdfCard('ລາຍຮັບປີນີ້', fmt(stats?.revenue?.year), '₭', '#0284C7', svgCoins)}
          ${renderPdfCard('ລາຍຮັບລວມທັງໝົດ', fmt(stats?.revenue?.all), '₭', '#14532D', svgDollarCircle)}
        </div>

        <div class="section-title">4. ປະເພດລົດ (Vehicle Type)</div>
        <div class="card-grid">
          ${renderPdfCard('ລົດໃຫຍ່', fmt(carParked), 'ຄັນ', '#B02019', svgCar)}
          ${renderPdfCard('ລົດຈັກ', fmt(bikeParked), 'ຄັນ', '#1D4ED8', svgBike)}
          ${renderPdfCard('ລົດໄຟຟ້າ', fmt(evParked), 'ຄັນ', '#059669', svgZap)}
          ${renderPdfCard('ລົດບັນທຸກ', fmt(truckParked), 'ຄັນ', '#7C3AED', svgTruck)}
        </div>
      `;
    }

    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>PARKO SYSTEM</title>
  <style>
    @page {
      size: A4 portrait;
      margin: 0 !important;
    }
    @media print {
      @page {
        margin: 0 !important;
      }
      html, body {
        margin: 0 !important;
        padding: 12mm 15mm !important;
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
      }
    }
    body {
      font-family: 'Noto Sans Lao', 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      color: #111827;
      margin: 0;
      padding: 12mm 15mm;
      font-size: 12px;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    .header {
      border-bottom: 2px solid #B02019;
      padding-bottom: 10px;
      margin-bottom: 16px;
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
    }
    .title {
      font-size: 20px;
      font-weight: 800;
      color: #B02019;
      margin: 0 0 4px 0;
    }
    .subtitle {
      font-size: 13px;
      font-weight: 700;
      color: #374151;
      margin: 0;
    }
    .meta {
      font-size: 11px;
      color: #4B5563;
      font-weight: 600;
      text-align: right;
    }
    
    /* 4 StatCards matching Image 3 — border removed */
    .card-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 12px;
      margin-bottom: 20px;
    }
    .stat-card {
      border: none !important;
      background: #FFFFFF;
      overflow: hidden;
      box-shadow: none !important;
    }
    .stat-banner {
      padding: 10px 8px;
      display: flex;
      justify-content: center;
      align-items: center;
      color: #FFFFFF;
      border: none !important;
    }
    .stat-banner svg {
      width: 24px;
      height: 24px;
      stroke: currentColor;
    }
    .stat-body {
      padding: 12px 6px;
      text-align: center;
      background: #FFFFFF;
      border: none !important;
    }
    .stat-title {
      font-size: 12px;
      font-weight: 700;
      color: #4B5563;
      margin-bottom: 3px;
    }
    .stat-value {
      font-size: 19px;
      font-weight: 900;
      color: #111827;
    }

    /* Section title without red left border as requested in Image 3 */
    .section-title {
      font-size: 13px;
      font-weight: 800;
      color: #111827;
      margin: 16px 0 8px 0;
      border-left: none !important;
      padding-left: 0 !important;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 20px;
      font-size: 11.5px;
    }
    th {
      background: #5D5D5D;
      color: #FFFFFF;
      font-weight: 700;
      padding: 7px 10px;
      text-align: left;
    }
    th.text-right, td.text-right { text-align: right; }
    th.text-center, td.text-center { text-align: center; }
    td {
      padding: 7px 10px;
      border-bottom: 1px solid #E5E7EB;
    }
    tr:nth-child(even) { background: #F9FAFB; }
    .total-row {
      background: #F3F4F6;
      font-weight: 800;
      border-top: 2px solid #374151;
    }
    .font-black { font-weight: 900; }
    .text-muted { color: #6B7280; font-size: 11px; }

    .footer-sign {
      display: flex;
      justify-content: space-between;
      margin-top: 40px;
      padding-top: 14px;
      page-break-inside: avoid;
    }
    .sign-box {
      text-align: center;
      width: 180px;
      font-size: 11px;
      color: #374151;
    }
    .sign-line {
      border-bottom: 1px dotted #9CA3AF;
      margin-top: 48px;
      margin-bottom: 6px;
    }
  </style>
</head>
<body>
  <div class="header">
    <div>
      <h1 class="title">PARKO — ລະບົບຄຸ້ມຄອງບ່ອນຈອດລົດ</h1>
      <p class="subtitle">${title}</p>
    </div>
    ${dateRangeStr ? `
    <div class="meta">
      <div><strong>${dateRangeStr}</strong></div>
    </div>
    ` : ''}
  </div>

  ${contentHtml}

  <div class="footer-sign">
    <div class="sign-box">
      <div>ຜູ້ລາຍງານ (Prepared By)</div>
      <div class="sign-line"></div>
      <div>ວັນທີ: ..... / ..... / .........</div>
    </div>
    <div class="sign-box">
      <div>ຜູ້ກວດກາ (Audited By)</div>
      <div class="sign-line"></div>
      <div>ວັນທີ: ..... / ..... / .........</div>
    </div>
    <div class="sign-box">
      <div>ຜູ້ອະນຸມັດ (Approved By)</div>
      <div class="sign-line"></div>
      <div>ວັນທີ: ..... / ..... / .........</div>
    </div>
  </div>

  <script>
    window.onload = function() {
      setTimeout(function() {
        window.print();
      }, 300);
    };
  </script>
</body>
</html>
    `;

    printWindow.document.open();
    printWindow.document.write(htmlContent);
    printWindow.document.close();
    setExportingSection(null);
  };

  // =========================================================
  // EXCEL EXPORT (COMPLETELY REPLACED WITH NEW DATA FORMAT)
  // =========================================================
  const exportExcelSection = async (section: 1 | 2 | 3 | 4 | 'all') => {
    setExportingSection(`excel-${section}`);
    const toastId = toast.loading('ກຳລັງສ້າງ Excel...');
    try {
      const aoa: any[][] = [];
      let fname = '';
      let sheetName = '';

      if (section === 1) {
        fname = `PARKO_CheckIn_${dateFrom1}_${dateTo1}`;
        sheetName = 'Check In';
        let curData = vehInData;
        if (!curData) curData = await fetchCheckIn(dateFrom1, dateTo1);
        const totalIn = curData?.data?.reduce((sum: number, d: any) => sum + (Number(d.total) || 0), 0) || 0;

        aoa.push(['PARKO — ລະບົບຄຸ້ມຄອງບ່ອນຈອດລົດ']);
        aoa.push(['ລາຍງານລົດເຂົ້າ (Check In Report)']);
        aoa.push(['ຊ່ວງວັນທີ', `${dateFrom1} - ${dateTo1}`]);
        aoa.push([]);
        aoa.push(['ລ/ດ', 'ລາຍການ (Item)', 'ຈຳນວນ (Amount)', 'ຫົວໜ່ວຍ', 'ໝາຍເຫດ (Remarks)']);
        aoa.push([1, 'ລົດກຳລັງຈອດ (Currently Parked)', stats?.vehicles?.parked || 0, 'ຄັນ', 'ຈຳນວນລົດທີ່ກຳລັງຈອດຢູ່ໃນບ່ອນຈອດປັດຈຸບັນ']);
        aoa.push([2, 'ລົດເຂົ້າວັນນີ້ (Today)', stats?.vehicles?.in?.today || 0, 'ຄັນ', 'ຈຳນວນລົດເຂົ້າໃນວັນທີປັດຈຸບັນ']);
        aoa.push([3, 'ລົດເຂົ້າເດືອນນີ້ (This Month)', stats?.vehicles?.in?.month || 0, 'ຄັນ', 'ຈຳນວນລົດເຂົ້າສະສົມໃນເດືອນນີ້']);
        aoa.push([4, 'ລົດເຂົ້າປີນີ້ (This Year)', stats?.vehicles?.in?.year || 0, 'ຄັນ', 'ຈຳນວນລົດເຂົ້າສະສົມໃນປີນີ້']);
        aoa.push([5, `ລົດເຂົ້າໃນຊ່ວງທີ່ເລືອກ (${dateFrom1} ຫາ ${dateTo1})`, totalIn, 'ຄັນ', 'ຈຳນວນລົດເຂົ້າໃນໄລຍະເວລາທີ່ກຳນົດ']);
      } else if (section === 2) {
        fname = `PARKO_CheckOut_${dateFrom2}_${dateTo2}`;
        sheetName = 'Check Out';
        let curData = vehOutData;
        if (!curData) curData = await fetchCheckOut(dateFrom2, dateTo2);
        const totalOut = curData?.data?.reduce((sum: number, d: any) => sum + (Number(d.total) || 0), 0) || 0;

        aoa.push(['PARKO — ລະບົບຄຸ້ມຄອງບ່ອນຈອດລົດ']);
        aoa.push(['ລາຍງານລົດອອກ (Check Out Report)']);
        aoa.push(['ຊ່ວງວັນທີ', `${dateFrom2} - ${dateTo2}`]);
        aoa.push([]);
        aoa.push(['ລ/ດ', 'ລາຍການ (Item)', 'ຈຳນວນ (Amount)', 'ຫົວໜ່ວຍ', 'ໝາຍເຫດ (Remarks)']);
        aoa.push([1, 'ລົດອອກວັນນີ້ (Today)', stats?.vehicles?.out?.today || 0, 'ຄັນ', 'ຈຳນວນລົດອອກໃນວັນທີປັດຈຸບັນ']);
        aoa.push([2, 'ລົດອອກເດືອນນີ້ (This Month)', stats?.vehicles?.out?.month || 0, 'ຄັນ', 'ຈຳນວນລົດອອກສະສົມໃນເດືອນນີ້']);
        aoa.push([3, 'ລົດອອກປີນີ້ (This Year)', stats?.vehicles?.out?.year || 0, 'ຄັນ', 'ຈຳນວນລົດອອກສະສົມໃນປີນີ້']);
        aoa.push([4, 'ລົດອອກທັງໝົດ (All Time)', stats?.vehicles?.out?.all || 0, 'ຄັນ', 'ຈຳນວນລົດອອກທັງໝົດໃນລະບົບ']);
        aoa.push([5, `ລົດອອກໃນຊ່ວງທີ່ເລືອກ (${dateFrom2} ຫາ ${dateTo2})`, totalOut, 'ຄັນ', 'ຈຳນວນລົດອອກໃນໄລຍະເວລາທີ່ກຳນົດ']);
      } else if (section === 3) {
        fname = `PARKO_Revenue_${dateFrom3}_${dateTo3}`;
        sheetName = 'Revenue';
        let curData = revData;
        if (!curData) curData = await fetchRevenue(dateFrom3, dateTo3);
        const totalRev = curData?.data?.reduce((sum: number, d: any) => sum + (Number(d.total) || 0), 0) || 0;

        aoa.push(['PARKO — ລະບົບຄຸ້ມຄອງບ່ອນຈອດລົດ']);
        aoa.push(['ລາຍງານລາຍຮັບ (Revenue Report)']);
        aoa.push(['ຊ່ວງວັນທີ', `${dateFrom3} - ${dateTo3}`]);
        aoa.push([]);
        aoa.push(['ລ/ດ', 'ລາຍການ (Item)', 'ຈຳນວນເງິນ (Amount)', 'ສະກຸນເງິນ', 'ໝາຍເຫດ (Remarks)']);
        aoa.push([1, 'ລາຍຮັບວັນນີ້ (Today)', stats?.revenue?.today || 0, 'LAK (₭)', 'ລາຍຮັບໃນວັນທີປັດຈຸບັນ']);
        aoa.push([2, 'ລາຍຮັບເດືອນນີ້ (This Month)', stats?.revenue?.month || 0, 'LAK (₭)', 'ລາຍຮັບສະສົມໃນເດືອນນີ້']);
        aoa.push([3, 'ລາຍຮັບປີນີ້ (This Year)', stats?.revenue?.year || 0, 'LAK (₭)', 'ລາຍຮັບສະສົມໃນປີນີ້']);
        aoa.push([4, 'ລາຍຮັບລວມທັງໝົດ (All Time)', stats?.revenue?.all || 0, 'LAK (₭)', 'ລາຍຮັບລວມທັງໝົດໃນລະບົບ']);
        aoa.push([5, `ລາຍຮັບໃນຊ່ວງທີ່ເລືອກ (${dateFrom3} ຫາ ${dateTo3})`, totalRev, 'LAK (₭)', 'ລາຍຮັບລວມໃນໄລຍະເວລາທີ່ກຳນົດ']);
      } else if (section === 4) {
        fname = `PARKO_VehicleTypes_${dateFrom4}_${dateTo4}`;
        sheetName = 'Vehicle Types';
        const totalParked = stats?.vehicles?.parked || (carParked + bikeParked + evParked + truckParked);

        aoa.push(['PARKO — ລະບົບຄຸ້ມຄອງບ່ອນຈອດລົດ']);
        aoa.push(['ລາຍງານປະເພດລົດ (Vehicle Types Report)']);
        aoa.push([]);
        aoa.push(['ລ/ດ', 'ປະເພດລົດ (Vehicle Type)', 'ກຳລັງຈອດ (Parked)', 'ຫົວໜ່ວຍ', 'ສັດສ່ວນ (%)']);
        aoa.push([1, 'ລົດໃຫຍ່ (Car)', carParked, 'ຄັນ', totalParked > 0 ? `${((carParked / totalParked) * 100).toFixed(1)}%` : '0%']);
        aoa.push([2, 'ລົດຈັກ (Bike)', bikeParked, 'ຄັນ', totalParked > 0 ? `${((bikeParked / totalParked) * 100).toFixed(1)}%` : '0%']);
        aoa.push([3, 'ລົດໄຟຟ້າ (EV)', evParked, 'ຄັນ', totalParked > 0 ? `${((evParked / totalParked) * 100).toFixed(1)}%` : '0%']);
        aoa.push([4, 'ລົດບັນທຸກ (Truck)', truckParked, 'ຄັນ', totalParked > 0 ? `${((truckParked / totalParked) * 100).toFixed(1)}%` : '0%']);
        aoa.push(['', 'ລວມທັງໝົດ (Total)', totalParked, 'ຄັນ', '100%']);
      } else {
        // Export All in 1
        fname = `PARKO_AllReports_${new Date().toISOString().split('T')[0]}`;
        sheetName = 'Overview';

        aoa.push(['PARKO — ລາຍງານລວມລະບົບຈອດລົດ (Overview Report)']);
        aoa.push([]);
        aoa.push(['1. ລົດເຂົ້າ (Check In)']);
        aoa.push(['ລົດກຳລັງຈອດ', stats?.vehicles?.parked || 0, 'ລົດເຂົ້າວັນນີ້', stats?.vehicles?.in?.today || 0]);
        aoa.push(['ລົດເຂົ້າເດືອນນີ້', stats?.vehicles?.in?.month || 0, 'ລົດເຂົ້າປີນີ້', stats?.vehicles?.in?.year || 0]);
        aoa.push([]);
        aoa.push(['2. ລົດອອກ (Check Out)']);
        aoa.push(['ລົດອອກວັນນີ້', stats?.vehicles?.out?.today || 0, 'ລົດອອກເດືອນນີ້', stats?.vehicles?.out?.month || 0]);
        aoa.push(['ລົດອອກປີນີ້', stats?.vehicles?.out?.year || 0, 'ລົດອອກທັງໝົດ', stats?.vehicles?.out?.all || 0]);
        aoa.push([]);
        aoa.push(['3. ລາຍຮັບ (Revenue) (₭)']);
        aoa.push(['ລາຍຮັບວັນນີ້', stats?.revenue?.today || 0, 'ລາຍຮັບເດືອນນີ້', stats?.revenue?.month || 0]);
        aoa.push(['ລາຍຮັບປີນີ້', stats?.revenue?.year || 0, 'ລາຍຮັບລວມທັງໝົດ', stats?.revenue?.all || 0]);
        aoa.push([]);
        aoa.push(['4. ປະເພດລົດກຳລັງຈອດ (Vehicle Types)']);
        aoa.push(['ລົດໃຫຍ່', carParked, 'ລົດຈັກ', bikeParked]);
        aoa.push(['ລົດໄຟຟ້າ', evParked, 'ລົດບັນທຸກ', truckParked]);
      }

      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.aoa_to_sheet(aoa);
      ws['!cols'] = [{ wch: 8 }, { wch: 32 }, { wch: 22 }, { wch: 14 }, { wch: 38 }];
      XLSX.utils.book_append_sheet(wb, ws, sheetName);

      const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
      const blob = new Blob([excelBuffer], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8',
      });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${fname}.xlsx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setTimeout(() => window.URL.revokeObjectURL(url), 2000);

      toast.success('ສ້າງ Excel ສຳເລັດ', { id: toastId });
    } catch {
      toast.error('Export Excel ບໍ່ສຳເລັດ', { id: toastId });
    } finally {
      setExportingSection(null);
    }
  };

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
              <FileSpreadsheet size={20} className="w-5 h-5 text-white shrink-0" />
              <h1 className="text-base md:text-[17px] font-bold text-white tracking-normal whitespace-nowrap">
                ລາຍງານ
              </h1>
            </div>
          </div>

          {/* Right: Master Export All Buttons + Refresh */}
          <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap shrink-0">
            {isAdmin && (
              <>
                <button
                  type="button"
                  onClick={() => exportPdfSection('all')}
                  disabled={exportingSection === 'pdf-all'}
                  className="bg-[#B02019] hover:bg-[#8e1913] active:bg-[#73140f] text-white font-bold h-10 px-3.5 flex items-center justify-center gap-1.5 text-sm sm:text-base transition-colors shadow-sm rounded-none border-0 outline-none cursor-pointer disabled:opacity-50"
                  style={{ borderRadius: 0 }}
                  title="ສ້າງ PDF ລວມ 4 ໝວດ"
                >
                  {exportingSection === 'pdf-all' ? <Loader2 size={16} className="animate-spin text-white" /> : <FileText size={17} className="text-white shrink-0" />}
                  <span>PDF ລວມ</span>
                </button>
                <button
                  type="button"
                  onClick={() => exportExcelSection('all')}
                  disabled={exportingSection === 'excel-all'}
                  className="bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-bold h-10 px-3.5 flex items-center justify-center gap-1.5 text-sm sm:text-base transition-colors shadow-sm rounded-none border-0 outline-none cursor-pointer disabled:opacity-50"
                  style={{ borderRadius: 0 }}
                  title="ດາວໂຫຼດ Excel ລວມ 4 ໝວດ"
                >
                  {exportingSection === 'excel-all' ? <Loader2 size={16} className="animate-spin text-white" /> : <FileSpreadsheet size={17} className="text-white shrink-0" />}
                  <span>Excel ລວມ</span>
                </button>
              </>
            )}
            <button
              type="button"
              onClick={loadInitial}
              disabled={loadingStats}
              className="bg-white hover:bg-gray-100 active:bg-gray-200 text-black font-bold h-10 px-4 flex items-center justify-center gap-2 text-base md:text-[17px] transition-colors shadow-sm rounded-none border-0 outline-none cursor-pointer"
              style={{ borderRadius: 0 }}
              title="ໂຫຼດຂໍ້ມູນຄືນໃໝ່"
            >
              <RefreshCw size={17} className={`text-black shrink-0 ${loadingStats ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>
          </div>
        </div>

        {/* Top Red Stripe Divider */}
        <div className="h-[2.5px] bg-[#B02019] w-full shrink-0" />

        {/* Main Body — Orange Background (#F9A825) matching Image 3 */}
        <div className="bg-[#F9A825] p-3 sm:p-4 flex flex-col justify-start space-y-4">

          {/* ========================================================= */}
          {/* SECTION 1: ລົດເຂົ້າ (Check In) */}
          {/* ========================================================= */}
          <div className="flex flex-col space-y-2.5">
            {/* White Header Bar */}
            <div
              className="bg-white p-3 sm:px-4 sm:py-3 shadow-[0_2px_10px_rgba(0,0,0,0.08)] flex flex-col md:flex-row items-start md:items-center justify-between gap-3 rounded-none"
              style={{ borderRadius: 0 }}
            >
              <div className="flex items-center gap-2.5">
                <LogIn size={22} className="text-[#B02019] shrink-0" />
                <h2 className="text-base sm:text-[18px] font-bold text-gray-900 tracking-normal whitespace-nowrap">
                  ລົດເຂົ້າ (Check In)
                </h2>
              </div>

              <div className="flex flex-wrap items-center gap-2 sm:gap-2.5 w-full md:w-auto">
                <div className="relative flex-1 sm:flex-initial">
                  <input
                    type="date"
                    value={dateFrom1}
                    onChange={(e) => setDateFrom1(e.target.value)}
                    className="h-10 px-3 bg-white border border-gray-300 text-gray-900 text-sm sm:text-[15px] font-bold focus:outline-none focus:border-[#B02019] rounded-none shadow-xs w-full sm:w-[155px]"
                    style={{ borderRadius: 0 }}
                  />
                </div>
                <div className="relative flex-1 sm:flex-initial">
                  <input
                    type="date"
                    value={dateTo1}
                    onChange={(e) => setDateTo1(e.target.value)}
                    className="h-10 px-3 bg-white border border-gray-300 text-gray-900 text-sm sm:text-[15px] font-bold focus:outline-none focus:border-[#B02019] rounded-none shadow-xs w-full sm:w-[155px]"
                    style={{ borderRadius: 0 }}
                  />
                </div>
                <button
                  type="button"
                  onClick={() => fetchCheckIn()}
                  disabled={loading1}
                  className="bg-[#B02019] hover:bg-[#8e1913] active:bg-[#73140f] text-white font-bold h-10 px-4 text-sm sm:text-base flex items-center justify-center gap-1.5 shadow-sm rounded-none border-0 cursor-pointer transition-colors"
                  style={{ borderRadius: 0 }}
                >
                  {loading1 ? <Loader2 size={16} className="animate-spin text-white" /> : null}
                  <span>ດຶງຂໍ້ມູນ</span>
                </button>
                <button
                  type="button"
                  onClick={() => exportPdfSection(1)}
                  disabled={exportingSection === 'pdf-1'}
                  className="bg-[#B02019] hover:bg-[#8e1913] active:bg-[#73140f] text-white font-bold h-10 px-3.5 text-sm sm:text-base flex items-center justify-center gap-1.5 shadow-sm rounded-none border-0 cursor-pointer transition-colors"
                  style={{ borderRadius: 0 }}
                  title="ສ້າງ PDF ລົດເຂົ້າ (ຂໍ້ມູນແບບໃໝ່)"
                >
                  {exportingSection === 'pdf-1' ? <Loader2 size={16} className="animate-spin text-white" /> : <FileText size={17} className="text-white shrink-0" />}
                  <span>PDF</span>
                </button>
                <button
                  type="button"
                  onClick={() => exportExcelSection(1)}
                  disabled={exportingSection === 'excel-1'}
                  className="bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-bold h-10 px-3.5 text-sm sm:text-base flex items-center justify-center gap-1.5 shadow-sm rounded-none border-0 cursor-pointer transition-colors"
                  style={{ borderRadius: 0 }}
                  title="ດາວໂຫຼດ Excel ລົດເຂົ້າ (ຂໍ້ມູນແບບໃໝ່)"
                >
                  {exportingSection === 'excel-1' ? <Loader2 size={16} className="animate-spin text-white" /> : <FileSpreadsheet size={17} className="text-white shrink-0" />}
                  <span>Excel</span>
                </button>
              </div>
            </div>

            {/* 4 Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3">
              <StatCard
                title="ລົດກຳລັງຈອດ"
                value={fmt(stats?.vehicles?.parked)}
                unit="ຄັນ"
                icon={CircleParking}
                bannerBg="bg-[#B02019]"
              />
              <StatCard
                title="ລົດເຂົ້າວັນນີ້"
                value={fmt(stats?.vehicles?.in?.today)}
                unit="ຄັນ"
                icon={LogIn}
                bannerBg="bg-[#1D4ED8]"
              />
              <StatCard
                title="ລົດເຂົ້າເດືອນນີ້"
                value={fmt(stats?.vehicles?.in?.month)}
                unit="ຄັນ"
                icon={CalendarDays}
                bannerBg="bg-[#0D9488]"
              />
              <StatCard
                title="ລົດເຂົ້າປີນີ້"
                value={fmt(stats?.vehicles?.in?.year)}
                unit="ຄັນ"
                icon={CalendarRange}
                bannerBg="bg-[#4F46E5]"
              />
            </div>
          </div>

          {/* ========================================================= */}
          {/* SECTION 2: ລົດອອກ (Check Out) */}
          {/* ========================================================= */}
          <div className="flex flex-col space-y-2.5">
            {/* White Header Bar */}
            <div
              className="bg-white p-3 sm:px-4 sm:py-3 shadow-[0_2px_10px_rgba(0,0,0,0.08)] flex flex-col md:flex-row items-start md:items-center justify-between gap-3 rounded-none"
              style={{ borderRadius: 0 }}
            >
              <div className="flex items-center gap-2.5">
                <LogOut size={22} className="text-[#7C3AED] shrink-0" />
                <h2 className="text-base sm:text-[18px] font-bold text-gray-900 tracking-normal whitespace-nowrap">
                  ລົດອອກ (Check Out)
                </h2>
              </div>

              <div className="flex flex-wrap items-center gap-2 sm:gap-2.5 w-full md:w-auto">
                <div className="relative flex-1 sm:flex-initial">
                  <input
                    type="date"
                    value={dateFrom2}
                    onChange={(e) => setDateFrom2(e.target.value)}
                    className="h-10 px-3 bg-white border border-gray-300 text-gray-900 text-sm sm:text-[15px] font-bold focus:outline-none focus:border-[#B02019] rounded-none shadow-xs w-full sm:w-[155px]"
                    style={{ borderRadius: 0 }}
                  />
                </div>
                <div className="relative flex-1 sm:flex-initial">
                  <input
                    type="date"
                    value={dateTo2}
                    onChange={(e) => setDateTo2(e.target.value)}
                    className="h-10 px-3 bg-white border border-gray-300 text-gray-900 text-sm sm:text-[15px] font-bold focus:outline-none focus:border-[#B02019] rounded-none shadow-xs w-full sm:w-[155px]"
                    style={{ borderRadius: 0 }}
                  />
                </div>
                <button
                  type="button"
                  onClick={() => fetchCheckOut()}
                  disabled={loading2}
                  className="bg-[#B02019] hover:bg-[#8e1913] active:bg-[#73140f] text-white font-bold h-10 px-4 text-sm sm:text-base flex items-center justify-center gap-1.5 shadow-sm rounded-none border-0 cursor-pointer transition-colors"
                  style={{ borderRadius: 0 }}
                >
                  {loading2 ? <Loader2 size={16} className="animate-spin text-white" /> : null}
                  <span>ດຶງຂໍ້ມູນ</span>
                </button>
                <button
                  type="button"
                  onClick={() => exportPdfSection(2)}
                  disabled={exportingSection === 'pdf-2'}
                  className="bg-[#B02019] hover:bg-[#8e1913] active:bg-[#73140f] text-white font-bold h-10 px-3.5 text-sm sm:text-base flex items-center justify-center gap-1.5 shadow-sm rounded-none border-0 cursor-pointer transition-colors"
                  style={{ borderRadius: 0 }}
                  title="ສ້າງ PDF ລົດອອກ (ຂໍ້ມູນແບບໃໝ່)"
                >
                  {exportingSection === 'pdf-2' ? <Loader2 size={16} className="animate-spin text-white" /> : <FileText size={17} className="text-white shrink-0" />}
                  <span>PDF</span>
                </button>
                <button
                  type="button"
                  onClick={() => exportExcelSection(2)}
                  disabled={exportingSection === 'excel-2'}
                  className="bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-bold h-10 px-3.5 text-sm sm:text-base flex items-center justify-center gap-1.5 shadow-sm rounded-none border-0 cursor-pointer transition-colors"
                  style={{ borderRadius: 0 }}
                  title="ດາວໂຫຼດ Excel ລົດອອກ (ຂໍ້ມູນແບບໃໝ່)"
                >
                  {exportingSection === 'excel-2' ? <Loader2 size={16} className="animate-spin text-white" /> : <FileSpreadsheet size={17} className="text-white shrink-0" />}
                  <span>Excel</span>
                </button>
              </div>
            </div>

            {/* 4 Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3">
              <StatCard
                title="ລົດອອກວັນນີ້"
                value={fmt(stats?.vehicles?.out?.today)}
                unit="ຄັນ"
                icon={LogOut}
                bannerBg="bg-[#7C3AED]"
              />
              <StatCard
                title="ລົດອອກເດືອນນີ້"
                value={fmt(stats?.vehicles?.out?.month)}
                unit="ຄັນ"
                icon={CalendarCheck2}
                bannerBg="bg-[#C026D3]"
              />
              <StatCard
                title="ລົດອອກປີນີ້"
                value={fmt(stats?.vehicles?.out?.year)}
                unit="ຄັນ"
                icon={History}
                bannerBg="bg-[#BE123C]"
              />
              <StatCard
                title="ລົດອອກທັງໝົດ"
                value={fmt(stats?.vehicles?.out?.all)}
                unit="ຄັນ"
                icon={Layers}
                bannerBg="bg-[#1E1B4B]"
              />
            </div>
          </div>

          {/* ========================================================= */}
          {/* SECTION 3: ລາຍຮັບ (Revenue) */}
          {/* ========================================================= */}
          <div className="flex flex-col space-y-2.5">
            {/* White Header Bar */}
            <div
              className="bg-white p-3 sm:px-4 sm:py-3 shadow-[0_2px_10px_rgba(0,0,0,0.08)] flex flex-col md:flex-row items-start md:items-center justify-between gap-3 rounded-none"
              style={{ borderRadius: 0 }}
            >
              <div className="flex items-center gap-2.5">
                <Wallet size={22} className="text-[#059669] shrink-0" />
                <h2 className="text-base sm:text-[18px] font-bold text-gray-900 tracking-normal whitespace-nowrap">
                  ລາຍຮັບ (Revenue)
                </h2>
              </div>

              <div className="flex flex-wrap items-center gap-2 sm:gap-2.5 w-full md:w-auto">
                <div className="relative flex-1 sm:flex-initial">
                  <input
                    type="date"
                    value={dateFrom3}
                    onChange={(e) => setDateFrom3(e.target.value)}
                    className="h-10 px-3 bg-white border border-gray-300 text-gray-900 text-sm sm:text-[15px] font-bold focus:outline-none focus:border-[#B02019] rounded-none shadow-xs w-full sm:w-[155px]"
                    style={{ borderRadius: 0 }}
                  />
                </div>
                <div className="relative flex-1 sm:flex-initial">
                  <input
                    type="date"
                    value={dateTo3}
                    onChange={(e) => setDateTo3(e.target.value)}
                    className="h-10 px-3 bg-white border border-gray-300 text-gray-900 text-sm sm:text-[15px] font-bold focus:outline-none focus:border-[#B02019] rounded-none shadow-xs w-full sm:w-[155px]"
                    style={{ borderRadius: 0 }}
                  />
                </div>
                <button
                  type="button"
                  onClick={() => fetchRevenue()}
                  disabled={loading3}
                  className="bg-[#B02019] hover:bg-[#8e1913] active:bg-[#73140f] text-white font-bold h-10 px-4 text-sm sm:text-base flex items-center justify-center gap-1.5 shadow-sm rounded-none border-0 cursor-pointer transition-colors"
                  style={{ borderRadius: 0 }}
                >
                  {loading3 ? <Loader2 size={16} className="animate-spin text-white" /> : null}
                  <span>ດຶງຂໍ້ມູນ</span>
                </button>
                <button
                  type="button"
                  onClick={() => exportPdfSection(3)}
                  disabled={exportingSection === 'pdf-3'}
                  className="bg-[#B02019] hover:bg-[#8e1913] active:bg-[#73140f] text-white font-bold h-10 px-3.5 text-sm sm:text-base flex items-center justify-center gap-1.5 shadow-sm rounded-none border-0 cursor-pointer transition-colors"
                  style={{ borderRadius: 0 }}
                  title="ສ້າງ PDF ລາຍຮັບ (ຂໍ້ມູນແບບໃໝ່)"
                >
                  {exportingSection === 'pdf-3' ? <Loader2 size={16} className="animate-spin text-white" /> : <FileText size={17} className="text-white shrink-0" />}
                  <span>PDF</span>
                </button>
                <button
                  type="button"
                  onClick={() => exportExcelSection(3)}
                  disabled={exportingSection === 'excel-3'}
                  className="bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-bold h-10 px-3.5 text-sm sm:text-base flex items-center justify-center gap-1.5 shadow-sm rounded-none border-0 cursor-pointer transition-colors"
                  style={{ borderRadius: 0 }}
                  title="ດາວໂຫຼດ Excel ລາຍຮັບ (ຂໍ້ມູນແບບໃໝ່)"
                >
                  {exportingSection === 'excel-3' ? <Loader2 size={16} className="animate-spin text-white" /> : <FileSpreadsheet size={17} className="text-white shrink-0" />}
                  <span>Excel</span>
                </button>
              </div>
            </div>

            {/* 4 Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3">
              <StatCard
                title="ລາຍຮັບວັນນີ້"
                value={fmt(stats?.revenue?.today)}
                unit="₭"
                icon={Wallet}
                bannerBg="bg-[#059669]"
              />
              <StatCard
                title="ລາຍຮັບເດືອນນີ້"
                value={fmt(stats?.revenue?.month)}
                unit="₭"
                icon={Banknote}
                bannerBg="bg-[#0891B2]"
              />
              <StatCard
                title="ລາຍຮັບປີນີ້"
                value={fmt(stats?.revenue?.year)}
                unit="₭"
                icon={Coins}
                bannerBg="bg-[#0284C7]"
              />
              <StatCard
                title="ລາຍຮັບລວມທັງໝົດ"
                value={fmt(stats?.revenue?.all)}
                unit="₭"
                icon={CircleDollarSign}
                bannerBg="bg-[#14532D]"
              />
            </div>
          </div>

          {/* ========================================================= */}
          {/* SECTION 4: ປະເພດລົດ (Vehicle Type) */}
          {/* ========================================================= */}
          <div className="flex flex-col space-y-2.5">
            {/* White Header Bar */}
            <div
              className="bg-white p-3 sm:px-4 sm:py-3 shadow-[0_2px_10px_rgba(0,0,0,0.08)] flex flex-col md:flex-row items-start md:items-center justify-between gap-3 rounded-none"
              style={{ borderRadius: 0 }}
            >
              <div className="flex items-center gap-2.5">
                <Car size={22} className="text-[#B02019] shrink-0" />
                <h2 className="text-base sm:text-[18px] font-bold text-gray-900 tracking-normal whitespace-nowrap">
                  ປະເພດລົດ (Vehicle Type)
                </h2>
              </div>

              <div className="flex flex-wrap items-center gap-2 sm:gap-2.5 w-full md:w-auto">
                <div className="relative flex-1 sm:flex-initial">
                  <input
                    type="date"
                    value={dateFrom4}
                    onChange={(e) => setDateFrom4(e.target.value)}
                    className="h-10 px-3 bg-white border border-gray-300 text-gray-900 text-sm sm:text-[15px] font-bold focus:outline-none focus:border-[#B02019] rounded-none shadow-xs w-full sm:w-[155px]"
                    style={{ borderRadius: 0 }}
                  />
                </div>
                <div className="relative flex-1 sm:flex-initial">
                  <input
                    type="date"
                    value={dateTo4}
                    onChange={(e) => setDateTo4(e.target.value)}
                    className="h-10 px-3 bg-white border border-gray-300 text-gray-900 text-sm sm:text-[15px] font-bold focus:outline-none focus:border-[#B02019] rounded-none shadow-xs w-full sm:w-[155px]"
                    style={{ borderRadius: 0 }}
                  />
                </div>
                <button
                  type="button"
                  onClick={() => fetchVehicleTypes()}
                  disabled={loading4}
                  className="bg-[#B02019] hover:bg-[#8e1913] active:bg-[#73140f] text-white font-bold h-10 px-4 text-sm sm:text-base flex items-center justify-center gap-1.5 shadow-sm rounded-none border-0 cursor-pointer transition-colors"
                  style={{ borderRadius: 0 }}
                >
                  {loading4 ? <Loader2 size={16} className="animate-spin text-white" /> : null}
                  <span>ດຶງຂໍ້ມູນ</span>
                </button>
                <button
                  type="button"
                  onClick={() => exportPdfSection(4)}
                  disabled={exportingSection === 'pdf-4'}
                  className="bg-[#B02019] hover:bg-[#8e1913] active:bg-[#73140f] text-white font-bold h-10 px-3.5 text-sm sm:text-base flex items-center justify-center gap-1.5 shadow-sm rounded-none border-0 cursor-pointer transition-colors"
                  style={{ borderRadius: 0 }}
                  title="ສ້າງ PDF ປະເພດລົດ (ຂໍ້ມູນແບບໃໝ່)"
                >
                  {exportingSection === 'pdf-4' ? <Loader2 size={16} className="animate-spin text-white" /> : <FileText size={17} className="text-white shrink-0" />}
                  <span>PDF</span>
                </button>
                <button
                  type="button"
                  onClick={() => exportExcelSection(4)}
                  disabled={exportingSection === 'excel-4'}
                  className="bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-bold h-10 px-3.5 text-sm sm:text-base flex items-center justify-center gap-1.5 shadow-sm rounded-none border-0 cursor-pointer transition-colors"
                  style={{ borderRadius: 0 }}
                  title="ດາວໂຫຼດ Excel ປະເພດລົດ (ຂໍ້ມູນແບບໃໝ່)"
                >
                  {exportingSection === 'excel-4' ? <Loader2 size={16} className="animate-spin text-white" /> : <FileSpreadsheet size={17} className="text-white shrink-0" />}
                  <span>Excel</span>
                </button>
              </div>
            </div>

            {/* 4 Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3">
              <StatCard
                title="ລົດໃຫຍ່"
                value={fmt(carParked)}
                unit="ຄັນ"
                iconRaw={carIcon}
                bannerBg="bg-[#B02019]"
              />
              <StatCard
                title="ລົດຈັກ"
                value={fmt(bikeParked)}
                unit="ຄັນ"
                iconRaw={motorbikeIcon}
                bannerBg="bg-[#1D4ED8]"
              />
              <StatCard
                title="ລົດໄຟຟ້າ"
                value={fmt(evParked)}
                unit="ຄັນ"
                iconRaw={zapIcon}
                bannerBg="bg-[#059669]"
              />
              <StatCard
                title="ລົດບັນທຸກ"
                value={fmt(truckParked)}
                unit="ຄັນ"
                iconRaw={truckIcon}
                bannerBg="bg-[#7C3AED]"
              />
            </div>
          </div>

        </div>

        {/* Bottom Red Stripe Divider */}
        <div className="h-[2.5px] bg-[#B02019] w-full shrink-0" />

        {/* Bottom Footer Bar — Dark Gray */}
        <div
          className="bg-[#5D5D5D] px-3 py-3 md:py-0 min-h-[60px] md:h-16 flex flex-col sm:flex-row items-center justify-between gap-3 rounded-none shrink-0"
          style={{ borderRadius: 0 }}
        >
          <div className="flex items-center gap-2 text-white font-bold text-base md:text-[17px]">
            <span>ຈຳນວນ</span>
            <span
              className="bg-[#B02019] text-white h-10 min-w-10 px-2 flex items-center justify-center text-base md:text-[17px] font-bold shadow-sm rounded-none border-0 shrink-0 text-center"
              style={{ borderRadius: 0 }}
            >
              4
            </span>
            <span>ໝວດລາຍງານ</span>
          </div>

          <div className="flex items-center gap-2 text-white font-bold text-base md:text-[17px]">
            <span>
              ອັບເດດວັນທີ: {lastUpdated.toLocaleDateString('lo-LA')} ເວລາ: {lastUpdated.toLocaleTimeString('lo-LA')}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
