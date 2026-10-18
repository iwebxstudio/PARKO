import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import {
  Camera, CameraOff, Search, QrCode,
  X, LogOut, RefreshCw, Printer
} from 'lucide-react';
import { io } from 'socket.io-client';
import toast from 'react-hot-toast';
import api from '../../api/client';
import { useAuth } from '../../contexts/AuthContext';
import type { ParkingTicket } from '../../types';

import funnelIcon from '../../components/icons/funnel.svg?raw';
import carIcon from '../../components/icons/car.svg?raw';
import motorbikeIcon from '../../components/icons/motorbike.svg?raw';
import zapIcon from '../../components/icons/zap.svg?raw';
import truckIcon from '../../components/icons/truck.svg?raw';
import bikeIcon from '../../components/icons/bike.svg?raw';
import chevronDownIcon from '../../components/icons/chevron-down.svg?raw';
import checkIcon from '../../components/icons/check.svg?raw';
import calendarIcon from '../../components/icons/calendar.svg?raw';
import clockIcon from '../../components/icons/clock.svg?raw';

function SvgIcon({ raw, className = "w-5 h-5" }: { raw: string; className?: string }) {
  return (
    <span
      className={`inline-flex items-center justify-center shrink-0 [&>svg]:w-full [&>svg]:h-full [&>svg]:stroke-current ${className}`}
      dangerouslySetInnerHTML={{ __html: raw }}
    />
  );
}

const getVehicleTypeIconRaw = (nameOrLabel = '') => {
  const s = nameOrLabel.toLowerCase();
  if (s.includes('ev') || s.includes('ໄຟຟ້າ') || s.includes('⚡')) return zapIcon;
  if (s.includes('motorcycle') || s.includes('ລົດຈັກ') || s.includes('🏍️')) return motorbikeIcon;
  if (s.includes('bike') || s.includes('ລົດຖີບ') || s.includes('🚲')) return bikeIcon;
  if (s.includes('truck') || s.includes('ບັນທຸກ') || s.includes('🚚')) return truckIcon;
  if (s.includes('car') || s.includes('ໃຫຍ່') || s.includes('🚗')) return carIcon;
  return funnelIcon;
};

type InputMode = 'camera' | 'manual';

