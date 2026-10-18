import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  History, Search, X, Printer, Trash2, RefreshCw, LogIn
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../api/client';
import { useAuth } from '../../contexts/AuthContext';

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

const getVehicleTheme = (t: any) => {
  const typeName = (t.vehicleType?.name || '').toLowerCase();
  const label = (t.vehicleType?.label || '').toLowerCase();

  // 1. ລົດຈັກໄຟຟ້າ / ພະລັງງານໄຟຟ້າ (EV Motorcycle) — ກຳນົດໂທນສີຂຽວມໍລະກົດ (Emerald Green)
  if (typeName.includes('ev') || label.includes('ໄຟຟ້າ') || t.vehicleType?.icon?.includes('⚡')) {
    return {
      bannerBg: 'bg-[#059669]',
      btnBg: 'bg-[#059669] hover:bg-[#047857]',
      iconRaw: zapIcon,
    };
  }
  // 2. ລົດຈັກທຳມະດາ / ລົດຖີບ (Motorcycle / Bike) — ກຳນົດໂທນສີຟ້າເຂັ້ມ ຫຼື ສີຟ້າຄາມ (Royal Blue / Sky Blue)
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
  // 3. ລົດບັນທຸກຂະໜາດໃຫຍ່ (Truck) — ກຳນົດໂທນສີມ່ວງ (Purple)
  if (typeName.includes('truck') || label.includes('ບັນທຸກ') || t.vehicleType?.icon?.includes('🚚')) {
    return {
      bannerBg: 'bg-[#7C3AED]',
      btnBg: 'bg-[#7C3AED] hover:bg-[#6d28d9]',
      iconRaw: truckIcon,
    };
  }
  // 4. ລົດໃຫຍ່ / ລົດເກັງ / ລົດກະບະ (Car) — ກຳນົດໂທນສີແດງເຂັ້ມ (Deep Red)
  return {
    bannerBg: 'bg-[#B02019]',
    btnBg: 'bg-[#B02019] hover:bg-[#961b15]',
    iconRaw: carIcon,
  };
};

