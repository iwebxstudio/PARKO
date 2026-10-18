// PARKO — Admin Members Page
import React, { useState, useEffect, useRef } from 'react';
import {
  Plus, Search, Edit2, Car, X, Save, Trash2, LogOut, RefreshCw
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../api/client';
import { useAuth } from '../../contexts/AuthContext';
import type { Membership, VehicleType } from '../../types';

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

const getVehicleTheme = (nameOrLabel = '', iconStr = '') => {
  const s = nameOrLabel.toLowerCase();
  // 1. EV Motorcycle / Electric (Emerald Green)
  if (s.includes('ev') || s.includes('ໄຟຟ້າ') || iconStr.includes('⚡')) {
    return {
      bannerBg: 'bg-[#059669]',
      btnBg: 'bg-[#059669] hover:bg-[#047857]',
      iconRaw: zapIcon,
    };
  }
  // 2. Motorcycle / Bike / ລົດຈັກ / ລົດຖີບ (Royal Blue / Sky Blue)
  if (
    s.includes('motorcycle') ||
    s.includes('bike') ||
    s.includes('ຈັກ') ||
    s.includes('ຖີບ') ||
    iconStr.includes('🏍️') ||
    iconStr.includes('🚲')
  ) {
    const isBicycle = s.includes('bicycle') || s.includes('ຖີບ') || iconStr.includes('🚲');
    return {
      bannerBg: isBicycle ? 'bg-[#0284C7]' : 'bg-[#1D4ED8]',
      btnBg: isBicycle ? 'bg-[#0284C7] hover:bg-[#0369a1]' : 'bg-[#1D4ED8] hover:bg-[#1e40af]',
      iconRaw: isBicycle ? bikeIcon : motorbikeIcon,
    };
  }
  // 3. Truck / ລົດບັນທຸກ (Purple)
  if (s.includes('truck') || s.includes('ບັນທຸກ') || iconStr.includes('🚚')) {
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

const laosProvinces = [
  'ນະຄອນຫລວງ', 'ຜົ້ງສາລີ', 'ຫຼວງນ້ຳທາ', 'ອຸດົມໄຊ', 'ບໍ່ແກ້ວ',
  'ຫຼວງພຣະບາງ', 'ຫົວພັນ', 'ໄຊຍະບູລີ', 'ຊຽງຂວາງ', 'ວຽງຈັນ',
  'ບໍລິຄຳໄຊ', 'ຄຳມ່ວນ', 'ສະຫວັນນະເຂດ', 'ສາລະວັນ', 'ເຊກອງ',
  'ຈຳປາສັກ', 'ອັດຕະປື', 'ໄຊສົມບູນ'
];

export default function Members() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'ADMIN';

  const [members, setMembers] = useState<Membership[]>([]);
  const [vehicleTypes, setVehicleTypes] = useState<VehicleType[]>([]);
  const [pricingRules, setPricingRules] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [processingMemberId, setProcessingMemberId] = useState<string | null>(null);

  // Custom filter dropdown state
  const [filterOpen, setFilterOpen] = useState(false);
  const filterRef = useRef<HTMLDivElement>(null);
  const [selectedVehicleType, setSelectedVehicleType] = useState<string>('ALL');

  // Parking Type Filter Dropdown state
  const [selectedParkingType, setSelectedParkingType] = useState<string>('ALL');
  const [parkingTypeFilterOpen, setParkingTypeFilterOpen] = useState(false);
  const parkingTypeFilterRef = useRef<HTMLDivElement>(null);

  // Confirmation Modals
  const [deleteConfirmMember, setDeleteConfirmMember] = useState<{ id: string; code: string } | null>(null);
  const [checkoutConfirmMember, setCheckoutConfirmMember] = useState<Membership | null>(null);

  // Centered Success Popup State
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const successTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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

  // Close vehicle and parking type dropdowns on outside click
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

  // Modal form state
  const [selectedMemberView, setSelectedMemberView] = useState<Membership | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Membership | null>(null);
  const [form, setForm] = useState({
    vehicleTypeId: 0,
    plateLetters: '',
    plateNumber: '',
    plateProvince: '',
    memberType: 'MONTHLY',
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date(new Date().setMonth(new Date().getMonth() + 1)).toISOString().split('T')[0],
    paidAmount: 0,
    paymentMethod: 'CASH',
    notes: ''
  });

  const loadData = async () => {
    setLoading(true);
    try {
      const [mRes, vRes, pRes] = await Promise.all([
        api.get('/membership'),
        api.get('/pricing/vehicle-types'),
        api.get('/pricing')
      ]);
      setMembers(mRes.data.data || mRes.data || []);
      setVehicleTypes(vRes.data.data || vRes.data || []);
      setPricingRules(pRes.data.data || pRes.data || []);
    } catch {
      toast.error('Failed to load data', { position: 'top-center' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (editing) return;
    if (form.vehicleTypeId === 0) return;
    const rule = pricingRules.find(r => r.vehicleTypeId === form.vehicleTypeId);
    if (rule) {
      if (form.memberType === 'DAILY') {
        setForm(f => ({ ...f, paidAmount: Number(rule.dailyRate) }));
      } else if (form.memberType === 'WEEKLY') {
        setForm(f => ({ ...f, paidAmount: Number(rule.weeklyRate) }));
      } else if (form.memberType === 'MONTHLY') {
        setForm(f => ({ ...f, paidAmount: Number(rule.monthlyRate) }));
      } else if (form.memberType === 'YEARLY') {
        setForm(f => ({ ...f, paidAmount: Number(rule.yearlyRate || 0) }));
      } else if (form.memberType === 'CUSTOM') {
        const start = new Date(form.startDate);
        const end = new Date(form.endDate);
        const diffTime = end.getTime() - start.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        const days = diffDays > 0 ? diffDays : 1;
        setForm(f => ({ ...f, paidAmount: days * Number(rule.dailyRate) }));
      }
    }
  }, [form.vehicleTypeId, form.memberType, form.startDate, form.endDate, pricingRules, editing]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.vehicleTypeId === 0) return toast.error('ກະລຸນາເລືອກປະເພດລົດ', { position: 'top-center' });

    try {
      if (editing) {
        const finalPlate = (form.plateLetters.trim() + ' ' + form.plateNumber.trim()).trim();
        await api.patch(`/membership/${editing.id}`, {
          plateNumber: finalPlate,
          plateProvince: form.plateProvince || undefined,
          vehicleTypeId: form.vehicleTypeId,
          endDate: form.endDate,
          notes: form.notes,
        });
        showCenterSuccess('ແກ້ໄຂສະມາຊິກສຳເລັດ!');
      } else {
        const submitMemberType = (form.memberType === 'DAILY' || form.memberType === 'YEARLY') ? 'CUSTOM' : form.memberType;
        const notesTag = form.memberType === 'DAILY' ? ' (ຝາກລາຍວັນ)' : form.memberType === 'YEARLY' ? ' (ຝາກລາຍປີ)' : '';
        const submitNotes = form.notes ? form.notes + notesTag : notesTag.trim() || undefined;

        await api.post('/membership', {
          vehicleTypeId: form.vehicleTypeId,
          plateNumber: form.plateNumber.trim(),
          plateLetters: form.plateLetters.trim(),
          plateProvince: form.plateProvince.trim() || undefined,
          memberType: submitMemberType,
          startDate: new Date(form.startDate).toISOString(),
          endDate: new Date(form.endDate).toISOString(),
          paidAmount: Number(form.paidAmount),
          paymentMethod: form.paymentMethod,
          notes: submitNotes,
        });
        showCenterSuccess('ເພີ່ມສະມາຊິກ + Check-in ສຳເລັດ!');
      }
      setShowForm(false);
      loadData();
      window.dispatchEvent(new CustomEvent('membership-updated'));
      try {
        const channel = new BroadcastChannel('parko_channel');
        channel.postMessage('membership_updated');
        channel.close();
      } catch {}
    } catch (e: any) {
      const msg = e.response?.data?.message;
      toast.error(Array.isArray(msg) ? msg.join(', ') : (msg || 'Failed to save'), { position: 'top-center' });
    }
  };

  const executeMemberCheckOut = async (m: Membership) => {
    const activeTicket = (m as any).tickets?.[0];
    if (!activeTicket) return toast.error('ສະມາຊິກນີ້ບໍ່ມີລົດຢູ່ໃນບ່ອນຈອດ', { position: 'top-center' });

    const end = new Date(m.endDate);
    end.setHours(23, 59, 59, 999);
    const now = new Date();
    const isOverdue = now.getTime() > end.getTime();
    const overdueDays = isOverdue ? Math.max(1, Math.ceil((now.getTime() - end.getTime()) / (1000 * 60 * 60 * 24))) : 0;
    const rule = pricingRules.find(r => r.vehicleTypeId === m.vehicleTypeId) || (m as any).vehicleType?.pricingRules?.[0];
    const dailyRate = Number(rule?.dailyRate || 0);
    const overdueFee = isOverdue ? overdueDays * dailyRate : 0;

    setProcessingMemberId(m.id);
    try {
      await api.post('/parking/check-out', {
        identifier: activeTicket.ticketNumber,
        paymentMethod: 'CASH',
        paymentStatus: 'PAID',
        amountPaid: overdueFee,
      });
      showCenterSuccess('Check-out ສຳເລັດ!');
      setCheckoutConfirmMember(null);
      if (selectedMemberView?.id === m.id) {
        setSelectedMemberView(null);
      }
      loadData();
      window.dispatchEvent(new CustomEvent('membership-updated'));
      try {
        const channel = new BroadcastChannel('parko_channel');
        channel.postMessage('membership_updated');
        channel.close();
      } catch {}
    } catch (e: any) {
      const msg = e.response?.data?.message || 'Check-out Failed';
      toast.error(msg, { position: 'top-center' });
    } finally {
      setProcessingMemberId(null);
    }
  };

  const executeDelete = async (id: string) => {
    try {
      await api.delete(`/membership/${id}`);
      showCenterSuccess('ລຶບສະມາຊິກສຳເລັດ!');
      setDeleteConfirmMember(null);
      if (selectedMemberView?.id === id) {
        setSelectedMemberView(null);
      }
      loadData();
      window.dispatchEvent(new CustomEvent('membership-updated'));
      try {
        const channel = new BroadcastChannel('parko_channel');
        channel.postMessage('membership_updated');
        channel.close();
      } catch {}
    } catch {
      toast.error('Failed to delete member', { position: 'top-center' });
    }
  };

  const openAdd = () => {
    setEditing(null);
    setForm({
      vehicleTypeId: vehicleTypes.length > 0 ? vehicleTypes[0].id : 0,
      plateLetters: '',
      plateNumber: '',
      plateProvince: '',
      memberType: 'MONTHLY',
      startDate: new Date().toISOString().split('T')[0],
      endDate: new Date(new Date().setMonth(new Date().getMonth() + 1)).toISOString().split('T')[0],
      paidAmount: 0,
      paymentMethod: 'CASH',
      notes: ''
    });
    setShowForm(true);
  };

  const openEdit = (m: Membership) => {
    setEditing(m);

    // Split plateNumber into letters and numbers
    const parts = m.plateNumber.split(' ');
    let letters = '';
    let num = m.plateNumber;
    if (parts.length > 1) {
      letters = parts[0];
      num = parts.slice(1).join(' ');
    } else {
      const match = m.plateNumber.match(/^([^\d]+)(\d+)$/);
      if (match) {
        letters = match[1];
        num = match[2];
      }
    }

    let detectedType = m.memberType as string;
    if (m.notes?.includes('(ຝາກລາຍວັນ)')) detectedType = 'DAILY';
    else if (m.notes?.includes('(ຝາກລາຍປີ)')) detectedType = 'YEARLY';
    else if (m.memberType === 'CUSTOM') {
      const s = new Date(m.startDate).getTime();
      const e = new Date(m.endDate).getTime();
      const days = Math.round((e - s) / (1000 * 60 * 60 * 24));
      if (days >= 350) detectedType = 'YEARLY';
      else if (days <= 1) detectedType = 'DAILY';
    }

    setForm({
      vehicleTypeId: m.vehicleTypeId,
      plateLetters: letters,
      plateNumber: num,
      plateProvince: m.plateProvince || '',
      memberType: detectedType as any,
      startDate: new Date(m.startDate).toISOString().split('T')[0],
      endDate: new Date(m.endDate).toISOString().split('T')[0],
      paidAmount: m.paidAmount,
      paymentMethod: m.paymentMethod,
      notes: m.notes || ''
    });
    setShowForm(true);
  };

  const calcEndDate = (start: string, type: string) => {
    const end = new Date(start);
    if (type === 'DAILY') end.setDate(end.getDate() + 1);
    else if (type === 'WEEKLY') end.setDate(end.getDate() + 7);
    else if (type === 'MONTHLY') end.setMonth(end.getMonth() + 1);
    else if (type === 'YEARLY') end.setFullYear(end.getFullYear() + 1);
    return end.toISOString().split('T')[0];
  };

  const fmt = (n: number) => new Intl.NumberFormat('lo-LA').format(n);

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

  // Filter options
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

  const getMemberParkingType = (m: any): 'DAILY' | 'MONTHLY' | 'YEARLY' | 'CUSTOM' => {
    const memType = (m?.memberType || '').toUpperCase();
    const activeTicket = m?.tickets?.[0];
    const ticketPType = (activeTicket?.parkingType || '').toUpperCase();
    const notes = (m?.notes || '').toLowerCase();

    if (memType === 'DAILY' || ticketPType === 'DAILY' || ticketPType === 'HOURLY' || notes.includes('ຝາກລາຍວັນ')) return 'DAILY';
    if (memType === 'MONTHLY' || ticketPType === 'MONTHLY') return 'MONTHLY';
    if (memType === 'YEARLY' || ticketPType === 'YEARLY' || notes.includes('ຝາກລາຍປີ')) return 'YEARLY';

    if (m?.startDate && m?.endDate) {
      const s = new Date(m.startDate).getTime();
      const e = new Date(m.endDate).getTime();
      if (!isNaN(s) && !isNaN(e)) {
        const days = Math.round((e - s) / (1000 * 60 * 60 * 24));
        if (days >= 350) return 'YEARLY';
        if (days >= 25 && days <= 35 && memType !== 'CUSTOM') return 'MONTHLY';
        if (days <= 1 && memType !== 'CUSTOM') return 'DAILY';
      }
    }

    return 'CUSTOM';
  };

  const getMemberTypeLabel = (m: any) => {
    const memType = (m?.memberType || '').toUpperCase();
    const notes = (m?.notes || '');
    if (memType === 'MONTHLY') return 'ຝາກລາຍເດືອນ';
    if (memType === 'YEARLY' || notes.includes('ຝາກລາຍປີ')) return 'ຝາກລາຍປີ';
    if (memType === 'DAILY' || notes.includes('ຝາກລາຍວັນ')) return 'ຝາກລາຍວັນ';
    if (memType === 'WEEKLY') return 'ຝາກລາຍອາທິດ';
    if (memType === 'CUSTOM') {
      if (m?.startDate && m?.endDate) {
        const s = new Date(m.startDate).getTime();
        const e = new Date(m.endDate).getTime();
        if (!isNaN(s) && !isNaN(e)) {
          const days = Math.round((e - s) / (1000 * 60 * 60 * 24));
          if (days >= 350) return 'ຝາກລາຍປີ';
          if (days >= 27 && days <= 32) return 'ຝາກລາຍເດືອນ';
          if (days <= 1) return 'ຝາກລາຍວັນ';
        }
      }
      return 'ຝາກມີກຳນົດ';
    }
    return memType || 'ຝາກມີກຳນົດ';
  };

  // Filtered members list
  const filteredMembers = members.filter((m) => {
    const isParked = (m as any).tickets?.length > 0;
    if (!isParked) return false;

    // 1. Vehicle Type Filter
    if (selectedVehicleType && selectedVehicleType !== 'ALL') {
      const vtId = String(m.vehicleTypeId || m.vehicleType?.id || '');
      const vtName = (m.vehicleType?.name || '').toLowerCase();
      const sel = selectedVehicleType.toLowerCase();
      if (vtId !== sel && vtName !== sel) return false;
    }

    // 2. Parking Type Filter (DAILY, MONTHLY, YEARLY, CUSTOM)
    if (selectedParkingType && selectedParkingType !== 'ALL') {
      const pType = getMemberParkingType(m);
      const memType = (m.memberType || '').toUpperCase();
      const activeTicket = (m as any).tickets?.[0];
      const ticketPType = (activeTicket?.parkingType || '').toUpperCase();

      if (selectedParkingType === 'DAILY') {
        const isDaily = pType === 'DAILY' || memType === 'DAILY' || ticketPType === 'DAILY' || ticketPType === 'HOURLY';
        if (!isDaily) return false;
      } else if (selectedParkingType === 'MONTHLY') {
        const isMonthly = pType === 'MONTHLY' || memType === 'MONTHLY' || ticketPType === 'MONTHLY';
        if (!isMonthly) return false;
      } else if (selectedParkingType === 'YEARLY') {
        const isYearly = pType === 'YEARLY' || memType === 'YEARLY' || ticketPType === 'YEARLY';
        if (!isYearly) return false;
      } else if (selectedParkingType === 'CUSTOM') {
        const isCustom = pType === 'CUSTOM' || memType === 'CUSTOM' || memType === 'WEEKLY' || ticketPType === 'CUSTOM' || ticketPType === 'WEEKLY';
        if (!isCustom) return false;
      }
    }

    // 3. Search Query Filter
    if (query.trim()) {
      const q = query.toLowerCase().trim();
      const codeMatch = (m.memberCode || '').toLowerCase().includes(q);
      const plateMatch = [m.plateProvince, m.plateNumber].filter(Boolean).join(' ').toLowerCase().includes(q);
      return codeMatch || plateMatch;
    }

    return true;
  });

  const totalPages = Math.max(1, Math.ceil(filteredMembers.length / ITEMS_PER_PAGE));
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedMembers = filteredMembers.slice(startIndex, startIndex + ITEMS_PER_PAGE);

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

  const isSearching = query.trim().length > 0 || selectedVehicleType !== 'ALL' || selectedParkingType !== 'ALL';

  return (
    <div className="font-sans w-full flex flex-col pb-6">
      {/* Main Container Card */}
      <div
        className="shadow-[0_12px_36px_rgba(0,0,0,0.22),0_4px_14px_rgba(0,0,0,0.12)] rounded-none overflow-visible w-full border-0 flex flex-col"
        style={{ borderRadius: 0 }}
      >
        {/* Top Header Bar — Dark Gray (matching CheckOut.tsx) */}
        {/* Top Header Bar — Dark Gray (matching CheckOut.tsx) */}
        <div
          className="bg-[#5D5D5D] px-3 py-2.5 md:py-0 min-h-[60px] md:h-16 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-2 md:gap-3 lg:gap-3 rounded-none shrink-0"
          style={{ borderRadius: 0 }}
        >
          {/* Left: Icon + Title */}
          <div className="flex items-center gap-2.5 h-10 shrink-0">
            <Car size={20} className="w-5 h-5 text-white shrink-0" />
            <h1 className="text-base md:text-[17px] font-bold text-white tracking-normal whitespace-nowrap">
              ຝາກມີກຳນົດ
            </h1>
          </div>

          {/* Right: Search Box + Vehicle Filter + Add Member Button */}
          <div className="flex flex-col md:flex-row items-stretch md:items-center md:justify-end md:ml-auto gap-1.5 sm:gap-2 md:gap-2.5 lg:gap-3 w-full md:w-auto shrink-0">
            {/* Search Input Box */}
            <div className="flex items-center bg-white shadow-sm w-full md:w-[280px] lg:w-[315px] xl:w-[325px] rounded-l-none rounded-r-full overflow-hidden pl-3 sm:pl-3.5 h-10 min-h-[40px] shrink-0">
              <div className="flex items-center justify-center text-[#F9A825] shrink-0">
                <Search size={18} className="w-[18px] h-[18px] text-[#F9A825]" />
              </div>
              <input
                type="search"
                name="memberSearch"
                autoComplete="off"
                data-lpignore="true"
                placeholder="ຄົ້ນຫາ Ticket ID/ປ້າຍລົດ"
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setCurrentPage(1);
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    if (!query.trim()) {
                      toast.error('ກະລຸນາໃສ່ Ticket ID ຫຼື ປ້າຍລົດ');
                      return;
                    }
                    setCurrentPage(1);
                  }
                }}
                className="px-2.5 h-full text-base md:text-[17px] font-bold text-gray-800 placeholder:text-base md:placeholder:text-[17px] placeholder:font-bold placeholder:text-gray-500 focus:outline-none flex-1 min-w-0 bg-transparent [&::-webkit-search-cancel-button]:hidden [&::-webkit-search-decoration]:hidden"
              />
              {query && (
                <button
                  type="button"
                  onClick={() => {
                    setQuery('');
                    setCurrentPage(1);
                  }}
                  className="px-1.5 text-gray-400 hover:text-gray-600 transition-colors cursor-pointer shrink-0"
                >
                  <X size={16} />
                </button>
              )}
              <button
                type="button"
                onClick={() => {
                  if (!query.trim()) {
                    toast.error('ກະລຸນາໃສ່ Ticket ID ຫຼື ປ້າຍລົດ');
                    return;
                  }
                  setCurrentPage(1);
                }}
                className="bg-[#F9A825] hover:bg-[#e69510] text-black font-bold px-3.5 sm:px-4.5 h-full text-base md:text-[17px] transition-colors rounded-r-full ml-auto flex items-center justify-center cursor-pointer shrink-0"
              >
                ຄົ້ນຫາ
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
            </div>

            {/* Add Member Button (for Admin) */}
            {isAdmin && (
              <button
                type="button"
                onClick={openAdd}
                className="w-full md:w-auto bg-white hover:bg-gray-100 text-[#232323] px-3.5 sm:px-5 h-10 rounded-full font-bold shadow-md transition-all text-base md:text-[17px] shrink-0 flex items-center justify-center gap-1.5 sm:gap-2 active:scale-95 cursor-pointer whitespace-nowrap"
              >
                <Plus size={20} className="w-5 h-5 text-[#232323] shrink-0" />
                <span className="whitespace-nowrap">ເພີ່ມສະມາຊິກ</span>
              </button>
            )}
          </div>
        </div>

        {/* Top Red Stripe Divider */}
        <div className="h-[2.5px] bg-[#B02019] w-full shrink-0" />

        {/* Main Body — Orange Background (Equal 12px padding top/bottom/left/right) */}
        <div className="bg-[#F9A825] p-3 flex flex-col justify-start">
          {loading ? (
            <div className="py-12 sm:py-16 text-center flex flex-col items-center justify-center select-none">
              <RefreshCw size={32} className="animate-spin text-black mb-2" />
              <p className="text-black font-bold text-base md:text-[17px]">ກຳລັງໂຫຼດຂໍ້ມູນສະມາຊິກ...</p>
            </div>
          ) : paginatedMembers.length > 0 ? (
            /* Cards Grid */
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-3.5 lg:gap-4 animate-fade-in">
              {paginatedMembers.map((m) => {
                const parts = m.plateNumber.split(' ');
                let letters = '-';
                let num = m.plateNumber;
                if (parts.length > 1) {
                  letters = parts[0];
                  num = parts.slice(1).join(' ');
                } else {
                  const match = m.plateNumber.match(/^([^\d]+)(\d+)$/);
                  if (match) {
                    letters = match[1];
                    num = match[2];
                  }
                }

                const theme = getVehicleTheme(
                  (m.vehicleType?.name || '') + ' ' + (m.vehicleType?.label || ''),
                  m.vehicleType?.icon || ''
                );
                const isParked = (m as any).tickets?.length > 0;

                return (
                  <div
                    key={m.id}
                    onClick={() => setSelectedMemberView(m)}
                    className="bg-white shadow-[0_4px_12px_rgba(0,0,0,0.12)] hover:shadow-[0_8px_20px_rgba(0,0,0,0.18)] transition-all flex flex-col rounded-none overflow-hidden cursor-pointer"
                  >
                    {/* Top Card Header: Distinctive vehicle type color + compact vertical spacing */}
                    <div className={`${theme.bannerBg} py-2 sm:py-2.5 flex justify-center items-center shadow-inner transition-colors relative`}>
                      <SvgIcon raw={theme.iconRaw} className="w-9 h-9 sm:w-10 sm:h-10 text-white" />
                    </div>

                    {/* Bottom Card Body: Compact, space-saving info */}
                    <div className="px-3 py-2 sm:px-3.5 sm:py-2.5 flex flex-col justify-between flex-1 bg-white">
                      <div className="grid grid-cols-[auto_auto_1fr] gap-x-2 gap-y-0.5 text-[15px] sm:text-[15.5px] font-bold text-black mx-auto w-fit leading-tight my-0.5">
                        <span className="text-right">ລະຫັດ</span>
                        <span>:</span>
                        <span className="truncate">{m.memberCode}</span>

                        <span className="text-right">ປະເພດ</span>
                        <span>:</span>
                        <span className="truncate">{m.vehicleType?.label || '-'}</span>

                        <span className="text-right">ເລກ</span>
                        <span>:</span>
                        <span className="truncate">{num}</span>

                        <span className="text-right">ໂຕອັກສອນ</span>
                        <span>:</span>
                        <span className="truncate">{letters}</span>

                        <span className="text-right">ອອກແຂວງ</span>
                        <span>:</span>
                        <span className="truncate">{m.plateProvince || '-'}</span>

                        <span className="text-right">ວັນທີເລີ່ມ</span>
                        <span>:</span>
                        <span>{formatDate(m.startDate)}</span>

                        <span className="text-right">ວັນໝົດອາຍຸ</span>
                        <span>:</span>
                        <span>{formatDate(m.endDate)}</span>

                        <span className="text-right">ຮູບແບບ</span>
                        <span>:</span>
                        <span className="text-amber-800 font-bold">{getMemberTypeLabel(m)}</span>

                        <span className="text-right">ສະຖານະ</span>
                        <span>:</span>
                        <span className={isParked ? 'text-emerald-600' : 'text-gray-600'}>
                          {isParked ? 'ລົດເຂົ້າ' : 'ລົດອອກ'}
                        </span>

                        <span className="text-right">ຈຳນວນເງິນ</span>
                        <span>:</span>
                        <span className="whitespace-nowrap">{fmt(m.paidAmount)} ₭</span>
                      </div>

                      {/* Action Button: ລົດອອກ(Check out) */}
                      <div className="mt-2 sm:mt-2.5 flex items-center justify-center w-full">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setCheckoutConfirmMember(m);
                          }}
                          disabled={!isParked || processingMemberId === m.id}
                          className={`${theme.btnBg} text-white font-bold h-9.5 sm:h-10 px-4 w-full shadow-md rounded-full transition-all active:scale-95 text-[14px] sm:text-[15px] disabled:opacity-50 disabled:grayscale cursor-pointer flex items-center justify-center gap-1.5`}
                        >
                          <LogOut size={16} className="rotate-180 shrink-0" />
                          <span className="whitespace-nowrap">
                            {processingMemberId === m.id ? 'ກຳລັງອອກ...' : 'ລົດອອກ(Check out)'}
                          </span>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            /* Empty State Matching Notifications.tsx */
            <div className="py-12 sm:py-16 text-center flex flex-col items-center justify-center select-none">
              <h3 className="text-base sm:text-[18px] font-bold text-black mb-1">
                {isSearching ? 'ບໍ່ພົບຂໍ້ມູນສະມາຊິກທີ່ຄົ້ນຫາ' : 'ບໍ່ມີຂໍ້ມູນສະມາຊິກໃນຂະນະນີ້'}
              </h3>
              <p className="text-sm sm:text-base font-bold text-black">
                {isSearching
                  ? 'ກະລຸນາກວດສອບ Ticket ID, ປ້າຍລົດ, ປະເພດລົດ ຫຼື ປະເພດຝາກຄືນໃໝ່'
                  : 'ບໍ່ພົບລາຍຊື່ສະມາຊິກທີ່ກຳລັງຈອດຢູ່ໃນຂະນະນີ້'}
              </p>
            </div>
          )}
        </div>

        {/* Bottom Red Stripe Divider */}
        <div className="h-[2.5px] bg-[#B02019] w-full shrink-0" />

        {/* Bottom Footer Bar — Dark Gray (matching CheckOut.tsx) */}
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
              {filteredMembers.length}
            </span>
            <span>ລາຍການ</span>
          </div>

          {/* Right: Pagination Controls (Equal width buttons, square page buttons) */}
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

            {/* Page number buttons (Squares h-10 w-10) */}
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

      {/* View Member Details Modal */}
      {selectedMemberView && (() => {
        const parts = selectedMemberView.plateNumber.split(' ');
        let viewLetters = '-';
        let viewNum = selectedMemberView.plateNumber;
        if (parts.length > 1) {
          viewLetters = parts[0];
          viewNum = parts.slice(1).join(' ');
        } else {
          const match = selectedMemberView.plateNumber.match(/^([^\d]+)(\d+)$/);
          if (match) {
            viewLetters = match[1];
            viewNum = match[2];
          }
        }
        const memberTheme = getVehicleTheme(
          (selectedMemberView.vehicleType?.name || '') + ' ' + (selectedMemberView.vehicleType?.label || ''),
          selectedMemberView.vehicleType?.icon || ''
        );
        const isParked = (selectedMemberView as any).tickets?.length > 0;

        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
            <div
              className="bg-white w-full max-w-md shadow-2xl rounded-none overflow-hidden animate-scale-in border-0 flex flex-col max-h-[92vh]"
              style={{ borderRadius: 0 }}
            >
              {/* Modal Header */}
              <div className="bg-[#5D5D5D] px-4 sm:px-5 h-11 sm:h-12 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-2">
                  <SvgIcon raw={memberTheme.iconRaw} className="w-5 h-5 text-white" />
                  <h3 className="text-[16px] font-bold text-white tracking-normal">
                    ລາຍລະອຽດສະມາຊິກ #{selectedMemberView.memberCode}
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedMemberView(null)}
                  className="w-7 h-7 rounded-full bg-white flex items-center justify-center text-[#5D5D5D] hover:bg-gray-100 shadow transition-transform active:scale-95 cursor-pointer"
                  title="ປິດ"
                >
                  <X size={16} />
                </button>
              </div>

              {/* Red Stripe Divider */}
              <div className="h-[2px] bg-[#B02019] w-full shrink-0" />

              {/* Modal Body */}
              <div className="px-4 sm:px-5 py-2.5 sm:py-3 space-y-2 bg-white overflow-y-auto">
                <div className="grid grid-cols-[auto_auto_1fr] gap-x-2.5 gap-y-0.5 sm:gap-y-1 text-[14px] font-bold text-black mx-auto w-fit leading-tight sm:leading-snug">
                  <span className="text-right">ລະຫັດສະມາຊິກ</span>
                  <span>:</span>
                  <span className="text-red-600 font-bold">{selectedMemberView.memberCode}</span>

                  <span className="text-right">ປະເພດ</span>
                  <span>:</span>
                  <span>{selectedMemberView.vehicleType?.label || selectedMemberView.vehicleType?.name || '-'}</span>

                  <span className="text-right">ເລກ</span>
                  <span>:</span>
                  <span>{viewNum}</span>

                  <span className="text-right">ໂຕອັກສອນ</span>
                  <span>:</span>
                  <span>{viewLetters}</span>

                  <span className="text-right">ອອກແຂວງ</span>
                  <span>:</span>
                  <span>{selectedMemberView.plateProvince || '-'}</span>

                  <span className="text-right">ວັນທີເລີ່ມ</span>
                  <span>:</span>
                  <span className="whitespace-nowrap">{formatDate(selectedMemberView.startDate)}</span>

                  <span className="text-right">ວັນໝົດອາຍຸ</span>
                  <span>:</span>
                  <span className="whitespace-nowrap">{formatDate(selectedMemberView.endDate)}</span>

                  <span className="text-right">ຮູບແບບ</span>
                  <span>:</span>
                  <span className="text-amber-700 font-bold">{getMemberTypeLabel(selectedMemberView)}</span>

                  <span className="text-right">ສະຖານະລົດ</span>
                  <span>:</span>
                  <span className={isParked ? 'text-emerald-600 font-bold' : 'text-gray-600 font-bold'}>
                    {isParked ? 'ລົດເຂົ້າ' : 'ລົດອອກ'}
                  </span>

                  <span className="text-right">ສະຖານະບັດ</span>
                  <span>:</span>
                  <span className={selectedMemberView.status === 'ACTIVE' ? 'text-emerald-600 font-bold' : selectedMemberView.status === 'EXPIRED' ? 'text-gray-600 font-bold' : 'text-red-600 font-bold'}>
                    {selectedMemberView.status}
                  </span>

                  <span className="text-right">ຈຳນວນເງິນ</span>
                  <span>:</span>
                  <span className="whitespace-nowrap font-bold text-black">{fmt(selectedMemberView.paidAmount)} ₭</span>

                  {selectedMemberView.notes && (
                    <>
                      <span className="text-right">ໝາຍເຫດ</span>
                      <span>:</span>
                      <span>{selectedMemberView.notes}</span>
                    </>
                  )}
                </div>
              </div>

              {/* Red Stripe Divider */}
              <div className="h-[2px] bg-[#B02019] w-full shrink-0" />

              {/* Modal Footer */}
              <div className="bg-[#5D5D5D] px-4 py-2.5 flex items-center justify-center shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    const m = selectedMemberView;
                    setSelectedMemberView(null);
                    openEdit(m);
                  }}
                  className="bg-[#F9A825] hover:bg-[#e0921a] text-black font-bold h-9 px-6 rounded-full shadow-md transition-all active:scale-95 text-[16px] cursor-pointer flex items-center justify-center gap-1.5 min-w-[140px]"
                >
                  <Edit2 size={17} className="text-black" />
                  <span>ແກ້ໄຂ</span>
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Add / Edit Member Modal Form */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-fade-in">
          <div
            className="bg-white w-full max-w-lg shadow-2xl rounded-none overflow-hidden animate-scale-in max-h-[90vh] flex flex-col"
            style={{ borderRadius: 0 }}
          >
            {/* Modal Header */}
            <div className="bg-[#5D5D5D] px-6 h-16 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2.5 text-white font-bold text-base md:text-[18px]">
                <Car size={20} className="w-5 h-5 text-white" />
                <span>{editing ? 'ແກ້ໄຂສະມາຊິກ' : 'ເພີ່ມສະມາຊິກໃໝ່'}</span>
              </div>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="w-8 h-8 rounded-full bg-white flex items-center justify-center text-[#5D5D5D] hover:bg-gray-100 shadow transition-transform active:scale-95 cursor-pointer"
                title="ປິດ"
              >
                <X size={18} />
              </button>
            </div>

            {/* Red Stripe Divider */}
            <div className="h-[2.5px] bg-[#B02019] w-full shrink-0" />

            {/* Modal Form Scrollable Area */}
            <form id="member-form" onSubmit={handleSubmit} className="p-6 overflow-y-auto flex-1 space-y-4">
              {/* 1. Vehicle Type */}
              <div>
                <p className="text-sm font-bold text-gray-800 mb-2 uppercase tracking-wide">1. ເລືອກປະເພດລົດ</p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  {[...vehicleTypes]
                    .sort((a, b) => {
                      const order = ['car', 'motorcycle', 'ev_motorcycle', 'truck'];
                      const idxA = order.indexOf(a.name);
                      const idxB = order.indexOf(b.name);
                      if (idxA !== -1 && idxB !== -1) return idxA - idxB;
                      if (idxA !== -1) return -1;
                      if (idxB !== -1) return 1;
                      return (a.sortOrder || 0) - (b.sortOrder || 0);
                    })
                    .map((vt) => {
                      const isSelected = form.vehicleTypeId === vt.id;
                      const theme = getVehicleTheme(vt.name + ' ' + vt.label);
                      return (
                        <button
                          key={vt.id}
                          type="button"
                          disabled={!!editing}
                          onClick={() => setForm({ ...form, vehicleTypeId: vt.id })}
                          className={`flex flex-col items-center justify-center p-3 transition-all rounded-none border-2 cursor-pointer ${
                            isSelected
                              ? 'border-[#B02019] bg-amber-50 shadow-md scale-102'
                              : 'border-gray-200 bg-white hover:border-gray-300 shadow-sm'
                          } ${editing ? 'opacity-60 cursor-not-allowed' : ''}`}
                          style={{ borderRadius: 0 }}
                        >
                          <SvgIcon
                            raw={theme.iconRaw}
                            className={`w-8 h-8 mb-1.5 ${isSelected ? 'text-[#B02019]' : 'text-gray-700'}`}
                          />
                          <span className={`text-xs font-bold ${isSelected ? 'text-[#B02019]' : 'text-gray-800'}`}>
                            {vt.label}
                          </span>
                        </button>
                      );
                    })}
                </div>
              </div>

              {/* 2. Plate Info */}
              <div>
                <p className="text-sm font-bold text-gray-800 mb-2 uppercase tracking-wide">2. ປ້າຍລົດ</p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  <input
                    required
                    type="tel"
                    value={form.plateNumber}
                    onChange={(e) => setForm({ ...form, plateNumber: e.target.value.replace(/\D/g, '').slice(0, 4) })}
                    placeholder="1234 (ເລກທະບຽນ)"
                    className="w-full bg-white h-11 px-3 text-center text-base font-bold text-black placeholder-gray-400 focus:outline-none shadow-sm border border-gray-300 focus:border-[#B02019] rounded-none"
                    style={{ borderRadius: 0 }}
                  />
                  <input
                    required
                    value={form.plateLetters}
                    onChange={(e) => setForm({ ...form, plateLetters: e.target.value.replace(/\d/g, '').toUpperCase() })}
                    placeholder="ກຂ (ໂຕອັກສອນ)"
                    className="w-full bg-white h-11 px-3 text-center text-base font-bold text-black placeholder-gray-400 focus:outline-none shadow-sm border border-gray-300 focus:border-[#B02019] rounded-none"
                    maxLength={2}
                    style={{ borderRadius: 0 }}
                  />
                  <select
                    value={form.plateProvince}
                    onChange={(e) => setForm({ ...form, plateProvince: e.target.value })}
                    className={`w-full bg-white h-11 px-3 text-center text-base font-bold focus:outline-none shadow-sm border border-gray-300 focus:border-[#B02019] appearance-none rounded-none cursor-pointer ${
                      !form.plateProvince ? 'text-gray-400' : 'text-black'
                    }`}
                    style={{ borderRadius: 0 }}
                  >
                    <option value="" className="text-gray-400">ປ້າຍອອກແຂວງ</option>
                    {laosProvinces.map((p) => (
                      <option key={p} value={p} className="text-black bg-white">
                        {p}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* 3. Membership Type */}
              <div>
                <label className="block text-sm font-bold text-gray-800 mb-1">ປະເພດສະມາຊິກ *</label>
                <select
                  value={form.memberType}
                  onChange={(e) => {
                    const t = e.target.value;
                    const end = calcEndDate(form.startDate, t);
                    setForm({ ...form, memberType: t, endDate: end });
                  }}
                  className="w-full h-11 px-3 bg-white border border-gray-300 rounded-none focus:outline-none focus:border-[#B02019] font-bold text-base cursor-pointer"
                  style={{ borderRadius: 0 }}
                  disabled={!!editing}
                >
                  <option value="DAILY">ລາຍວັນ (Daily)</option>
                  <option value="WEEKLY">ລາຍອາທິດ (Weekly)</option>
                  <option value="MONTHLY">ລາຍເດືອນ (Monthly)</option>
                  <option value="YEARLY">ລາຍປີ (Yearly)</option>
                  <option value="CUSTOM">ກຳນົດເອງ (Custom)</option>
                </select>
              </div>

              {/* 4. Dates */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-bold text-gray-800 mb-1">ວັນທີເລີ່ມ *</label>
                  <input
                    type="date"
                    required
                    value={form.startDate}
                    onChange={(e) => {
                      const start = e.target.value;
                      const end = calcEndDate(start, form.memberType);
                      setForm({ ...form, startDate: start, endDate: end });
                    }}
                    className="w-full h-11 px-3 bg-white border border-gray-300 rounded-none focus:outline-none focus:border-[#B02019] font-bold text-base"
                    style={{ borderRadius: 0 }}
                    disabled={!!editing}
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-800 mb-1">ວັນໝົດອາຍຸ *</label>
                  <input
                    type="date"
                    required
                    value={form.endDate}
                    onChange={(e) => setForm({ ...form, endDate: e.target.value })}
                    className="w-full h-11 px-3 bg-white border border-gray-300 rounded-none focus:outline-none focus:border-[#B02019] font-bold text-base"
                    style={{ borderRadius: 0 }}
                  />
                </div>
              </div>

              {/* 5. Paid Amount */}
              {!editing && (
                <div>
                  <label className="block text-sm font-bold text-gray-800 mb-1">ຈຳນວນເງິນທີ່ຈ່າຍ (₭) *</label>
                  <input
                    type="number"
                    required
                    value={form.paidAmount}
                    onChange={(e) => setForm({ ...form, paidAmount: Number(e.target.value) })}
                    className="w-full h-11 px-3 bg-white border border-gray-300 rounded-none focus:outline-none focus:border-[#B02019] font-bold text-emerald-600 text-lg"
                    min="0"
                    style={{ borderRadius: 0 }}
                  />
                </div>
              )}

              {/* 6. Notes */}
              <div>
                <label className="block text-sm font-bold text-gray-800 mb-1">ໝາຍເຫດ</label>
                <textarea
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  className="w-full p-3 bg-white border border-gray-300 rounded-none focus:outline-none focus:border-[#B02019] font-medium resize-none text-base"
                  rows={2}
                  style={{ borderRadius: 0 }}
                />
              </div>
            </form>

            {/* Red Stripe Divider */}
            <div className="h-[2.5px] bg-[#B02019] w-full shrink-0" />

            {/* Modal Footer */}
            <div className="bg-[#5D5D5D] px-6 py-3.5 flex items-center justify-end gap-3 shrink-0">
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="bg-white hover:bg-gray-100 text-gray-800 font-bold h-10 px-5 rounded-full shadow-md transition-all active:scale-95 text-[15px] cursor-pointer"
              >
                ຍົກເລີກ
              </button>
              <button
                type="submit"
                form="member-form"
                className="bg-[#B02019] hover:bg-[#961b15] text-white font-bold h-10 px-6 rounded-full shadow-md transition-all active:scale-95 text-[15px] cursor-pointer flex items-center gap-1.5"
              >
                <Save size={16} />
                <span>ບັນທຶກ</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Checkout Confirmation Modal */}
      {checkoutConfirmMember && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 animate-fade-in">
          <div
            className="bg-white w-full max-w-sm shadow-2xl rounded-none overflow-hidden animate-scale-in"
            style={{ borderRadius: 0 }}
          >
            <div className="bg-[#5D5D5D] px-5 py-3.5 flex items-center justify-between text-white font-bold text-base md:text-[17px]">
              <span>ຢືນຢັນລົດອອກ</span>
              <button
                type="button"
                onClick={() => setCheckoutConfirmMember(null)}
                className="text-white/80 hover:text-white"
              >
                <X size={18} />
              </button>
            </div>
            <div className="h-[2.5px] bg-[#B02019] w-full" />
            <div className="p-5 text-center">
              <p className="text-gray-800 font-bold text-base md:text-[17px] mb-1">
                ຢືນຢັນການລົດອອກສະມາຊິກ #{checkoutConfirmMember.memberCode}?
              </p>
              <p className="text-gray-600 text-[14px] font-bold mb-3">
                ທະບຽນ: {[checkoutConfirmMember.plateProvince, checkoutConfirmMember.plateNumber].filter(Boolean).join(' ')}
              </p>
              {(() => {
                const end = new Date(checkoutConfirmMember.endDate);
                end.setHours(23, 59, 59, 999);
                const now = new Date();
                const isOverdue = now.getTime() > end.getTime();
                const overdueDays = isOverdue ? Math.max(1, Math.ceil((now.getTime() - end.getTime()) / (1000 * 60 * 60 * 24))) : 0;
                const rule = pricingRules.find(r => r.vehicleTypeId === checkoutConfirmMember.vehicleTypeId) || (checkoutConfirmMember as any).vehicleType?.pricingRules?.[0];
                const dailyRate = Number(rule?.dailyRate || 0);
                const overdueFee = isOverdue ? overdueDays * dailyRate : 0;

                if (isOverdue) {
                  return (
                    <div className="bg-red-50 border border-red-300 p-3 my-2 text-center rounded-none">
                      <p className="text-red-700 font-bold text-[14px] mb-1">
                        🚨 ສະມາຊິກນີ້ກາຍກຳນົດ {overdueDays} ມື້!
                      </p>
                      <p className="text-black font-bold text-[13px]">
                        ລາຄາທີ່ຕ້ອງຈ່າຍກາຍກຳນົດ:
                      </p>
                      <p className="text-[20px] font-black text-[#B02019]">
                        {new Intl.NumberFormat('lo-LA').format(overdueFee)} ₭
                      </p>
                      <p className="text-gray-600 font-bold text-[12px]">
                        ({overdueDays} ມື້ × {new Intl.NumberFormat('lo-LA').format(dailyRate)} ₭/ມື້)
                      </p>
                    </div>
                  );
                }
                return (
                  <div className="bg-emerald-50 border border-emerald-200 p-2.5 my-2 text-center rounded-none">
                    <p className="text-emerald-700 font-bold text-[14px]">
                      ✓ ລົດຍັງຢູ່ໃນກຳນົດ (ບໍ່ມີຄ່າບໍລິການເພີ່ມເຕີມ: 0 ₭)
                    </p>
                  </div>
                );
              })()}
            </div>
            <div className="h-[2.5px] bg-[#B02019] w-full" />
            <div className="bg-[#5D5D5D] px-5 py-3.5 flex gap-3 justify-center">
              <button
                type="button"
                onClick={() => executeMemberCheckOut(checkoutConfirmMember)}
                disabled={processingMemberId === checkoutConfirmMember.id}
                className="bg-[#B02019] hover:bg-[#961b15] text-white font-bold h-10 px-6 rounded-full shadow-md transition-all active:scale-95 text-[15px] cursor-pointer"
              >
                {processingMemberId === checkoutConfirmMember.id ? 'ກຳລັງອອກ...' : 'ຢືນຢັນ'}
              </button>
              <button
                type="button"
                onClick={() => setCheckoutConfirmMember(null)}
                className="bg-white hover:bg-gray-100 text-gray-800 font-bold h-10 px-6 rounded-full shadow-md transition-all active:scale-95 text-[15px] cursor-pointer"
              >
                ຍົກເລີກ
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirmMember && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 animate-fade-in">
          <div
            className="bg-white w-full max-w-sm shadow-2xl rounded-none overflow-hidden animate-scale-in"
            style={{ borderRadius: 0 }}
          >
            <div className="bg-[#5D5D5D] px-5 py-3.5 flex items-center justify-between text-white font-bold text-base md:text-[17px]">
              <span>ຢືນຢັນການລຶບສະມາຊິກ</span>
              <button
                type="button"
                onClick={() => setDeleteConfirmMember(null)}
                className="text-white/80 hover:text-white"
              >
                <X size={18} />
              </button>
            </div>
            <div className="h-[2.5px] bg-[#B02019] w-full" />
            <div className="p-6 text-center">
              <p className="text-red-600 font-bold text-base md:text-[17px] mb-2">
                ຢືນຢັນການລຶບສະມາຊິກ #{deleteConfirmMember.code} ຖາວອນ?
              </p>
              <p className="text-gray-500 text-sm">
                ການກະທຳນີ້ບໍ່ສາມາດຍົກເລີກຄືນໄດ້.
              </p>
            </div>
            <div className="h-[2.5px] bg-[#B02019] w-full" />
            <div className="bg-[#5D5D5D] px-5 py-3.5 flex gap-3 justify-center">
              <button
                type="button"
                onClick={() => executeDelete(deleteConfirmMember.id)}
                className="bg-[#B02019] hover:bg-[#961b15] text-white font-bold h-10 px-6 rounded-full shadow-md transition-all active:scale-95 text-[15px] cursor-pointer"
              >
                ລຶບເລີຍ
              </button>
              <button
                type="button"
                onClick={() => setDeleteConfirmMember(null)}
                className="bg-white hover:bg-gray-100 text-gray-800 font-bold h-10 px-6 rounded-full shadow-md transition-all active:scale-95 text-[15px] cursor-pointer"
              >
                ຍົກເລີກ
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Centered Success Notification Popup (Dead Center of Screen) */}
      {successMsg && (
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
            <span className="tracking-wide text-base md:text-[17px] font-bold">{successMsg}</span>
          </div>
        </div>
      )}
    </div>
  );
}