export default function CheckOut() {
  const [mode, setMode] = useState<InputMode>('manual');
  const [query, setQuery] = useState('');
  const [multipleTickets, setMultipleTickets] = useState<ParkingTicket[]>([]);
  const [activeTickets, setActiveTickets] = useState<ParkingTicket[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [payMethod, setPayMethod] = useState('CASH');
  const [payStatus, setPayStatus] = useState('PAID');

  // Autocomplete state
  const [suggestions, setSuggestions] = useState<ParkingTicket[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const autocompleteRef = useRef<HTMLDivElement>(null);
  const [processingTicketId, setProcessingTicketId] = useState<string | null>(null);
  const { user } = useAuth();
  const isAdmin = user?.role === 'ADMIN';

  // Custom filter dropdown state
  const [filterOpen, setFilterOpen] = useState(false);
  const filterRef = useRef<HTMLDivElement>(null);

  // Parking type filter state (ຝາກລາຍວັນ, ຝາກລາຍເດືອນ, ຝາກລາຍປີ, ຝາກມີກຳນົດ)
  const [parkingTypeFilterOpen, setParkingTypeFilterOpen] = useState(false);
  const parkingTypeFilterRef = useRef<HTMLDivElement>(null);
  const [selectedParkingType, setSelectedParkingType] = useState<string>('ALL');

  // Camera scanner refs
  const [scanning, setScanning] = useState(false);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const scannerContainerRef = useRef<HTMLDivElement>(null);
  const hasFoundTicket = useRef(false);

  const ITEMS_PER_PAGE = 20;

  // Responsive max page buttons: 4 on Mobile (< 640px), 9 on Desktop
  const [isMobile, setIsMobile] = useState<boolean>(() =>
    typeof window !== 'undefined' ? window.innerWidth < 640 : false
  );

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 640);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const maxPageButtons = isMobile ? 4 : 9;

  const [vehicleTypes, setVehicleTypes] = useState<any[]>([]);
  const [selectedVehicleType, setSelectedVehicleType] = useState<string>('ALL');

  // Centered Success Popup State
  const [checkoutSuccessMsg, setCheckoutSuccessMsg] = useState<string | null>(null);
  const successTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showCenterSuccess = (msg: string) => {
    if (successTimerRef.current) clearTimeout(successTimerRef.current);
    setCheckoutSuccessMsg(msg);
    successTimerRef.current = setTimeout(() => {
      setCheckoutSuccessMsg(null);
      successTimerRef.current = null;
    }, 2500);
  };

  useEffect(() => {
    return () => {
      if (successTimerRef.current) clearTimeout(successTimerRef.current);
    };
  }, []);

  const fetchActiveTickets = async (page = 1, vType = selectedVehicleType) => {
    setLoading(true);
    try {
      const typeParam = vType && vType !== 'ALL' ? `&vehicleTypeId=${vType}` : '';
      const { data } = await api.get(`/parking/active?page=${page}&limit=${ITEMS_PER_PAGE}${typeParam}`);
      const payload = data.data || data;

      let tickets: ParkingTicket[] = [];
      if (Array.isArray(payload.tickets)) tickets = payload.tickets;
      else if (Array.isArray(payload.data)) tickets = payload.data;
      else if (Array.isArray(payload)) tickets = payload;

      if (payload.pagination) {
        setTotalPages(payload.pagination.totalPages || 1);
        setCurrentPage(payload.pagination.page || 1);
        setTotalCount(payload.pagination.total ?? tickets.length);
      } else {
        setTotalPages(Math.max(1, Math.ceil(tickets.length / ITEMS_PER_PAGE)));
        setCurrentPage(1);
        setTotalCount(tickets.length);
      }

      setActiveTickets(tickets);

      // If current page is empty and it's not the first page, go back
      if (tickets.length === 0 && page > 1) {
        fetchActiveTickets(page - 1, vType);
      }
    } catch (e) {
      console.error('Failed to fetch active tickets', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchActiveTickets(1, 'ALL');
    api.get('/pricing/vehicle-types')
      .then((r) => {
        const types = r.data.data || r.data || [];
        setVehicleTypes(types);
      })
      .catch(() => {});

    const WS = import.meta.env.VITE_WS_URL || '';
    const socket = io(`${WS}/parking`, { transports: ['websocket'] });
    socket.on('parking_update', () => {
      fetchActiveTickets(currentPage, selectedVehicleType);
    });
    return () => {
      socket.disconnect();
    };
  }, [currentPage, selectedVehicleType]);

  const handleFilterChange = (newType: string) => {
    setSelectedVehicleType(newType);
    setCurrentPage(1);
    fetchActiveTickets(1, newType);
  };

  // ── QR Camera Scanner ─────────────────────
  const stopScanner = useCallback(async () => {
    if (scannerRef.current) {
      try {
        const state = scannerRef.current.getState();
        if (state === 2) { // SCANNING
          await scannerRef.current.stop();
        }
      } catch { /* ignore */ }
      try {
        scannerRef.current.clear();
      } catch { /* ignore */ }
      scannerRef.current = null;
    }
    setScanning(false);
  }, []);

  const searchTicket = async (searchQuery: string) => {
    const q = searchQuery.trim();
    if (!q) {
      toast.error('ກະລຸນາສະແກນ QR ຫຼື ໃສ່ Ticket ID / ປ້າຍລົດ', { position: 'top-center' });
      return;
    }
    setLoading(true);
    try {
      const { data } = await api.get(`/parking/find/${q}`);
      const payload = data.data || data;

      if (payload.isMultiple) {
        setMultipleTickets(payload.data);
        setSuggestions([]);
        setShowSuggestions(false);
        toast.success(`ພົບລົດ ${payload.data.length} ຄັນ, ກະລຸນາເລືອກ`, { position: 'top-center' });
      } else {
        const foundTicket = payload.isMultiple === false ? payload.data : payload;
        setMultipleTickets([]);
        setSuggestions(foundTicket ? [foundTicket] : []);
        setShowSuggestions(true);
        toast.success('ພົບ Ticket ແລ້ວ!', { position: 'top-center' });
      }
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'ບໍ່ພົບ Ticket', { position: 'top-center' });
      setSuggestions([]);
      setMultipleTickets([]);
      hasFoundTicket.current = false;
      if (mode === 'camera') {
        setTimeout(() => startScanner(), 500);
      }
    } finally {
      setLoading(false);
    }
  };

  const startScanner = useCallback(async () => {
    if (scannerRef.current || !scannerContainerRef.current) return;
    hasFoundTicket.current = false;

    try {
      const scanner = new Html5Qrcode('qr-reader');
      scannerRef.current = scanner;
      setScanning(true);

      await scanner.start(
        { facingMode: 'environment' },
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
          aspectRatio: 1,
        },
        (decodedText) => {
          if (hasFoundTicket.current) return;
          hasFoundTicket.current = true;

          let searchQuery = decodedText;
          try {
            const parsed = JSON.parse(decodedText);
            if (parsed.ticketNumber) searchQuery = parsed.ticketNumber;
          } catch { /* not JSON, use raw text */ }

          setQuery(searchQuery);
          searchTicket(searchQuery);
          setMode('manual');
          stopScanner();
        },
        () => { /* ignore scan errors */ }
      );
    } catch (err: any) {
      toast.error('ບໍ່ສາມາດເປີດກ້ອງ: ' + (err?.message || 'Permission denied'), { position: 'top-center' });
      setScanning(false);
      scannerRef.current = null;
    }
  }, [stopScanner]);

  // Auto-start camera when mode = camera
  useEffect(() => {
    if (mode === 'camera') {
      const t = setTimeout(() => startScanner(), 300);
      return () => { clearTimeout(t); stopScanner(); };
    } else {
      stopScanner();
    }
  }, [mode, startScanner, stopScanner]);

  useEffect(() => {
    return () => { stopScanner(); };
  }, [stopScanner]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (autocompleteRef.current && !autocompleteRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
      if (filterRef.current && !filterRef.current.contains(event.target as Node)) {
        setFilterOpen(false);
      }
      if (parkingTypeFilterRef.current && !parkingTypeFilterRef.current.contains(event.target as Node)) {
        setParkingTypeFilterOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Real-time Autocomplete Debounce
  useEffect(() => {
    if (!query || query.trim().length < 2) {
      setSuggestions([]);
      setShowSuggestions(false);
      setIsTyping(false);
      return;
    }

    if (processingTicketId) return;

    setIsTyping(true);
    const delay = setTimeout(async () => {
      try {
        const { data } = await api.get(`/parking/find/${query.trim()}`);
        const payload = data.data || data;
        if (payload.isMultiple) {
          setMultipleTickets(payload.data);
          setSuggestions([]);
        } else {
          setMultipleTickets([]);
          const found = payload.isMultiple === false ? payload.data : payload;
          setSuggestions(found ? [found] : []);
        }
        setShowSuggestions(true);
      } catch {
        setSuggestions([]);
        setMultipleTickets([]);
        setShowSuggestions(true);
      } finally {
        setIsTyping(false);
      }
    }, 400);

    return () => clearTimeout(delay);
  }, [query, processingTicketId]);

  const search = () => searchTicket(query);

  const handleCheckOutDirect = async (targetTicket: ParkingTicket) => {
    setProcessingTicketId(targetTicket.id);
    try {
      // If it's a membership ticket, calculate overdue fee if overdue, or 0 if within duration
      let amountPaid = targetTicket.calculatedCost || 0;
      if (targetTicket.membershipId || (targetTicket as any).membership) {
        const endRaw = (targetTicket as any).customEnd || (targetTicket as any).membership?.endDate;
        if (endRaw) {
          const end = new Date(endRaw);
          end.setHours(23, 59, 59, 999);
          const now = new Date();
          const isOverdue = now.getTime() > end.getTime();
          if (isOverdue) {
            const overdueDays = Math.max(1, Math.ceil((now.getTime() - end.getTime()) / (1000 * 60 * 60 * 24)));
            const rule = (targetTicket.vehicleType as any)?.pricingRules?.[0];
            const dailyRate = Number(rule?.dailyRate || 0);
            amountPaid = overdueDays * dailyRate;
          } else {
            amountPaid = 0;
          }
        }
      }

      await api.post('/parking/check-out', {
        identifier: targetTicket.ticketNumber,
        paymentMethod: payMethod,
        paymentStatus: payStatus,
        amountPaid,
      });
      showCenterSuccess('ລົດອອກສຳເລັດ!');
      window.dispatchEvent(new CustomEvent('membership-updated'));
      try {
        const channel = new BroadcastChannel('parko_channel');
        channel.postMessage('membership_updated');
        channel.close();
      } catch {}

      // Remove instantly from active state so it vanishes from this screen immediately
      setActiveTickets(prev => prev.filter(t => t.id !== targetTicket.id && t.ticketNumber !== targetTicket.ticketNumber));
      setSuggestions(prev => prev.filter(t => t.id !== targetTicket.id && t.ticketNumber !== targetTicket.ticketNumber));
      setMultipleTickets(prev => prev.filter(t => t.id !== targetTicket.id && t.ticketNumber !== targetTicket.ticketNumber));
      setTotalCount(prev => Math.max(0, prev - 1));

      setQuery('');
      setShowSuggestions(false);

      await fetchActiveTickets(currentPage, selectedVehicleType);

      hasFoundTicket.current = false;
      if (mode === 'camera') {
        setTimeout(() => startScanner(), 500);
      }
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'Failed', { position: 'top-center' });
      hasFoundTicket.current = false;
      if (mode === 'camera') {
        setTimeout(() => startScanner(), 500);
      }
    } finally {
      setProcessingTicketId(null);
    }
  };

  const handlePrint = async (ticketToPrint?: any) => {
    if (!ticketToPrint) return;
    toast.success('🖨️ ກຳລັງສົ່ງໄປທີ່ Print Agent...');
    try {
      await fetch('/print', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ticket: ticketToPrint }),
      });
    } catch {
      toast.error('Print Agent ບໍ່ຕອບສະໜອງ');
    }
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '-';
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      const day = String(d.getDate()).padStart(2, '0');
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const year = d.getFullYear();
      return `${day}/${month}/${year}`;
    } catch {
      return dateStr;
    }
  };

  const formatTime = (dateStr: string) => {
    if (!dateStr) return '-';
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      return d.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
      });
    } catch {
      return dateStr;
    }
  };

  const getVehicleTheme = (t: ParkingTicket) => {
    const typeName = (t.vehicleType?.name || '').toLowerCase();
    const label = (t.vehicleType?.label || '').toLowerCase();

    // 1. EV Motorcycle / Electric (Emerald Green)
    if (typeName.includes('ev') || label.includes('ໄຟຟ້າ') || t.vehicleType?.icon?.includes('⚡')) {
      return {
        bannerBg: 'bg-[#059669]',
        btnBg: 'bg-[#059669] hover:bg-[#047857]',
        iconRaw: zapIcon,
      };
    }
    // 2. Motorcycle / Bike / ລົດຈັກ / ລົດຖີບ (Royal Blue / Sky Blue)
    if (
      typeName.includes('motorcycle') ||
      typeName.includes('bike') ||
      label.includes('ຈັກ') ||
      label.includes('ຖີບ') ||
      t.vehicleType?.icon?.includes('🏍️') ||
      t.vehicleType?.icon?.includes('🚲')
    ) {
      const isBicycle = typeName === 'bicycle' || label.includes('ຖີບ') || t.vehicleType?.icon?.includes('🚲');
      return {
        bannerBg: isBicycle ? 'bg-[#0284C7]' : 'bg-[#1D4ED8]',
        btnBg: isBicycle ? 'bg-[#0284C7] hover:bg-[#0369a1]' : 'bg-[#1D4ED8] hover:bg-[#1e40af]',
        iconRaw: isBicycle ? bikeIcon : motorbikeIcon,
      };
    }
    // 3. Truck / ລົດບັນທຸກ (Purple)
    if (typeName.includes('truck') || label.includes('ບັນທຸກ') || t.vehicleType?.icon?.includes('🚚')) {
      return {
        bannerBg: 'bg-[#7C3AED]',
        btnBg: 'bg-[#7C3AED] hover:bg-[#6d28d9]',
        iconRaw: truckIcon,
      };
    }
    // 4. Car / ລົດໃຫຍ່ (Deep Red)
    return {
      bannerBg: 'bg-[#B02019]',
      btnBg: 'bg-[#B02019] hover:bg-[#961b15]',
      iconRaw: carIcon,
    };
  };

  const parkingTypeFilterOptions = [
    { id: 'ALL', label: 'ປະເພດຝາກ', iconRaw: funnelIcon },
    { id: 'DAILY', label: 'ຝາກລາຍວັນ', iconRaw: clockIcon },
    { id: 'MONTHLY', label: 'ຝາກລາຍເດືອນ', iconRaw: calendarIcon },
    { id: 'YEARLY', label: 'ຝາກລາຍປີ', iconRaw: calendarIcon },
    { id: 'CUSTOM', label: 'ຝາກມີກຳນົດ', iconRaw: calendarIcon },
  ];

  const selectedParkingOption =
    parkingTypeFilterOptions.find((opt) => opt.id === selectedParkingType) || parkingTypeFilterOptions[0];

  const handleParkingTypeChange = (newType: string) => {
    setSelectedParkingType(newType);
    setCurrentPage(1);
  };

  const getParkingTypeLabel = (t: any) => {
    const pType = (t?.parkingType || '').toUpperCase();
    const memType = (t?.membership?.memberType || '').toUpperCase();
    const notes = (t?.notes || t?.membership?.notes || '');
    if (pType === 'MONTHLY' || memType === 'MONTHLY') return 'ຝາກລາຍເດືອນ';
    if (pType === 'YEARLY' || memType === 'YEARLY' || notes.includes('(ຝາກລາຍປີ)')) return 'ຝາກລາຍປີ';
    if (pType === 'WEEKLY' || memType === 'WEEKLY') return 'ຝາກລາຍອາທິດ';
    if (memType === 'DAILY' || notes.includes('(ຝາກລາຍວັນ)')) return 'ຝາກລາຍວັນ';
    if (t?.membershipId || pType === 'CUSTOM' || t?.customEnd) return 'ຝາກມີກຳນົດ';
    return 'ຝາກລາຍວັນ';
  };

  const hasQuery = query.trim().length >= 2;
  const isSearching = hasQuery || multipleTickets.length > 0 || selectedVehicleType !== 'ALL' || selectedParkingType !== 'ALL';
  const rawTickets = multipleTickets.length > 0
    ? multipleTickets
    : (hasQuery ? suggestions : activeTickets);

  const displayTickets = rawTickets.filter((t: any) => {
    // Only display active parked vehicles (completed tickets are recorded in History)
    if (t.status && t.status !== 'ACTIVE') return false;

    // 1. Vehicle Type Filter
    if (selectedVehicleType && selectedVehicleType !== 'ALL') {
      const vtId = String(t.vehicleTypeId || t.vehicleType?.id || '');
      const vtName = (t.vehicleType?.name || '').toLowerCase();
      const sel = selectedVehicleType.toLowerCase();
      if (vtId !== sel && vtName !== sel) return false;
    }

    // 2. Parking Type Filter (ຝາກລາຍວັນ, ຝາກລາຍເດືອນ, ຝາກລາຍປີ, ຝາກມີກຳນົດ)
    if (selectedParkingType && selectedParkingType !== 'ALL') {
      const pType = (t.parkingType || '').toUpperCase();
      const memType = (t.membership?.memberType || '').toUpperCase();
      const notes = (t.notes || t.membership?.notes || '');
      const hasMembership = Boolean(t.membershipId);

      if (selectedParkingType === 'DAILY') {
        const isDaily = ((pType === 'DAILY' || pType === 'HOURLY' || !pType) && !hasMembership) || memType === 'DAILY' || notes.includes('(ຝາກລາຍວັນ)');
        if (!isDaily) return false;
      } else if (selectedParkingType === 'MONTHLY') {
        const isMonthly = pType === 'MONTHLY' || memType === 'MONTHLY';
        if (!isMonthly) return false;
      } else if (selectedParkingType === 'YEARLY') {
        const isYearly = pType === 'YEARLY' || memType === 'YEARLY' || notes.includes('(ຝາກລາຍປີ)');
        if (!isYearly) return false;
      } else if (selectedParkingType === 'CUSTOM') {
        const isCustom = hasMembership || pType === 'CUSTOM' || pType === 'WEEKLY' || Boolean(t.customEnd);
        if (!isCustom) return false;
      }
    }

    return true;
  });

  const currentCount = isSearching ? displayTickets.length : totalCount;

  // Compute visible pages (Mobile = 4 buttons, Desktop = 9 buttons)
  const getVisiblePages = () => {
    if (totalPages <= maxPageButtons) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }
    let start = Math.max(1, currentPage - Math.floor(maxPageButtons / 2));
    let end = Math.min(totalPages, start + maxPageButtons - 1);
    if (end - start + 1 < maxPageButtons) {
      start = Math.max(1, end - maxPageButtons + 1);
    }
    return Array.from({ length: end - start + 1 }, (_, i) => start + i);
  };

  const visiblePages = getVisiblePages();

  const fallbackFilterOptions = [
    { id: 'ALL', label: 'ປະເພດລົດ', iconRaw: funnelIcon },
    { id: '1', label: 'ລົດໃຫຍ່', iconRaw: carIcon },
    { id: '2', label: 'ລົດຈັກ', iconRaw: motorbikeIcon },
    { id: '3', label: 'ລົດຈັກໄຟຟ້າ', iconRaw: zapIcon },
    { id: '4', label: 'ລົດບັນທຸກ', iconRaw: truckIcon },
  ];

  const filterOptions = [
    { id: 'ALL', label: 'ປະເພດລົດ', iconRaw: funnelIcon },
    ...[...vehicleTypes]
      .sort((a, b) => {
        const order = ['car', 'motorcycle', 'ev_motorcycle', 'truck'];
        const idxA = order.indexOf(a.name);
        const idxB = order.indexOf(b.name);
        if (idxA !== -1 && idxB !== -1) return idxA - idxB;
        if (idxA !== -1) return -1;
        if (idxB !== -1) return 1;
        return (a.sortOrder || 0) - (b.sortOrder || 0);
      })
      .map((vt) => ({
        id: String(vt.id),
        label: vt.label || vt.name,
        iconRaw: getVehicleTypeIconRaw((vt.name || '') + ' ' + (vt.label || '')),
      })),
  ];

  const currentOptions = filterOptions.length > 1 ? filterOptions : fallbackFilterOptions;
  const selectedOption =
    currentOptions.find((opt) => opt.id === String(selectedVehicleType)) || currentOptions[0];

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
          {/* Top Row on Mobile / Left Section on Desktop: Icon + Title + Mobile Scan QR button */}
          <div className="flex items-center justify-between w-full md:w-auto h-10">
            <div className="flex items-center gap-2.5">
              <LogOut size={20} className="w-5 h-5 text-white shrink-0 rotate-180" />
              <h1 className="text-base md:text-[17px] font-bold text-white tracking-normal whitespace-nowrap">
                ລົດອອກ
              </h1>
            </div>

            {/* Mobile-Only Scan QR Button — Square white button with black icon */}
            <button
              type="button"
              onClick={() => setMode(mode === 'camera' ? 'manual' : 'camera')}
              title={mode === 'camera' ? 'ປິດ' : 'ສະແກນ QR'}
              className="md:hidden w-10 h-10 bg-white hover:bg-gray-100 active:bg-gray-200 text-black shadow-sm shrink-0 flex items-center justify-center transition-colors border-0 outline-none rounded-none cursor-pointer"
              style={{ borderRadius: 0 }}
            >
              <QrCode size={24} className="w-6 h-6 text-black shrink-0" />
            </button>
          </div>

          {/* Controls: Search Box + Filters + Desktop Scan QR */}
          <div
            className="flex flex-col md:flex-row items-stretch md:items-center md:justify-end md:ml-auto gap-1.5 sm:gap-2 md:gap-2.5 lg:gap-3 w-full md:w-auto shrink-0"
            ref={autocompleteRef}
          >
            {/* Search Input Box — Full width on mobile, expanded width on desktop */}
            <div className="flex items-center bg-white shadow-sm w-full md:w-[280px] lg:w-[315px] xl:w-[325px] rounded-l-none rounded-r-full overflow-hidden pl-3 sm:pl-3.5 h-10 min-h-[40px] shrink-0">
              <div className="flex items-center justify-center text-[#F9A825] shrink-0">
                <Search size={18} className="w-[18px] h-[18px] text-[#F9A825]" />
              </div>
              <input
                type="search"
                name="ticketSearchFilter"
                autoComplete="off"
                data-lpignore="true"
                placeholder="ຄົ້ນຫາ Ticket ID/ປ້າຍລົດ"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    setShowSuggestions(false);
                    search();
                  }
                }}
                onFocus={() => {
                  if (query.trim().length >= 2) setShowSuggestions(true);
                }}
                className="px-2.5 h-full text-base md:text-[17px] font-bold text-gray-800 placeholder:text-base md:placeholder:text-[17px] placeholder:font-bold placeholder:text-gray-500 focus:outline-none flex-1 min-w-0 bg-transparent [&::-webkit-search-cancel-button]:hidden [&::-webkit-search-decoration]:hidden"
              />
              {query && (
                <button
                  type="button"
                  onClick={() => {
                    setQuery('');
                    setSuggestions([]);
                    setMultipleTickets([]);
                  }}
                  className="px-1.5 text-gray-400 hover:text-gray-600 transition-colors shrink-0"
                >
                  <X size={16} />
                </button>
              )}
              <button
                type="button"
                onClick={() => {
                  setShowSuggestions(false);
                  search();
                }}
                disabled={loading}
                className="bg-[#F9A825] hover:bg-[#e69510] text-black font-bold px-3.5 sm:px-4.5 h-full text-base md:text-[17px] transition-colors rounded-r-full ml-auto flex items-center justify-center cursor-pointer disabled:opacity-50 shrink-0"
              >
                {loading ? <RefreshCw size={15} className="animate-spin text-black" /> : 'ຄົ້ນຫາ'}
              </button>
            </div>

            {/* Filter Dropdowns: 2 Columns on Mobile, Flex on Desktop */}
            <div className="grid grid-cols-2 md:flex items-center gap-1.5 sm:gap-2 md:gap-2.5 lg:gap-3 w-full md:w-auto shrink-0">
              {/* Vehicle Type Filter Dropdown */}
              <div ref={filterRef} className="relative w-full md:w-[144px] lg:w-[150px]">
                <button
                  type="button"
                  onClick={() => {
                    setFilterOpen((prev) => !prev);
                    setParkingTypeFilterOpen(false);
                  }}
                  className="w-full h-10 bg-white shadow-sm flex items-center justify-between gap-1.5 px-2.5 sm:px-3 transition-colors cursor-pointer select-none border-0 outline-none rounded-none hover:bg-gray-50 active:bg-gray-100"
                  style={{ borderRadius: 0 }}
                >
                  <div className="flex items-center gap-1.5 min-w-0 flex-1 overflow-hidden">
                    <SvgIcon
                      raw={selectedOption.iconRaw}
                      className="w-4.5 h-4.5 text-[#F9A825] shrink-0"
                    />
                    <span className="text-gray-800 font-bold text-base md:text-[17px] truncate">
                      {selectedOption.label}
                    </span>
                  </div>
                  <SvgIcon
                    raw={chevronDownIcon}
                    className={`w-4 h-4 text-gray-500 shrink-0 transition-transform duration-200 ${
                      filterOpen ? 'rotate-180' : ''
                    }`}
                  />
                </button>

                {/* Custom Dropdown Menu */}
                {filterOpen && (
                  <div
                    className="absolute top-full mt-1.5 left-0 w-max min-w-full max-w-[200px] bg-white shadow-[0_12px_28px_rgba(0,0,0,0.18)] z-50 py-1 border-0 rounded-none animate-fade-in"
                    style={{ borderRadius: 0 }}
                  >
                    {currentOptions.map((opt) => {
                      const isSelected = String(selectedVehicleType) === opt.id;
                      return (
                        <button
                          key={opt.id}
                          type="button"
                          onClick={() => {
                            handleFilterChange(opt.id);
                            setFilterOpen(false);
                          }}
                          className={`w-full h-10 px-3 flex items-center justify-between gap-2 text-left transition-colors font-bold text-base md:text-[17px] border-0 outline-none rounded-none cursor-pointer ${
                            isSelected
                              ? 'bg-amber-100/70 text-[#B02019]'
                              : 'text-gray-800 hover:bg-amber-50 hover:text-[#B02019]'
                          }`}
                          style={{ borderRadius: 0 }}
                        >
                          <div className="flex items-center gap-2 min-w-0 flex-1">
                            <SvgIcon
                              raw={opt.iconRaw}
                              className={`w-4 h-4 shrink-0 ${
                                isSelected ? 'text-[#B02019]' : 'text-gray-600'
                              }`}
                            />
                            <span className="truncate">{opt.label}</span>
                          </div>
                          {isSelected && (
                            <SvgIcon raw={checkIcon} className="w-4 h-4 text-[#B02019] shrink-0" />
                          )}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Parking Type Filter Dropdown */}
              <div ref={parkingTypeFilterRef} className="relative w-full md:w-[152px] lg:w-[158px]">
                <button
                  type="button"
                  onClick={() => {
                    setParkingTypeFilterOpen((prev) => !prev);
                    setFilterOpen(false);
                  }}
                  className="w-full h-10 bg-white shadow-sm flex items-center justify-between gap-1.5 px-2.5 sm:px-3 transition-colors cursor-pointer select-none border-0 outline-none rounded-none hover:bg-gray-50 active:bg-gray-100"
                  style={{ borderRadius: 0 }}
                >
                  <div className="flex items-center gap-1.5 min-w-0 flex-1 overflow-hidden">
                    <SvgIcon
                      raw={selectedParkingOption.iconRaw}
                      className="w-4.5 h-4.5 text-[#F9A825] shrink-0"
                    />
                    <span className="text-gray-800 font-bold text-base md:text-[17px] truncate">
                      {selectedParkingOption.label}
                    </span>
                  </div>
                  <SvgIcon
                    raw={chevronDownIcon}
                    className={`w-4 h-4 text-gray-500 shrink-0 transition-transform duration-200 ${
                      parkingTypeFilterOpen ? 'rotate-180' : ''
                    }`}
                  />
                </button>

                {/* Custom Dropdown Menu */}
                {parkingTypeFilterOpen && (
                  <div
                    className="absolute top-full mt-1.5 left-0 w-max min-w-full max-w-[200px] bg-white shadow-[0_12px_28px_rgba(0,0,0,0.18)] z-50 py-1 border-0 rounded-none animate-fade-in"
                    style={{ borderRadius: 0 }}
                  >
                    {parkingTypeFilterOptions.map((opt) => {
                      const isSelected = selectedParkingType === opt.id;
                      return (
                        <button
                          key={opt.id}
                          type="button"
                          onClick={() => {
                            handleParkingTypeChange(opt.id);
                            setParkingTypeFilterOpen(false);
                          }}
                          className={`w-full h-10 px-3 flex items-center justify-between gap-2 text-left transition-colors font-bold text-base md:text-[17px] border-0 outline-none rounded-none cursor-pointer ${
                            isSelected
                              ? 'bg-amber-100/70 text-[#B02019]'
                              : 'text-gray-800 hover:bg-amber-50 hover:text-[#B02019]'
                          }`}
                          style={{ borderRadius: 0 }}
                        >
                          <div className="flex items-center gap-2 min-w-0 flex-1">
                            <SvgIcon
                              raw={opt.iconRaw}
                              className={`w-4 h-4 shrink-0 ${
                                isSelected ? 'text-[#B02019]' : 'text-gray-600'
                              }`}
                            />
                            <span className="truncate">{opt.label}</span>
                          </div>
                          {isSelected && (
                            <SvgIcon raw={checkIcon} className="w-4 h-4 text-[#B02019] shrink-0" />
                          )}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Desktop-Only Scan QR Button — Square white button with black icon and no border-radius */}
              <button
                type="button"
                onClick={() => setMode(mode === 'camera' ? 'manual' : 'camera')}
                title={mode === 'camera' ? 'ປິດສະແກນ QR' : 'ສະແກນ QR Code'}
                className="hidden md:flex w-10 h-10 bg-white hover:bg-gray-100 active:bg-gray-200 text-black shadow-sm shrink-0 items-center justify-center transition-colors border-0 outline-none rounded-none cursor-pointer"
                style={{ borderRadius: 0 }}
              >
                <QrCode size={24} className="w-6 h-6 text-black shrink-0" />
              </button>
            </div>
          </div>
        </div>

        {/* Top Red Stripe Divider */}
        <div className="h-[2.5px] bg-[#B02019] w-full shrink-0" />

        {/* Main Body — Orange Background (Tight 12px padding aligning cards with header icons) */}
        <div className="bg-[#F9A825] p-3 flex flex-col justify-start">
          {mode === 'camera' ? (
            /* Camera Scanner Container */
            <div className="max-w-2xl mx-auto w-full shadow-lg bg-white my-auto animate-fade-in rounded-none overflow-hidden">
              <div className="bg-[#B02019] py-3.5 px-5 text-white flex items-center justify-between">
                <div className="flex items-center gap-2 font-bold text-lg">
                  <Camera size={22} />
                  <span>ສະແກນ QR Code</span>
                </div>
                <button
                  type="button"
                  onClick={() => setMode('manual')}
                  className="text-white hover:text-white/80 p-1"
                >
                  <X size={20} />
                </button>
              </div>
              <div className="p-6 flex flex-col items-center bg-gray-50">
                <div className="relative bg-gray-900 overflow-hidden w-full max-w-sm mx-auto shadow-inner aspect-square flex items-center justify-center">
                  <div id="qr-reader" ref={scannerContainerRef} className="w-full h-full" />
                  {!scanning && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-900/95 text-white p-4 text-center">
                      <CameraOff size={44} className="text-gray-500 mb-2" />
                      <p className="text-gray-300 font-medium text-sm mb-3">ກ້ອງຍັງບໍ່ເປີດ</p>
                      <button
                        type="button"
                        onClick={startScanner}
                        className="bg-[#F9A825] hover:bg-[#e0921a] text-black px-5 py-2 font-bold flex items-center gap-2 shadow-md transition-colors"
                      >
                        <Camera size={18} /> ເປີດກ້ອງ
                      </button>
                    </div>
                  )}
                </div>
                <p className="text-gray-500 text-sm mt-4 font-medium text-center">
                  ສ່ອງກ້ອງໃສ່ QR Code ທີ່ຢູ່ໃນປີ້ລົດເພື່ອດຳເນີນການ
                </p>
              </div>
            </div>
          ) : (
            /* Cards Grid */
            <>
              {displayTickets.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-3.5 lg:gap-4 animate-fade-in">
                  {displayTickets.map((t) => {
                    const theme = getVehicleTheme(t);
                    return (
                      <div
                        key={t.id}
                        className="bg-white shadow-[0_4px_12px_rgba(0,0,0,0.12)] hover:shadow-[0_8px_20px_rgba(0,0,0,0.18)] transition-all flex flex-col rounded-none overflow-hidden"
                      >
                        {/* Top Card Header: Distinctive vehicle type color + compact vertical spacing */}
                        <div className={`${theme.bannerBg} py-2 sm:py-2.5 flex justify-center items-center shadow-inner transition-colors`}>
                          <SvgIcon raw={theme.iconRaw} className="w-9 h-9 sm:w-10 sm:h-10 text-white" />
                        </div>

                        {/* Bottom Card Body: Compact, space-saving info */}
                        <div className="px-3 py-2 sm:px-3.5 sm:py-2.5 flex flex-col justify-between flex-1 bg-white">
                          <div className="grid grid-cols-[auto_auto_1fr] gap-x-2 gap-y-0.5 text-[15px] sm:text-[15.5px] font-bold text-black mx-auto w-fit leading-tight my-0.5">
                            <span className="text-right">ປະເພດ</span>
                            <span>:</span>
                            <span className="truncate">{t.vehicleType?.label || '-'}</span>

                            <span className="text-right">ຮູບແບບ</span>
                            <span>:</span>
                            <span className="truncate text-amber-700">{getParkingTypeLabel(t)}</span>

                            <span className="text-right">ເລກ</span>
                            <span>:</span>
                            <span className="truncate">{t.plateNumber || '-'}</span>

                            <span className="text-right">ໂຕອັກສອນ</span>
                            <span>:</span>
                            <span className="truncate">{t.plateLetters || '-'}</span>

                            <span className="text-right">ອອກແຂວງ</span>
                            <span>:</span>
                            <span className="truncate">{t.plateProvince || '-'}</span>

                            <span className="text-right">ວັນທີເຂົ້າ</span>
                            <span>:</span>
                            <span className="whitespace-nowrap">{formatDate(t.checkInAt)}</span>

                            <span className="text-right">ເວລາເຂົ້າ</span>
                            <span>:</span>
                            <span className="whitespace-nowrap">{formatTime(t.checkInAt)}</span>

                            <span className="text-right">Ticket ID</span>
                            <span>:</span>
                            <span className="truncate">{t.ticketNumber}</span>

                            <span className="text-right">ສະຖານະ</span>
                            <span>:</span>
                            <span className={t.status === 'ACTIVE' ? 'text-emerald-600' : 'text-gray-600'}>
                              {t.status === 'ACTIVE' ? 'ລົດເຂົ້າ' : t.status === 'COMPLETED' ? 'ລົດອອກ' : (t.status || '-')}
                            </span>

                            {t.membership?.memberCode && (
                              <>
                                <span className="text-right">ລະຫັດ</span>
                                <span>:</span>
                                <span className="truncate text-blue-700 font-bold">{t.membership.memberCode}</span>
                              </>
                            )}

                            <span className="text-right">ສະຖານະຈ່າຍ</span>
                            <span>:</span>
                            <span className={t.paymentStatus === 'PAID' ? 'text-emerald-600' : 'text-amber-600'}>
                              {t.paymentStatus === 'PAID' ? 'ຈ່າຍແລ້ວ' : 'ຍັງບໍ່ທັນຈ່າຍ'}
                            </span>
                          </div>

                          {/* Overdue alert and price if overdue */}
                          {(() => {
                            const endDateRaw = (t as any).customEnd || (t as any).membership?.endDate;
                            if (!endDateRaw) return null;
                            const end = new Date(endDateRaw);
                            end.setHours(23, 59, 59, 999);
                            const now = new Date();
                            const isOverdue = now.getTime() > end.getTime();
                            if (!isOverdue) return null;
                            const overdueDays = Math.max(1, Math.ceil((now.getTime() - end.getTime()) / (1000 * 60 * 60 * 24)));
                            const rule = (t.vehicleType as any)?.pricingRules?.[0];
                            const dailyRate = Number(rule?.dailyRate || 0);
                            const cost = overdueDays * dailyRate;
                            return (
                              <div className="mt-1.5 p-1.5 bg-red-50 border border-red-300 text-center rounded-none">
                                <span className="text-[12.5px] font-bold text-red-700 block">
                                  🚨 ກາຍກຳນົດ {overdueDays} ມື້!
                                </span>
                                <span className="text-[13.5px] font-black text-[#B02019]">
                                  ລາຄາກາຍກຳນົດ: {new Intl.NumberFormat('lo-LA').format(cost)} ₭
                                </span>
                              </div>
                            );
                          })()}

                          {/* Action Buttons */}
                          <div className="mt-2 sm:mt-2.5 w-full">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleCheckOutDirect(t);
                              }}
                              disabled={processingTicketId === t.id}
                              className={`${theme.btnBg} text-white font-bold h-9.5 sm:h-10 px-4 w-full shadow-md rounded-full transition-all active:scale-95 text-[14px] sm:text-[15px] disabled:opacity-50 cursor-pointer flex items-center justify-center gap-1.5`}
                            >
                              <LogOut size={16} className="rotate-180 shrink-0" />
                              <span className="whitespace-nowrap">
                                {processingTicketId === t.id ? 'ກຳລັງອອກ...' : 'ລົດອອກ(Check out)'}
                              </span>
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                /* Empty State Matching Members.tsx */
                <div className="py-12 sm:py-16 text-center flex flex-col items-center justify-center select-none">
                  <h3 className="text-base sm:text-[18px] font-bold text-black mb-1">
                    {isSearching ? 'ບໍ່ພົບຂໍ້ມູນລົດທີ່ຄົ້ນຫາ' : 'ບໍ່ມີລົດທີ່ກຳລັງຈອດຢູ່ໃນຂະນະນີ້'}
                  </h3>
                  <p className="text-sm sm:text-base font-bold text-black">
                    {isSearching ? 'ກະລຸນາກວດສອບ Ticket ID ຫຼື ປ້າຍລົດຄືນໃໝ່' : 'ລົດທຸກຄັນໄດ້ Check-out ອອກໝົດແລ້ວ'}
                  </p>
                </div>
              )}
            </>
          )}
        </div>

        {/* Bottom Red Stripe Divider */}
        <div className="h-[2.5px] bg-[#B02019] w-full shrink-0" />

        {/* Bottom Footer Bar — Dark Gray (matching CheckOut header) */}
        <div
          className="bg-[#5D5D5D] px-3 py-3 md:py-0 min-h-[60px] md:h-16 flex flex-col sm:flex-row items-center justify-between gap-3 rounded-none shrink-0"
          style={{ borderRadius: 0 }}
        >
          {/* Left: Total Count Badge (Square w-10 h-10) */}
          <div className="flex items-center gap-2 text-white font-bold text-base md:text-[17px]">
            <span>ຈຳນວນ</span>
            <span
              className="bg-[#B02019] text-white h-10 w-10 flex items-center justify-center text-base md:text-[17px] font-bold shadow-sm rounded-none border-0 shrink-0 text-center"
              style={{ borderRadius: 0 }}
            >
              {currentCount}
            </span>
            <span>ລາຍການ</span>
          </div>

          {/* Right: Pagination Controls (Equal width buttons, square page buttons) */}
          <div className="flex items-center gap-1.5 sm:gap-2 max-w-full overflow-x-auto no-scrollbar py-1">
            <button
              type="button"
              onClick={() => fetchActiveTickets(currentPage - 1)}
              disabled={currentPage <= 1 || loading}
              className="bg-[#B02019] hover:bg-[#961b15] text-white font-bold h-10 px-4 sm:w-24 flex items-center justify-center text-base md:text-[17px] transition-colors shadow-sm rounded-none border-0 outline-none disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer shrink-0"
              style={{ borderRadius: 0 }}
            >
              ຖອຍກັບ
            </button>

            {/* Page number buttons (Squares h-10 w-10) */}
            {visiblePages.map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => fetchActiveTickets(p)}
                disabled={loading}
                className={`h-10 w-10 flex items-center justify-center font-bold text-base md:text-[17px] shadow-sm transition-colors text-white rounded-none border-0 outline-none cursor-pointer shrink-0 ${
                  currentPage === p
                    ? 'bg-[#B02019]'
                    : 'bg-[#B02019] hover:bg-[#961b15]'
                }`}
                style={{ borderRadius: 0 }}
              >
                {p}
              </button>
            ))}

            <button
              type="button"
              onClick={() => fetchActiveTickets(currentPage + 1)}
              disabled={currentPage >= totalPages || loading || totalPages === 0}
              className="bg-[#B02019] hover:bg-[#961b15] text-white font-bold h-10 px-4 sm:w-24 flex items-center justify-center text-base md:text-[17px] transition-colors shadow-sm rounded-none border-0 outline-none disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer shrink-0"
              style={{ borderRadius: 0 }}
            >
              ໄປໜ້າ
            </button>
          </div>
        </div>
      </div>

      {/* Centered Success Notification Popup (Dead Center of Screen) */}
      {checkoutSuccessMsg && (
        <div className="fixed inset-0 z-[9999] pointer-events-none flex items-center justify-center p-4">
          <div
            className="animate-scale-in bg-[#1e293b] text-[#f1f5f9] px-5 py-2.5 sm:px-6 sm:py-3 rounded-none shadow-[0_15px_45px_rgba(0,0,0,0.6)] border-0 flex items-center gap-3 font-bold text-base md:text-[17px] select-none"
            style={{ borderRadius: 0 }}
          >
            <div
              className="w-7 h-7 sm:w-7.5 sm:h-7.5 bg-[#22c55e] flex items-center justify-center text-white shrink-0 shadow-sm rounded-none"
              style={{ borderRadius: 0 }}
            >
              <svg className="w-5 h-5 stroke-current stroke-[2.5]" fill="none" viewBox="0 0 24 24">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>
            <span className="tracking-wide text-base md:text-[17px] font-bold">{checkoutSuccessMsg}</span>
          </div>
        </div>
      )}
    </div>
  );
}