export default function HistoryPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const isAdmin = user?.role === 'ADMIN';

  const [historyTickets, setHistoryTickets] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<any | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [reCheckingId, setReCheckingId] = useState<string | null>(null);
  const [reCheckInParkingType, setReCheckInParkingType] = useState<string>('DAILY');
  const [customStartDate, setCustomStartDate] = useState<string>(() => {
    return new Date().toISOString().split('T')[0];
  });
  const [customEndDate, setCustomEndDate] = useState<string>(() => {
    const d = new Date();
    d.setDate(d.getDate() + 7);
    return d.toISOString().split('T')[0];
  });

  useEffect(() => {
    if (selectedTicket) {
      const pt = (selectedTicket.parkingType || '').toUpperCase();
      const memType = (selectedTicket.membership?.memberType || '').toUpperCase();
      if (pt === 'MONTHLY' || memType === 'MONTHLY') setReCheckInParkingType('MONTHLY');
      else if (pt === 'YEARLY' || memType === 'YEARLY') setReCheckInParkingType('YEARLY');
      else if (selectedTicket.membershipId || pt === 'CUSTOM') setReCheckInParkingType('CUSTOM');
      else setReCheckInParkingType('DAILY');

      // ຕັ້ງຄ່າວັນທີເລີ່ມຕົ້ນ ແລະ ວັນທີສິ້ນສຸດສຳລັບຮູບແບບຝາກກຳນົດເອງ
      const today = new Date().toISOString().split('T')[0];
      setCustomStartDate(
        selectedTicket.customStart
          ? new Date(selectedTicket.customStart).toISOString().split('T')[0]
          : today
      );
      if (selectedTicket.customEnd) {
        setCustomEndDate(new Date(selectedTicket.customEnd).toISOString().split('T')[0]);
      } else {
        const nextWeek = new Date();
        nextWeek.setDate(nextWeek.getDate() + 7);
        setCustomEndDate(nextWeek.toISOString().split('T')[0]);
      }
    }
  }, [selectedTicket]);

  // ສະຖານະການເປີດ-ປິດເມນູ Dropdown ສຳລັບກັ່ນຕອງປະເພດຍານພາຫະນະ
  const [filterOpen, setFilterOpen] = useState(false);
  const filterRef = useRef<HTMLDivElement>(null);
  const [vehicleTypes, setVehicleTypes] = useState<any[]>([]);
  const [selectedVehicleType, setSelectedVehicleType] = useState<string>('ALL');

  // ສະຖານະການເປີດ-ປິດເມນູກັ່ນຕອງຮູບແບບການຝາກ (ຝາກລາຍວັນ, ຝາກລາຍເດືອນ, ຝາກລາຍປີ, ຝາກມີກຳນົດ)
  const [parkingTypeFilterOpen, setParkingTypeFilterOpen] = useState(false);
  const parkingTypeFilterRef = useRef<HTMLDivElement>(null);
  const [selectedParkingType, setSelectedParkingType] = useState<string>('ALL');

  // ສະຖານະການສະແດງ Modal ຢືນຢັນການລຶບ Ticket
  const [deleteConfirmTicket, setDeleteConfirmTicket] = useState<{ id: string; ticketNumber: string } | null>(null);

  // ສະຖານະກ່ອງແຈ້ງເຕືອນຄວາມສຳເລັດເຄິ່ງກາງໜ້າຈໍ (Centered Success Popup)
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const successTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const ITEMS_PER_PAGE = 20;

  // ຈຳນວນປຸ່ມເລກໜ້າສູງສຸດຕາມຂະໜາດໜ້າຈໍ: 4 ປຸ່ມສຳລັບມືຖື (< 640px) ແລະ 9 ປຸ່ມສຳລັບ Desktop
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

  const showCenterSuccess = (msg: string) => {
    if (successTimerRef.current) clearTimeout(successTimerRef.current);
    setSuccessMsg(msg);
    successTimerRef.current = setTimeout(() => {
      setSuccessMsg(null);
      successTimerRef.current = null;
    }, 2500);
  };

  useEffect(() => {
    return () => {
      if (successTimerRef.current) clearTimeout(successTimerRef.current);
    };
  }, []);

  // ຟັງຊັນກວດຈັບການຄລິກພາຍນອກ Dropdown ເພື່ອປິດເມນູກັ່ນຕອງທັງສອງອັດຕະໂນມັດ
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (filterRef.current && !filterRef.current.contains(event.target as Node)) {
        setFilterOpen(false);
      }
      if (parkingTypeFilterRef.current && !parkingTypeFilterRef.current.contains(event.target as Node)) {
        setParkingTypeFilterOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      // ທຳອິດພະຍາຍາມດຶງຂໍ້ມູນຈາກ API ເສັ້ນທາງຫຼັກ /parking/history
      try {
        const { data } = await api.get('/parking/history?limit=100');
        const payload = data.data || data || [];
        const tickets = Array.isArray(payload.tickets)
          ? payload.tickets
          : Array.isArray(payload)
          ? payload
          : payload.data || [];
        setHistoryTickets(tickets);
      } catch {
        // ຖ້າບໍ່ສຳເລັດ ໃຫ້ໃຊ້ Endpoint ສຳຮອງ /parking/recent ແລ້ວກັ່ນຕອງສະເພາະລົດທີ່ອອກແລ້ວ
        const { data } = await api.get('/parking/recent?limit=200');
        const payload = data.data || data || [];
        const tickets = Array.isArray(payload) ? payload : payload.data || [];
        setHistoryTickets(tickets.filter((t: any) => t.status === 'COMPLETED' || t.checkOutAt));
      }
    } catch (e) {
      console.error('Failed to load history tickets', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    api.get('/pricing/vehicle-types')
      .then((r) => {
        const types = r.data.data || r.data || [];
        setVehicleTypes(types);
      })
      .catch(() => {});
  }, []);

  const handlePrint = async (ticketToPrint?: any) => {
    const target = ticketToPrint || selectedTicket;
    if (!target) return;
    toast.success('🖨️ ກຳລັງສົ່ງໄປທີ່ Print Agent...');
    try {
      await fetch('/print', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ticket: target }),
      });
    } catch {
      toast.error('Print Agent ບໍ່ຕອບສະໜອງ');
    }
  };

  const handleReCheckIn = async (ticket: any, parkingTypeOverride?: string) => {
    if (!ticket) return;
    setReCheckingId(ticket.id);
    try {
      const vTypeId = ticket.vehicleTypeId || ticket.vehicleType?.id;
      if (!vTypeId) {
        toast.error('ບໍ່ພົບຂໍ້ມູນປະເພດລົດ', { position: 'top-center' });
        return;
      }

      const pType = parkingTypeOverride || ticket.parkingType || 'DAILY';

      if (pType === 'CUSTOM') {
        if (!customStartDate || !customEndDate) {
          toast.error('ກະລຸນາເລືອກວັນທີ່ເລີ່ມ ແລະ ວັນສິ້ນສຸດ', { position: 'top-center' });
          setReCheckingId(null);
          return;
        }
        if (customEndDate < customStartDate) {
          toast.error('ວັນສິ້ນສຸດຕ້ອງບໍ່ນ້ອຍກວ່າວັນທີ່ເລີ່ມ', { position: 'top-center' });
          setReCheckingId(null);
          return;
        }
      }

      const { data } = await api.post('/parking/check-in', {
        vehicleTypeId: vTypeId,
        plateNumber: ticket.plateNumber || undefined,
        plateLetters: ticket.plateLetters || undefined,
        plateProvince: ticket.plateProvince || undefined,
        parkingType: pType,
        customStart: pType === 'CUSTOM' ? new Date(customStartDate).toISOString() : undefined,
        customEnd: pType === 'CUSTOM' ? new Date(customEndDate).toISOString() : undefined,
        notes: ticket.notes || undefined,
      });

      const newTicket = data.data || data;
      showCenterSuccess(`ລົດເຂົ້າສຳເລັດ! Ticket: ${newTicket.ticketNumber}`);
      toast.success(`ລົດເຂົ້າສຳເລັດ! ປີ້ເລກທີ: ${newTicket.ticketNumber}`, { position: 'top-center' });

      // ສົ່ງຄຳສັ່ງພິມປີ້ໃໝ່ໄປຍັງ Print Agent ອັດຕະໂນມັດ
      try {
        await fetch('/print', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ticket: newTicket }),
        });
      } catch {
        /* ກໍລະນີ Print Agent ບໍ່ຕອບສະໜອງ ໃຫ້ຂ້າມໄປໂດຍບໍ່ຂັດຈັງຫວະການເຮັດວຽກ */
      }

      setSelectedTicket(null);
      loadData();

      // ນຳທາງຜູ້ໃຊ້ໄປຍັງໜ້າ Check-out ເຊິ່ງຍານພາຫະນະດັ່ງກ່າວຈະມີສະຖານະກຳລັງຈອດຢູ່
      navigate('/staff/check-out');
    } catch (err: any) {
      const errMsgs = err.response?.data?.message;
      const errorText = Array.isArray(errMsgs) ? errMsgs.join(', ') : errMsgs;
      toast.error(errorText || 'Check-in ບໍ່ສຳເລັດ', { position: 'top-center' });
    } finally {
      setReCheckingId(null);
    }
  };

  const executeDelete = async (id: string) => {
    try {
      await api.post(`/parking/delete/${id}`);
      showCenterSuccess('ລົບ Ticket ສຳເລັດ!');
      setDeleteConfirmTicket(null);
      if (selectedTicket?.id === id) {
        setSelectedTicket(null);
      }
      loadData();
    } catch (err: any) {
      const errMsgs = err.response?.data?.message;
      const errorText = Array.isArray(errMsgs) ? errMsgs.join(', ') : errMsgs;
      toast.error(errorText || 'ລົບ Ticket ບໍ່ສຳເລັດ', { position: 'top-center' });
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

  // ລາຍການຕົວເລືອກກັ່ນຕອງປະເພດຍານພາຫະນະ (Vehicle Filter Options)
  const fallbackFilterOptions = [
    { id: 'ALL', label: 'ປະເພດລົດ', iconRaw: funnelIcon },
    { id: '1', label: 'ລົດໃຫຍ່', iconRaw: carIcon },
    { id: '2', label: 'ລົດຈັກ', iconRaw: motorbikeIcon },
    { id: '3', label: 'ລົດຈັກໄຟຟ້າ', iconRaw: zapIcon },
    { id: '4', label: 'ລົດບັນທຸກ', iconRaw: truckIcon },
  ];

  const filterOptions = [
    { id: 'ALL', label: 'ທຸກປະເພດ', iconRaw: funnelIcon },
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

  const handleFilterChange = (newType: string) => {
    setSelectedVehicleType(newType);
    setCurrentPage(1);
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

  // ກັ່ນຕອງລາຍການປີ້ — ສະແດງສະເພາະປີ້ທີ່ Check-out ສຳເລັດຮຽບຮ້ອຍແລ້ວ
  const filteredTickets = historyTickets.filter((t: any) => {
    const isCompleted = t.status === 'COMPLETED' || !!t.checkOutAt;
    if (!isCompleted) return false;

    // ກັ່ນຕອງຕາມປະເພດຍານພາຫະນະ (Vehicle Type Filter)
    if (selectedVehicleType && selectedVehicleType !== 'ALL') {
      const vtId = String(t.vehicleTypeId || t.vehicleType?.id || '');
      const vtName = (t.vehicleType?.name || '').toLowerCase();
      const sel = selectedVehicleType.toLowerCase();
      if (vtId !== sel && vtName !== sel) return false;
    }

    // ກັ່ນຕອງຕາມຮູບແບບການຝາກ (ຝາກລາຍວັນ, ຝາກລາຍເດືອນ, ຝາກລາຍປີ, ຝາກມີກຳນົດ)
    if (selectedParkingType && selectedParkingType !== 'ALL') {
      const pType = (t.parkingType || '').toUpperCase();
      const memType = (t.membership?.memberType || '').toUpperCase();
      const notes = (t?.notes || t?.membership?.notes || '');
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

    // ກັ່ນຕອງຕາມຄຳຄົ້ນຫາ (Search Query Filter)
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const ticketMatch = (t.ticketNumber || '').toLowerCase().includes(q);
      const plateMatch = [t.plateProvince, t.plateLetters, t.plateNumber]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
        .includes(q);
      return ticketMatch || plateMatch;
    }

    return true;
  });

  const totalPages = Math.max(1, Math.ceil(filteredTickets.length / ITEMS_PER_PAGE));
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const currentTickets = filteredTickets.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  // ຄຳນວນເລກໜ້າທີ່ຈະສະແດງ (ມືຖື = 4 ປຸ່ມ, Desktop = 9 ປຸ່ມ)
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

  const isSearching = searchQuery.trim().length > 0 || selectedVehicleType !== 'ALL' || selectedParkingType !== 'ALL';

  return (
    <div className="font-sans w-full flex flex-col pb-6">
      {/* ກ່ອງຫຼັກສະແດງໜ້າປະຫວັດການຝາກຍານພາຫະນະ (Main Container Card) */}
      <div
        className="shadow-[0_12px_36px_rgba(0,0,0,0.22),0_4px_14px_rgba(0,0,0,0.12)] rounded-none overflow-visible w-full border-0 flex flex-col"
        style={{ borderRadius: 0 }}
      >
        {/* ແຖບຫົວຂໍ້ດ້ານເທິງ — ໂທນສີເທົາເຂັ້ມ (#5D5D5D) */}
        <div
          className="bg-[#5D5D5D] px-3 py-2.5 md:py-0 min-h-[60px] md:h-16 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-2 md:gap-3 lg:gap-3 rounded-none shrink-0"
          style={{ borderRadius: 0 }}
        >
          {/* ດ້ານຊ້າຍ: ໄອຄອນ ແລະ ຫົວຂໍ້ໜ້າປະຫວັດການຝາກ */}
          <div className="flex items-center gap-2.5 h-10 shrink-0">
            <History size={20} className="w-5 h-5 text-white shrink-0" />
            <h1 className="text-base md:text-[17px] font-bold text-white tracking-normal whitespace-nowrap">
              ປະຫວັດການຝາກ
            </h1>
          </div>

          {/* ດ້ານຂວາ: ຊ່ອງຄົ້ນຫາ ແລະ ຕົວກັ່ນຕອງປະເພດລົດ / ຮູບແບບການຝາກ */}
          <div className="flex flex-col md:flex-row items-stretch md:items-center md:justify-end md:ml-auto gap-1.5 sm:gap-2 md:gap-2.5 lg:gap-3 w-full md:w-auto shrink-0">
            {/* ຊ່ອງປ້ອນຂໍ້ມູນຄົ້ນຫາ Ticket ID ຫຼື ປ້າຍທະບຽນລົດ */}
            <div className="flex items-center bg-white shadow-sm w-full md:w-[280px] lg:w-[315px] xl:w-[325px] rounded-l-none rounded-r-full overflow-hidden pl-3 sm:pl-3.5 h-10 min-h-[40px] shrink-0">
              <div className="flex items-center justify-center text-[#F9A825] shrink-0">
                <Search size={18} className="w-[18px] h-[18px] text-[#F9A825]" />
              </div>
              <input
                type="search"
                name="historySearch"
                autoComplete="off"
                data-lpignore="true"
                placeholder="ຄົ້ນຫາ Ticket ID/ປ້າຍລົດ"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                className="px-2.5 h-full text-base md:text-[17px] font-bold text-gray-800 placeholder:text-base md:placeholder:text-[17px] placeholder:font-bold placeholder:text-gray-500 focus:outline-none flex-1 min-w-0 bg-transparent [&::-webkit-search-cancel-button]:hidden [&::-webkit-search-decoration]:hidden"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery('');
                    setCurrentPage(1);
                  }}
                  className="px-1.5 text-gray-400 hover:text-gray-600 transition-colors cursor-pointer shrink-0"
                >
                  <X size={16} />
                </button>
              )}
              <button
                type="button"
                onClick={() => setCurrentPage(1)}
                className="bg-[#F9A825] hover:bg-[#e69510] text-black font-bold px-3.5 sm:px-4.5 h-full text-base md:text-[17px] transition-colors rounded-r-full ml-auto flex items-center justify-center cursor-pointer shrink-0"
              >
                ຄົ້ນຫາ
              </button>
            </div>

            {/* ເມນູ Dropdown ສຳລັບກັ່ນຕອງ: ແບ່ງ 2 ຖັນໃນມືຖື ແລະ ລຽງແນວນອນໃນ Desktop */}
            <div className="grid grid-cols-2 md:flex items-center gap-1.5 sm:gap-2 md:gap-2.5 lg:gap-3 w-full md:w-auto shrink-0">
              {/* ເມນູເລືອກກັ່ນຕອງຕາມປະເພດຍານພາຫະນະ (Vehicle Type Filter) */}
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

                {/* ລາຍການຕົວເລືອກປະເພດລົດໃນ Dropdown (Custom Dropdown Menu) */}
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

              {/* ເມນູເລືອກກັ່ນຕອງຕາມຮູບແບບການຝາກ (Parking Type Filter) */}
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

                {/* ລາຍການຕົວເລືອກຮູບແບບການຝາກໃນ Dropdown (Custom Dropdown Menu) */}
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
            </div>
          </div>
        </div>

        {/* ເສັ້ນຂັ້ນສີແດງດ້ານເທິງ (#B02019) */}
        <div className="h-[2.5px] bg-[#B02019] w-full shrink-0" />

        {/* ສ່ວນເນື້ອໃນຫຼັກ — ພື້ນຫຼັງສີເຫຼືອງສົ້ມ (#F9A825) */}
        <div className="bg-[#F9A825] p-3 flex flex-col justify-start">
          {loading ? (
            <div className="bg-white/95 p-12 text-center max-w-lg mx-auto shadow-md my-auto flex flex-col items-center">
              <RefreshCw size={36} className="animate-spin text-[#F9A825] mb-3" />
              <p className="text-gray-800 font-bold text-base md:text-[17px]">ກຳລັງໂຫຼດປະຫວັດການຝາກ...</p>
            </div>
          ) : currentTickets.length > 0 ? (
            /* ຕາໜ່າງກາດສະແດງລາຍການປີ້ປະຫວັດການຝາກ (Cards Grid) */
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-3.5 lg:gap-4 animate-fade-in">
              {currentTickets.map((t: any) => {
                const theme = getVehicleTheme(t);
                return (
                  <div
                    key={t.id}
                    onClick={() => setSelectedTicket(t)}
                    className="bg-white shadow-[0_4px_12px_rgba(0,0,0,0.12)] hover:shadow-[0_8px_20px_rgba(0,0,0,0.18)] transition-all flex flex-col rounded-none overflow-hidden cursor-pointer"
                  >
                    {/* ສ່ວນຫົວຂອງກາດ: ສີພື້ນຫຼັງຕາມປະເພດລົດ ພ້ອມໄອຄອນ ແລະ ປຸ່ມລຶບ (ສຳລັບ Admin) */}
                    <div className={`${theme.bannerBg} py-2 sm:py-2.5 flex justify-center items-center shadow-inner transition-colors relative`}>
                      <SvgIcon raw={theme.iconRaw} className="w-9 h-9 sm:w-10 sm:h-10 text-white" />
                      {isAdmin && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setDeleteConfirmTicket({ id: t.id, ticketNumber: t.ticketNumber });
                          }}
                          className="absolute top-1/2 -translate-y-1/2 right-2.5 w-7 h-7 bg-white hover:bg-red-50 text-red-600 hover:text-red-700 rounded-full flex items-center justify-center transition-all cursor-pointer shadow-md active:scale-95"
                          title="ລົບ Ticket"
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>

                    {/* ສ່ວນເນື້ອໃນລາຍລະອຽດຂອງກາດ: ຂໍ້ມູນປີ້, ປ້າຍລົດ, ເວລາເຂົ້າ-ອອກ ແລະ ສະຖານະ */}
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

                        <span className="text-right">ວັນທີອອກ</span>
                        <span>:</span>
                        <span className="whitespace-nowrap">{formatDate(t.checkOutAt)}</span>

                        <span className="text-right">ເວລາອອກ</span>
                        <span>:</span>
                        <span className="whitespace-nowrap">{formatTime(t.checkOutAt)}</span>

                        <span className="text-right">Ticket ID</span>
                        <span>:</span>
                        <span className="truncate">{t.ticketNumber}</span>

                        <span className="text-right">ສະຖານະ</span>
                        <span>:</span>
                        <span className="text-gray-600">
                          ອອກແລ້ວ
                        </span>

                        <span className="text-right">ສະຖານະຈ່າຍ</span>
                        <span>:</span>
                        <span className="text-emerald-600">
                          {t.paymentStatus === 'PAID' ? 'ຈ່າຍແລ້ວ' : 'ຈ່າຍແລ້ວ'}
                        </span>
                      </div>

                      {/* ປຸ່ມດຳເນີນການ: ເອົາລົດເຂົ້າໃໝ່ (Re-Check In) */}
                      <div className="mt-2 sm:mt-2.5 w-full">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleReCheckIn(t);
                          }}
                          disabled={reCheckingId === t.id}
                          className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold h-9.5 sm:h-10 px-4 w-full shadow-md rounded-full transition-all active:scale-95 text-[14px] sm:text-[15px] cursor-pointer flex items-center justify-center gap-1.5 disabled:opacity-50"
                        >
                          <LogIn size={16} />
                          <span className="whitespace-nowrap">
                            {reCheckingId === t.id ? 'ກຳລັງເຂົ້າ...' : 'ລົດເຂົ້າ(Check in)'}
                          </span>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            /* ສະແດງຂໍ້ຄວາມເມື່ອບໍ່ພົບຂໍ້ມູນປະຫວັດການຝາກ (Empty State) */
            <div className="py-12 sm:py-16 text-center flex flex-col items-center justify-center select-none">
              <h3 className="text-base sm:text-[18px] font-bold text-black mb-1">
                {isSearching ? 'ບໍ່ພົບປະຫວັດລົດທີ່ຄົ້ນຫາ' : 'ບໍ່ມີປະຫວັດລົດທີ່ Check out ໃນຂະນະນີ້'}
              </h3>
              <p className="text-sm sm:text-base font-bold text-black">
                {isSearching
                  ? 'ກະລຸນາກວດສອບ Ticket ID, ປ້າຍລົດ ຫຼື ປະເພດລົດຄືນໃໝ່'
                  : 'ເມື່ອມີການ Check out ລົດອອກ ປະຫວັດຈະຖືກບັນທຶກໄວ້ຢູ່ນີ້'}
              </p>
            </div>
          )}
        </div>

        {/* ເສັ້ນຂັ້ນສີແດງດ້ານລຸ່ມ (#B02019) */}
        <div className="h-[2.5px] bg-[#B02019] w-full shrink-0" />

        {/* ແຖບສະຫຼຸບ ແລະ ປຸ່ມປ່ຽນໜ້າດ້ານລຸ່ມ — ໂທນສີເທົາເຂັ້ມ (#5D5D5D) */}
        <div
          className="bg-[#5D5D5D] px-3 py-3 md:py-0 min-h-[60px] md:h-16 flex flex-col sm:flex-row items-center justify-between gap-3 rounded-none shrink-0"
          style={{ borderRadius: 0 }}
        >
          {/* ສ່ວນສະແດງຈຳນວນລາຍການທັງໝົດທີ່ກັ່ນຕອງໄດ້ (Total Count Badge) */}
          <div className="flex items-center gap-2 text-white font-bold text-base md:text-[17px]">
            <span>ຈຳນວນ</span>
            <span
              className="bg-[#B02019] text-white h-10 w-10 flex items-center justify-center text-base md:text-[17px] font-bold shadow-sm rounded-none border-0 shrink-0 text-center"
              style={{ borderRadius: 0 }}
            >
              {filteredTickets.length}
            </span>
            <span>ລາຍການ</span>
          </div>

          {/* ສ່ວນປຸ່ມຄວບຄຸມການປ່ຽນໜ້າ (Pagination Controls) */}
          <div className="flex items-center gap-1.5 sm:gap-2 max-w-full overflow-x-auto no-scrollbar py-1">
            <button
              type="button"
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage <= 1 || loading}
              className="bg-[#B02019] hover:bg-[#961b15] text-white font-bold h-10 px-4 sm:w-24 flex items-center justify-center text-base md:text-[17px] transition-colors shadow-sm rounded-none border-0 outline-none disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer shrink-0"
              style={{ borderRadius: 0 }}
            >
              ຖອຍກັບ
            </button>

            {/* ປຸ່ມໝາຍເລກໜ້າຕ່າງໆ (Page Number Buttons) */}
            {visiblePages.map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => setCurrentPage(p)}
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
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage >= totalPages || loading || totalPages === 0}
              className="bg-[#B02019] hover:bg-[#961b15] text-white font-bold h-10 px-4 sm:w-24 flex items-center justify-center text-base md:text-[17px] transition-colors shadow-sm rounded-none border-0 outline-none disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer shrink-0"
              style={{ borderRadius: 0 }}
            >
              ໄປໜ້າ
            </button>
          </div>
        </div>
      </div>

      {/* ໜ້າຕ່າງ Modal ສະແດງລາຍລະອຽດປີ້ແບບເຕັມ (Ticket Details Modal) */}
      {selectedTicket && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div
            className="bg-white w-full max-w-md shadow-2xl rounded-none overflow-hidden animate-scale-in border-0 flex flex-col max-h-[92vh]"
            style={{ borderRadius: 0 }}
          >
            {/* ສ່ວນຫົວຂອງ Modal: ຫົວຂໍ້ ແລະ ປຸ່ມປິດ */}
            <div className="bg-[#5D5D5D] px-4 sm:px-5 h-11 sm:h-12 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <SvgIcon raw={carIcon} className="w-5 h-5 text-white" />
                <h3 className="text-[16px] font-bold text-white tracking-normal">
                  ລາຍລະອຽດປີ້ #{selectedTicket.ticketNumber}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedTicket(null)}
                className="w-7 h-7 rounded-full bg-white flex items-center justify-center text-[#5D5D5D] hover:bg-gray-100 shadow transition-transform active:scale-95 cursor-pointer"
                title="ປິດ"
              >
                <X size={16} />
              </button>
            </div>

            {/* ເສັ້ນຂັ້ນສີແດງ (#B02019) */}
            <div className="h-[2px] bg-[#B02019] w-full shrink-0" />

            {/* ສ່ວນເນື້ອໃນລາຍລະອຽດພາຍໃນ Modal */}
            <div className="px-4 sm:px-5 py-2.5 sm:py-3 space-y-2 bg-white overflow-y-auto">
              <div className="grid grid-cols-[auto_auto_1fr] gap-x-2.5 gap-y-0.5 sm:gap-y-1 text-[14px] font-bold text-black mx-auto w-fit leading-tight sm:leading-snug">
                <span className="text-right">Ticket ID</span>
                <span>:</span>
                <span className="text-red-600 font-bold">{selectedTicket.ticketNumber}</span>

                <span className="text-right">ຮູບແບບ</span>
                <span>:</span>
                <span className="text-amber-700 font-bold">{getParkingTypeLabel(selectedTicket)}</span>

                {selectedTicket.customEnd && (
                  <>
                    <span className="text-right">ກຳນົດຮອດ</span>
                    <span>:</span>
                    <span className="text-amber-700 font-bold">{formatDate(selectedTicket.customEnd)}</span>
                  </>
                )}

                <span className="text-right">ປະເພດ</span>
                <span>:</span>
                <span>{selectedTicket.vehicleType?.label || selectedTicket.vehicleType?.name || '-'}</span>

                <span className="text-right">ທະບຽນລົດ</span>
                <span>:</span>
                <span>
                  {selectedTicket.plateNumber
                    ? `${selectedTicket.plateProvince || ''} ${selectedTicket.plateLetters || ''} ${selectedTicket.plateNumber}`.trim()
                    : 'ບໍ່ມີປ້າຍ'}
                </span>

                <span className="text-right">ວັນທີເຂົ້າ</span>
                <span>:</span>
                <span className="whitespace-nowrap">{formatDate(selectedTicket.checkInAt)}</span>

                <span className="text-right">ເວລາເຂົ້າ</span>
                <span>:</span>
                <span className="whitespace-nowrap">{formatTime(selectedTicket.checkInAt)}</span>

                <span className="text-right">ວັນທີອອກ</span>
                <span>:</span>
                <span className="whitespace-nowrap">{formatDate(selectedTicket.checkOutAt)}</span>

                <span className="text-right">ເວລາອອກ</span>
                <span>:</span>
                <span className="whitespace-nowrap">{formatTime(selectedTicket.checkOutAt)}</span>

                <span className="text-right">ສະຖານະ</span>
                <span>:</span>
                <span className="text-gray-600">
                  ອອກແລ້ວ
                </span>

                <span className="text-right">ສະຖານະການຈ່າຍ</span>
                <span>:</span>
                <span className="text-emerald-600">
                  ຈ່າຍແລ້ວ
                </span>

                {selectedTicket.checkedInBy?.displayName && (
                  <>
                    <span className="text-right">Staff ເຂົ້າ</span>
                    <span>:</span>
                    <span>{selectedTicket.checkedInBy.displayName}</span>
                  </>
                )}

                {selectedTicket.checkedOutBy?.displayName && (
                  <>
                    <span className="text-right">Staff ອອກ</span>
                    <span>:</span>
                    <span>{selectedTicket.checkedOutBy.displayName}</span>
                  </>
                )}
              </div>

              {/* ສ່ວນເລືອກຮູບແບບການຝາກໃໝ່ສຳລັບການ Check-in ຄືນ */}
              <div className="mt-2 pt-2 border-t border-dashed border-gray-200">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[14px] font-bold text-gray-800">
                    ເລືອກຮູບແບບການຝາກອີກ:
                  </span>
                  <span className="text-[14px] font-semibold text-gray-500">
                    (ເດີມ: {getParkingTypeLabel(selectedTicket)})
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-1.5">
                  {[
                    { id: 'DAILY', label: 'ຝາກລາຍວັນ', icon: clockIcon },
                    { id: 'MONTHLY', label: 'ຝາກລາຍເດືອນ', icon: calendarIcon },
                    { id: 'YEARLY', label: 'ຝາກລາຍປີ', icon: calendarIcon },
                    { id: 'CUSTOM', label: 'ຝາກມີກຳນົດ', icon: calendarIcon },
                  ].map((opt) => {
                    const isSelected = reCheckInParkingType === opt.id;
                    return (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => setReCheckInParkingType(opt.id)}
                        className={`h-8 sm:h-8.5 px-2 flex items-center justify-center gap-1.5 font-bold text-[14px] transition-all cursor-pointer rounded-none border ${
                          isSelected
                            ? 'bg-[#B02019] text-white border-[#B02019] shadow-sm'
                            : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100 hover:border-gray-300'
                        }`}
                      >
                        <SvgIcon
                          raw={opt.icon}
                          className={`w-3.5 h-3.5 shrink-0 ${isSelected ? 'text-white' : 'text-amber-600'}`}
                        />
                        <span>{opt.label}</span>
                      </button>
                    );
                  })}
                </div>

                {/* ສ່ວນເລືອກຊ່ວງວັນທີເລີ່ມຕົ້ນ ແລະ ສິ້ນສຸດ ເມື່ອເລືອກຮູບແບບຝາກມີກຳນົດ */}
                {reCheckInParkingType === 'CUSTOM' && (
                  <div className="mt-2 p-2.5 bg-amber-50/80 border border-amber-300/80 rounded-none animate-fade-in shadow-inner">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-[13px] sm:text-[14px] font-bold text-black flex items-center gap-1.5">
                        <SvgIcon raw={calendarIcon} className="w-4 h-4 text-[#B02019]" />
                        <span>ກຳນົດວັນທີຝາກເອງ:</span>
                      </span>
                      {customStartDate && customEndDate && customEndDate >= customStartDate && (
                        <span className="text-[12px] font-bold text-amber-800 bg-amber-200/60 px-2 py-0.5 rounded-none">
                          {Math.max(1, Math.ceil((new Date(customEndDate).getTime() - new Date(customStartDate).getTime()) / (1000 * 60 * 60 * 24)))} ວັນ
                        </span>
                      )}
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[12px] font-bold text-gray-700 mb-1">
                          ວັນທີ່ເລີ່ມ
                        </label>
                        <input
                          type="date"
                          value={customStartDate}
                          onChange={(e) => {
                            const val = e.target.value;
                            setCustomStartDate(val);
                            if (customEndDate && customEndDate < val) {
                              setCustomEndDate(val);
                            }
                          }}
                          className="w-full h-9 px-2 bg-white text-[13px] sm:text-[14px] font-bold text-black border border-gray-300 focus:outline-none focus:border-[#B02019] rounded-none shadow-sm cursor-pointer"
                        />
                      </div>
                      <div>
                        <label className="block text-[12px] font-bold text-gray-700 mb-1">
                          ວັນສິ້ນສຸດ
                        </label>
                        <input
                          type="date"
                          value={customEndDate}
                          min={customStartDate}
                          onChange={(e) => setCustomEndDate(e.target.value)}
                          className="w-full h-9 px-2 bg-white text-[13px] sm:text-[14px] font-bold text-black border border-gray-300 focus:outline-none focus:border-[#B02019] rounded-none shadow-sm cursor-pointer"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* ເສັ້ນຂັ້ນສີແດງ (#B02019) */}
            <div className="h-[2px] bg-[#B02019] w-full shrink-0" />

            {/* ສ່ວນລຸ່ມຂອງ Modal: ປຸ່ມຢືນຢັນລົດເຂົ້າໃໝ່ (Check-in) */}
            <div className="bg-[#5D5D5D] px-4 py-2.5 flex items-center justify-center shrink-0">
              <button
                type="button"
                onClick={() => {
                  handleReCheckIn(selectedTicket, reCheckInParkingType);
                }}
                disabled={reCheckingId === selectedTicket?.id}
                className="bg-[#F9A825] hover:bg-[#e0921a] text-black font-bold h-9 px-6 rounded-full shadow-md transition-all active:scale-95 text-[16px] cursor-pointer flex items-center justify-center gap-1.5 disabled:opacity-50 min-w-[180px]"
              >
                <LogIn size={18} className="text-black" />
                <span>{reCheckingId === selectedTicket?.id ? 'ກຳລັງເຂົ້າ...' : 'ລົດເຂົ້າ(Check in)'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ໜ້າຕ່າງ Modal ຢືນຢັນການລຶບ Ticket (Delete Confirmation Modal) */}
      {deleteConfirmTicket && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 animate-fade-in">
          <div
            className="bg-white w-full max-w-sm shadow-2xl rounded-none overflow-hidden animate-scale-in"
            style={{ borderRadius: 0 }}
          >
            <div className="bg-[#5D5D5D] px-5 py-3.5 flex items-center justify-between text-white font-bold text-base md:text-[17px]">
              <span>ຢືນຢັນການລົບ Ticket</span>
              <button
                type="button"
                onClick={() => setDeleteConfirmTicket(null)}
                className="text-white/80 hover:text-white"
              >
                <X size={18} />
              </button>
            </div>
            <div className="h-[2.5px] bg-[#B02019] w-full" />
            <div className="p-6 text-center">
              <p className="text-red-600 font-bold text-base md:text-[17px] mb-2">
                ຢືນຢັນການລົບ Ticket #{deleteConfirmTicket.ticketNumber} ແທ້ບໍ?
              </p>
              <p className="text-gray-500 text-sm">
                ການກະທຳນີ້ບໍ່ສາມາດຍົກເລີກຄືນໄດ້.
              </p>
            </div>
            <div className="h-[2.5px] bg-[#B02019] w-full" />
            <div className="bg-[#5D5D5D] px-5 py-3.5 flex gap-3 justify-center">
              <button
                type="button"
                onClick={() => executeDelete(deleteConfirmTicket.id)}
                className="bg-[#B02019] hover:bg-[#961b15] text-white font-bold h-10 px-6 rounded-full shadow-md transition-all active:scale-95 text-[15px] cursor-pointer"
              >
                ລົບເລີຍ
              </button>
              <button
                type="button"
                onClick={() => setDeleteConfirmTicket(null)}
                className="bg-white hover:bg-gray-100 text-gray-800 font-bold h-10 px-6 rounded-full shadow-md transition-all active:scale-95 text-[15px] cursor-pointer"
              >
                ຍົກເລີກ
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ກ່ອງແຈ້ງເຕືອນຄວາມສຳເລັດເຄິ່ງກາງໜ້າຈໍ (Centered Success Notification Popup) */}
      {successMsg && (
        <div className="fixed inset-0 z-[9999] pointer-events-none flex items-center justify-center p-4">
          <div
            className="animate-scale-in bg-[#1e293b] text-[#f1f5f9] px-5 py-2.5 sm:px-6 sm:py-3 rounded-none shadow-[0_15px_45px_rgba(0,0,0,0.6)] border border-[#334155] flex items-center gap-3 font-bold text-base md:text-[17px] select-none"
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
            <span className="tracking-wide text-base md:text-[17px] font-bold">{successMsg}</span>
          </div>
        </div>
      )}
    </div>
  );
}
