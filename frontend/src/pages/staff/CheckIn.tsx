import React, { useState, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Car, User, Search, Play, Pause, Square, QrCode, Ban, UserPlus, Printer, RotateCcw, Check, Zap, Truck, Bike, MessageSquare, Plus, Save, X, Menu, Bell, LogIn, CalendarDays, ChevronDown, MapPin, History, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../api/client';
import type { VehicleType, ParkingTicket, Membership } from '../../types';

const icons: Record<string, React.ReactNode> = {
  motorcycle: <Bike size={36} />,
  ev_motorcycle: <Zap size={36} />,
  car: <Car size={36} />,
  truck: <Truck size={36} />
};

const iconsSmall: Record<string, React.ReactNode> = {
  motorcycle: <Bike size={32} />,
  ev_motorcycle: <Zap size={32} />,
  car: <Car size={32} />,
  truck: <Truck size={32} />
};

const laosProvinces = [
  'ນະຄອນຫລວງ', 'ຜົ້ງສາລີ', 'ຫຼວງນ້ຳທາ', 'ອຸດົມໄຊ', 'ບໍ່ແກ້ວ',
  'ຫຼວງພຣະບາງ', 'ຫົວພັນ', 'ໄຊຍະບູລີ', 'ຊຽງຂວາງ', 'ວຽງຈັນ',
  'ບໍລິຄຳໄຊ', 'ຄຳມ່ວນ', 'ສະຫວັນນະເຂດ', 'ສາລະວັນ', 'ເຊກອງ',
  'ຈຳປາສັກ', 'ອັດຕະປື', 'ໄຊສົມບູນ'
];

const plateColors = [
  { id: 'white', label: 'ຂາວ', bg: '#ffffff', text: '#333', border: '#ccc' },
  { id: 'yellow', label: 'ເຫຼືອງ', bg: '#facc15', text: '#fff', border: '#eab308' },
  { id: 'blue', label: 'ຟ້າ', bg: '#2563eb', text: '#fff', border: '#1d4ed8' },
  { id: 'red', label: 'ແດງ', bg: '#dc2626', text: '#fff', border: '#b91c1c' },
];

const getMemberTypeLabel = (m: any) => {
  const memType = (m?.memberType || '').toUpperCase();
  const notes = (m?.notes || '');
  if (memType === 'DAILY' || notes.includes('(ຝາກລາຍວັນ)')) return 'ຝາກລາຍວັນ';
  if (memType === 'WEEKLY') return 'ຝາກລາຍອາທິດ';
  if (memType === 'MONTHLY') return 'ຝາກລາຍເດືອນ';
  if (memType === 'YEARLY' || notes.includes('(ຝາກລາຍປີ)')) return 'ຝາກລາຍປີ';
  return 'ຝາກມີກຳນົດ';
};

export default function CheckIn() {
  const [types, setTypes] = useState<VehicleType[]>([]);
  const [selType, setSelType] = useState<number | null>(null);
  const [plate, setPlate] = useState('');
  const [plateLetters, setPlateLetters] = useState('');
  const [plateProv, setPlateProv] = useState('');
  const [provinceModalOpen, setProvinceModalOpen] = useState(false);
  const [plateColor, setPlateColor] = useState('white');
  const [noPlate, setNoPlate] = useState(false);
  const [notes, setNotes] = useState('');
  const [pType, setPType] = useState('DAILY');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ParkingTicket | null>(null);
  const [previewPrice, setPreviewPrice] = useState<number | null>(null);
  const [loadingPrice, setLoadingPrice] = useState(false);
  const [memberInfo, setMemberInfo] = useState<Membership | null>(null);
  const [qrPaymentImage, setQrPaymentImage] = useState<string | null>(null);
  const [parkingName, setParkingName] = useState('Vientiane Parking');
  const [parkingSub, setParkingSub] = useState('ໃບບິນຮັບເງິນ / PARKING RECEIPT');
  const [receiptFooter, setReceiptFooter] = useState('Thank you for using our service');
  const [parkingLogo, setParkingLogo] = useState<string | null>(null);
  const API_URL = import.meta.env.VITE_API_URL?.replace('/api', '') || '';

  // --- History Search State & Handlers ---
  const [historyQuery, setHistoryQuery] = useState('');
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [historyResults, setHistoryResults] = useState<any[]>([]);
  const [historyModalOpen, setHistoryModalOpen] = useState(false);
  const [historyFoundBadge, setHistoryFoundBadge] = useState<string | null>(null);
  const [historyCache, setHistoryCache] = useState<any[]>([]);
  const [apiHasMatch, setApiHasMatch] = useState<boolean | null>(null);

  // Preload completed tickets from history on mount
  useEffect(() => {
    const loadHistory = async () => {
      try {
        const [resHist, resRecent] = await Promise.allSettled([
          api.get('/parking/history?limit=300'),
          api.get('/parking/recent?limit=300')
        ]);
        let items: any[] = [];
        if (resHist.status === 'fulfilled') {
          const payload = resHist.value.data?.data || resHist.value.data || [];
          const list = Array.isArray(payload.tickets) ? payload.tickets : Array.isArray(payload) ? payload : payload.data || [];
          items = items.concat(list);
        }
        if (resRecent.status === 'fulfilled') {
          const payload = resRecent.value.data?.data || resRecent.value.data || [];
          const list = Array.isArray(payload) ? payload : payload.data || [];
          items = items.concat(list.filter((t: any) => t.status === 'COMPLETED' || t.checkOutAt));
        }
        setHistoryCache(items);
      } catch {
        /* ignore */
      }
    };
    loadHistory();
  }, []);

  // Check if plate exists as user types
  useEffect(() => {
    const q = historyQuery.trim();
    if (!q) {
      setApiHasMatch(null);
      return;
    }

    // Check preloaded cache first
    const localMatch = historyCache.some((t: any) => {
      const numStr = String(t.plateNumber || '').trim();
      return numStr === q || numStr.includes(q);
    });
    if (localMatch) {
      setApiHasMatch(true);
      return;
    }

    // Debounced backend verification
    const timer = setTimeout(async () => {
      try {
        const { data } = await api.get(`/parking/history?search=${encodeURIComponent(q)}&limit=50`);
        const payload = data.data || data || [];
        const tickets = Array.isArray(payload.tickets) ? payload.tickets : Array.isArray(payload) ? payload : payload.data || [];
        const matches = tickets.filter((t: any) => {
          const numStr = String(t.plateNumber || '').trim();
          return numStr === q || numStr.includes(q);
        });
        if (matches.length > 0) {
          setHistoryCache((prev) => [...prev, ...matches]);
          setApiHasMatch(true);
        } else {
          setApiHasMatch(false);
        }
      } catch {
        setApiHasMatch(false);
      }
    }, 200);

    return () => clearTimeout(timer);
  }, [historyQuery, historyCache]);

  const canSearch = Boolean(
    historyQuery.trim() && (
      apiHasMatch === true ||
      historyCache.some((t: any) => {
        const numStr = String(t.plateNumber || '').trim();
        return numStr === historyQuery.trim() || numStr.includes(historyQuery.trim());
      })
    )
  );

  const searchHistory = async () => {
    const q = historyQuery.trim();
    if (!q || !canSearch) {
      setHistoryResults([]);
      setHistoryModalOpen(false);
      return;
    }
    setLoadingHistory(true);
    try {
      let rawTickets: any[] = [];
      // 1. Try search via /parking/history with search param
      try {
        const { data } = await api.get(`/parking/history?search=${encodeURIComponent(q)}&limit=100`);
        const payload = data.data || data || [];
        rawTickets = Array.isArray(payload.tickets)
          ? payload.tickets
          : Array.isArray(payload)
          ? payload
          : payload.data || [];
      } catch {
        /* fallback to client-side filter */
      }

      // 2. Also check preloaded cache or fetch full history
      if (rawTickets.length === 0 && historyCache.length > 0) {
        rawTickets = historyCache;
      } else if (rawTickets.length === 0) {
        try {
          const resAll = await api.get('/parking/history?limit=200');
          const allPayload = resAll.data?.data || resAll.data || [];
          rawTickets = Array.isArray(allPayload.tickets)
            ? allPayload.tickets
            : Array.isArray(allPayload)
            ? allPayload
            : allPayload.data || [];
        } catch {
          /* fallback */
        }
      }

      // 3. Fallback to /parking/recent for completed tickets
      if (rawTickets.length === 0) {
        try {
          const resRecent = await api.get('/parking/recent?limit=200');
          const recentPayload = resRecent.data?.data || resRecent.data || [];
          const recentTickets = Array.isArray(recentPayload) ? recentPayload : recentPayload.data || [];
          rawTickets = recentTickets.filter((t: any) => t.status === 'COMPLETED' || t.checkOutAt);
        } catch {
          /* fallback */
        }
      }

      // STRICT FILTERING: Search ONLY by vehicle license plate number (plateNumber)
      const filtered = rawTickets.filter((t: any) => {
        const numStr = String(t.plateNumber || '').trim();
        if (!numStr) return false;
        return numStr === q || numStr.includes(q);
      });

      // Sort newest first
      filtered.sort((a: any, b: any) => {
        const timeA = new Date(a.checkOutAt || a.checkInAt || a.createdAt || 0).getTime();
        const timeB = new Date(b.checkOutAt || b.checkInAt || b.createdAt || 0).getTime();
        return timeB - timeA;
      });

      // Deduplicate by plate info
      const seen = new Set();
      const uniqueResults = filtered.filter((t: any) => {
        const plateKey = `${t.plateProvince || ''}_${t.plateLetters || ''}_${t.plateNumber || ''}`.trim();
        const key = plateKey || t.id || t.ticketNumber;
        if (!key || seen.has(key)) return false;
        seen.add(key);
        return true;
      });

      if (uniqueResults.length === 0) {
        setHistoryResults([]);
        setHistoryModalOpen(false);
        return;
      }

      // Found matches!
      setHistoryResults(uniqueResults);
      setHistoryModalOpen(true);
    } catch (err) {
      console.error('History search failed', err);
      setHistoryResults([]);
      setHistoryModalOpen(false);
    } finally {
      setLoadingHistory(false);
    }
  };

  const selectHistoryTicket = (ticket: any) => {
    // 1. Vehicle Type
    let targetTypeId = ticket.vehicleTypeId || ticket.vehicleType?.id;
    if (!targetTypeId && ticket.vehicleType?.name) {
      const match = types.find(t => t.name === ticket.vehicleType.name);
      if (match) targetTypeId = match.id;
    }
    if (targetTypeId) {
      setSelType(targetTypeId);
    }

    // 2. Plate Info
    const hasPlate = Boolean(ticket.plateNumber || ticket.plateLetters);
    if (hasPlate) {
      setNoPlate(false);
      setPlate(ticket.plateNumber || '');
      setPlateLetters(ticket.plateLetters || '');
      setPlateProv(ticket.plateProvince || '');
    } else {
      setNoPlate(true);
      setPlate('');
      setPlateLetters('');
      setPlateProv('');
    }

    // 3. Notes
    if (ticket.notes) {
      setNotes(ticket.notes);
    }

    // 4. Modal and feedback
    setHistoryModalOpen(false);
    const plateText = [ticket.plateProvince, ticket.plateLetters, ticket.plateNumber]
      .filter(Boolean)
      .join(' ') || (hasPlate ? 'ລົດມີປ້າຍ' : 'ລົດບໍ່ມີປ້າຍ');
    const typeLabel = ticket.vehicleType?.label || types.find(t => t.id === targetTypeId)?.label || '';
    setHistoryFoundBadge(`${plateText} ${typeLabel ? `(${typeLabel})` : ''}`.trim());
    toast.success(`ດຶງຂໍ້ມູນປະຫວັດລົດ: ${plateText} ສຳເລັດ!`);
  };

  // --- Add Member State ---
  const [isMemberMode, setIsMemberMode] = useState(false);
  const [pricingRules, setPricingRules] = useState<any[]>([]);
  const [memberForm, setMemberForm] = useState({
    memberType: 'DAILY',
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date(new Date().setDate(new Date().getDate() + 1)).toISOString().split('T')[0],
    paidAmount: 0,
    paymentMethod: 'CASH',
    notes: ''
  });
  // Helper to calculate difference in calendar days
  const calculateDays = (startStr: string, endStr: string) => {
    if (!startStr || !endStr) return 1;
    const start = new Date(startStr);
    const end = new Date(endStr);
    const diffMs = end.getTime() - start.getTime();
    return Math.max(1, Math.round(diffMs / (1000 * 60 * 60 * 24)));
  };

  useEffect(() => {
    api.get('/pricing/vehicle-types').then(r => {
      const vTypes = r.data.data || r.data || [];
      setTypes(vTypes);
    }).catch(() => toast.error('Load failed'));
    api.get('/pricing').then(r => setPricingRules(r.data.data || r.data || [])).catch(console.error);
    api.get('/settings').then(({ data }) => {
      const s = data.data || data;
      const qrSetting = s.find((x: any) => x.key === 'qr_payment_image');
      if (qrSetting && qrSetting.value?.url) {
        setQrPaymentImage(qrSetting.value.url);
      }
      const logoSetting = s.find((x: any) => x.key === 'parking_logo');
      if (logoSetting && logoSetting.value?.url) {
        setParkingLogo(logoSetting.value.url);
      }
      const nameSetting = s.find((x: any) => x.key === 'parking_name');
      if (nameSetting && nameSetting.value?.name) {
        setParkingName(nameSetting.value.name);
        setParkingSub(nameSetting.value.subtitle || 'ໃບບິນຮັບເງິນ / PARKING RECEIPT');
      }
      const footerSetting = s.find((x: any) => x.key === 'receipt_footer');
      if (footerSetting && footerSetting.value?.text) {
        setReceiptFooter(footerSetting.value.text);
      }
    }).catch(console.error);
  }, []);

  // Auto-calc member paid amount directly from database pricing rules
  useEffect(() => {
    if (!selType) return;
    const rule = pricingRules.find(r => r.vehicleTypeId === selType);
    if (rule) {
      if (memberForm.memberType === 'DAILY') {
        setMemberForm(f => ({ ...f, paidAmount: Number(rule.dailyRate) }));
      } else if (memberForm.memberType === 'WEEKLY') {
        setMemberForm(f => ({ ...f, paidAmount: Number(rule.weeklyRate) }));
      } else if (memberForm.memberType === 'MONTHLY') {
        setMemberForm(f => ({ ...f, paidAmount: Number(rule.monthlyRate) }));
      } else if (memberForm.memberType === 'YEARLY') {
        setMemberForm(f => ({ ...f, paidAmount: Number(rule.yearlyRate || 0) }));
      } else if (memberForm.memberType === 'CUSTOM') {
        const diffDays = calculateDays(memberForm.startDate, memberForm.endDate);
        setMemberForm(f => ({ ...f, paidAmount: diffDays * Number(rule.dailyRate) }));
      }
    }
  }, [selType, memberForm.memberType, memberForm.startDate, memberForm.endDate, pricingRules, isMemberMode]);

  // Fetch price preview when vehicle type or parking type changes
  useEffect(() => {
    if (!selType) { setPreviewPrice(null); return; }
    setLoadingPrice(true);
    api.get(`/pricing/rate?vehicleTypeId=${selType}&parkingType=${pType}`)
      .then(r => {
        const d = r.data.data || r.data;
        setPreviewPrice(d.rate || 0);
      })
      .catch(() => setPreviewPrice(null))
      .finally(() => setLoadingPrice(false));
  }, [selType, pType]);

  // Check membership when plate changes (debounced)
  useEffect(() => {
    const finalPlate = noPlate ? '' : (plateLetters + ' ' + plate).trim();
    if (finalPlate.length >= 2) {
      const timer = setTimeout(async () => {
        try {
          const { data } = await api.get(`/membership/check/${encodeURIComponent(finalPlate)}`);
          if (data.data?.isMember) {
            setMemberInfo(data.data.membership);
          } else {
            setMemberInfo(null);
          }
        } catch {
          setMemberInfo(null);
        }
      }, 500);
      return () => clearTimeout(timer);
    } else {
      setMemberInfo(null);
    }
  }, [plate, plateLetters, noPlate]);

  /* Number-pad handler: append digit to plate number */
  const handleNumPad = (digit: string) => {
    if (plate.length < 4) setPlate(prev => prev + digit);
  };
  const handleNumPadClear = () => setPlate('');
  const handleNumPadBackspace = () => setPlate(prev => prev.slice(0, -1));

  const toggleNoPlate = () => {
    setProvinceModalOpen(false);
    setNoPlate(prev => {
      if (!prev) { setPlate(''); setPlateLetters(''); setPlateProv(''); setPlateColor('white'); }
      else { setPlateProv(''); setNotes(''); }
      return !prev;
    });
  };

  const isSubmitting = React.useRef(false);

  const handleCheckIn = async () => {
    if (!selType) return toast.error('ກະລຸນາເລືອກປະເພດລົດ');
    if (!noPlate) {
      if (!plate) return toast.error('ກະລຸນາປ້ອນເລກປ້າຍລົດ (Plate Number)');
      if (!plateLetters) return toast.error('ກະລຸນາປ້ອນໂຕອັກສອນປ້າຍລົດ (Plate Letters)');
    }

    if (isSubmitting.current) return;
    isSubmitting.current = true;
    setLoading(true);
    try {
      const { data } = await api.post('/parking/check-in', {
        vehicleTypeId: selType,
        plateNumber: noPlate ? undefined : (plate || undefined),
        plateLetters: noPlate ? undefined : (plateLetters || undefined),
        plateProvince: noPlate ? undefined : (plateProv || undefined),
        parkingType: pType,
        prepaidAmount: previewPrice || undefined,
        notes: noPlate && notes.trim() ? notes.trim() : undefined,
      });
      const t = data.data || data;
      setResult(t);
      toast.success(`ສຳເລັດ! Ticket: ${t.ticketNumber}`);
    } catch (e: any) {
      const msg = e.response?.data?.message || 'Failed';
      toast.error(msg, { duration: 5000, icon: '🚫' });
    }
    finally {
      setLoading(false);
      isSubmitting.current = false;
    }
  };

  const reset = () => {
    setSelType(null);
    setPlate('');
    setPlateLetters('');
    setPlateProv('');
    setPlateColor('white');
    setNoPlate(false);
    setNotes('');
    setPType('DAILY');
    setResult(null);
    setPreviewPrice(null);
    setMemberInfo(null);
    setProvinceModalOpen(false);
    setIsMemberMode(false);
    setHistoryQuery('');
    setHistoryResults([]);
    setHistoryFoundBadge(null);
    setHistoryModalOpen(false);
    setMemberForm({
      memberType: 'DAILY',
      startDate: new Date().toISOString().split('T')[0],
      endDate: new Date(new Date().setDate(new Date().getDate() + 1)).toISOString().split('T')[0],
      paidAmount: 0,
      paymentMethod: 'CASH',
      notes: '',
    });
    toast.success('ລ້າງຂໍ້ມູນຮຽບຮ້ອຍແລ້ວ', { position: 'top-center' });
  };

  // --- Add Member Handlers ---
  const calcMemberEndDate = (start: string, type: string) => {
    const end = new Date(start);
    if (type === 'DAILY') end.setDate(end.getDate() + 1);
    else if (type === 'WEEKLY') end.setDate(end.getDate() + 7);
    else if (type === 'MONTHLY') end.setMonth(end.getMonth() + 1);
    else if (type === 'YEARLY') end.setFullYear(end.getFullYear() + 1);
    else if (type === 'CUSTOM') end.setDate(end.getDate() + 1);
    return end.toISOString().split('T')[0];
  };

  const toggleMemberMode = () => {
    const nextMode = !isMemberMode;
    setIsMemberMode(nextMode);
    if (nextMode) {
      // Re-fetch pricing rules directly from DB to ensure always fresh
      api.get('/pricing').then(r => {
        const rules = r.data.data || r.data || [];
        setPricingRules(rules);
        const activeType = selType || types.find(x => x.name === 'car')?.id || types[0]?.id;
        if (!selType && activeType) {
          setSelType(activeType);
        }
        if (activeType) {
          const rule = rules.find((x: any) => x.vehicleTypeId === activeType);
          if (rule) {
            setMemberForm(f => ({
              ...f,
              memberType: 'DAILY',
              startDate: new Date().toISOString().split('T')[0],
              endDate: new Date(new Date().setDate(new Date().getDate() + 1)).toISOString().split('T')[0],
              paidAmount: Number(rule.dailyRate),
              notes: ''
            }));
          }
        }
      }).catch(console.error);

      setMemberForm(f => {
        const activeType = selType || types.find(x => x.name === 'car')?.id || types[0]?.id;
        const rule = pricingRules.find(x => x.vehicleTypeId === activeType);
        return {
          ...f,
          memberType: 'DAILY',
          startDate: new Date().toISOString().split('T')[0],
          endDate: new Date(new Date().setDate(new Date().getDate() + 1)).toISOString().split('T')[0],
          paidAmount: rule ? Number(rule.dailyRate) : 0,
          notes: ''
        };
      });
    }
  };

  const handleMemberSubmit = async () => {
    if (!selType) return toast.error('ກະລຸນາເລືອກປະເພດລົດ');
    if (!noPlate) {
      if (!plate) return toast.error('ກະລຸນາປ້ອນເລກປ້າຍລົດ (Plate Number)');
      if (!plateLetters) return toast.error('ກະລຸນາປ້ອນໂຕອັກສອນປ້າຍລົດ (Plate Letters)');
    }

    if (isSubmitting.current) return;
    isSubmitting.current = true;
    setLoading(true);
    try {
      const submitMemberType = (memberForm.memberType === 'DAILY' || memberForm.memberType === 'YEARLY') ? 'CUSTOM' : memberForm.memberType;
      const customDays = calculateDays(memberForm.startDate, memberForm.endDate);
      const notesTag = memberForm.memberType === 'DAILY'
        ? ' (ຝາກລາຍວັນ)'
        : memberForm.memberType === 'YEARLY'
          ? ' (ຝາກລາຍປີ)'
          : memberForm.memberType === 'CUSTOM'
            ? ` (ຝາກກຳນົດເອງ ${customDays} ມື້)`
            : '';
      const baseNote = noPlate
        ? [notes.trim(), memberForm.notes?.trim()].filter(Boolean).join(' | ') || 'ລົດບໍ່ມີປ້າຍ'
        : (memberForm.notes || undefined);
      const submitNotes = baseNote ? baseNote + notesTag : notesTag.trim() || undefined;

      const { data } = await api.post('/membership', {
        vehicleTypeId: selType,
        plateNumber: noPlate ? '' : plate.trim(),
        plateLetters: noPlate ? '' : plateLetters.trim(),
        plateProvince: noPlate ? '' : (plateProv.trim() || undefined),
        memberType: submitMemberType,
        startDate: new Date(memberForm.startDate).toISOString(),
        endDate: new Date(memberForm.endDate).toISOString(),
        paidAmount: Number(memberForm.paidAmount),
        paymentMethod: memberForm.paymentMethod,
        notes: submitNotes,
      });

      const t = data.data?.ticket || data.ticket || data.data;
      setResult(t);

      toast.success('ເພີ່ມສະມາຊິກ + ລົດເຂົ້າ (Check-in) ສຳເລັດ!');
      setIsMemberMode(false);
    } catch (e: any) {
      const msg = e.response?.data?.message;
      toast.error(Array.isArray(msg) ? msg.join(', ') : (msg || 'Failed to save'), { duration: 5000, icon: '🚫' });
    } finally {
      setLoading(false);
      isSubmitting.current = false;
    }
  };

  const currRule = pricingRules.find(r => r.vehicleTypeId === selType);
  const customDays = calculateDays(memberForm.startDate, memberForm.endDate);

  if (result) return (
    <div className="max-w-sm mx-auto animate-scale-in">
      {/* Receipt Box */}
      <div className="bg-white p-5 text-black shadow-xl rounded-none border border-gray-100 font-sans mx-auto" style={{ width: '100%', maxWidth: '320px' }}>

        {/* Header */}
        <div className="text-center mb-3">
          {parkingLogo ? (
            <img src={parkingLogo.startsWith('http') ? parkingLogo : `${API_URL}${parkingLogo}`} alt="Logo" className="w-12 h-12 mx-auto mb-1 object-contain" />
          ) : (
            <Car className="w-10 h-10 mx-auto mb-1 text-gray-800" />
          )}
          <h2 className="text-xl font-bold text-gray-900 m-0 leading-tight">{parkingName}</h2>
          <p className="text-[12px] text-gray-500 m-0 mt-0.5 tracking-wide">{parkingSub}</p>
        </div>

        <div className="border-t border-dashed border-gray-300 my-3"></div>

        {/* Ticket Info */}
        <div className="space-y-1.5 text-[13px] text-gray-800">
          <div className="flex justify-between"><span>Ticket No:</span><span className="font-bold">{result.ticketNumber}</span></div>
          <div className="flex justify-between"><span>ປະເພດລົດ:</span><span className="font-bold">{result.vehicleType?.label}</span></div>
          <div className="flex justify-between"><span>ຮູບແບບ:</span><span className="font-bold">
            {(result as any).notes?.includes('(ຝາກລາຍປີ)') ? 'ລາຍປີ (Yearly)' :
              (result as any).parkingType === 'WEEKLY' ? 'ລາຍອາທິດ (Weekly)' :
                (result as any).parkingType === 'MONTHLY' ? 'ລາຍເດືອນ (Monthly)' :
                  (result as any).parkingType === 'HOURLY' ? 'ລາຍຊົ່ວໂມງ (Hourly)' :
                    (result as any).notes?.includes('(ຝາກລາຍວັນ)') ? 'ລາຍວັນ (Daily)' :
                      (result as any).parkingType === 'CUSTOM' ? 'ກຳນົດເອງ (Custom)' :
                        'ລາຍວັນ (Daily)'}
          </span></div>
          <div className="flex justify-between"><span>ທະບຽນ:</span><span className="font-bold">{result.plateNumber ? `${result.plateProvince || ''} ${(result as any).plateLetters || ''} ${result.plateNumber}`.trim() : 'ບໍ່ມີ'}</span></div>
          <div className="flex justify-between"><span>ເວລາເຂົ້າ:</span><span className="font-bold">{new Date(result.checkInAt).toLocaleString('lo-LA')}</span></div>
          {(result as any).customEnd && (
            <div className="flex justify-between text-red-600"><span>ວັນໝົດອາຍຸ:</span><span className="font-bold">{new Date((result as any).customEnd).toLocaleDateString('lo-LA')}</span></div>
          )}
          {(result as any).notes && (
            <div className="flex justify-between"><span>ໝາຍເຫດ:</span><span className="font-bold">{(result as any).notes}</span></div>
          )}
        </div>

        {/* Amount (if prepaid) */}
        {(result as any).prepaidAmount ? (
          <>
            <div className="border-t border-dashed border-gray-300 my-3"></div>
            <div className="text-center my-3 p-3 bg-gray-50 rounded-none border border-gray-100">
              <div className="text-[12px] text-gray-500 mb-1">ຄ່າບໍລິການຈ່າຍແລ້ວ</div>
              <div className="text-3xl font-bold text-emerald-500 leading-none">{new Intl.NumberFormat('lo-LA').format(Number((result as any).prepaidAmount))} ₭</div>
            </div>
          </>
        ) : <div className="border-t border-dashed border-gray-300 my-3"></div>}

        {/* 2 QR Codes */}
        <div className="flex justify-between gap-3 my-4">
          {qrPaymentImage && (result as any).prepaidAmount ? (
            <div className="flex-1 text-center">
              <span className="text-[11px] font-bold block mb-1.5 text-gray-800 tracking-wide">QR PAYMENT</span>
              <div className="flex justify-center">
                <img src={qrPaymentImage.startsWith('http') ? qrPaymentImage : `${API_URL}${qrPaymentImage}`} className="w-[95px] h-[95px] object-contain rounded-none border border-gray-100 p-1" alt="QR Pay" />
              </div>
            </div>
          ) : (
            <div className="flex-1"></div> /* Spacer if no QR Payment */
          )}

          <div className="flex-1 text-center">
            <span className="text-[11px] font-bold block mb-1.5 text-gray-800 tracking-wide">CHECK-OUT</span>
            <div className="flex justify-center">
              <div className="p-1 border border-gray-100 rounded-none bg-white">
                <QRCodeSVG value={result.qrCodeData || result.ticketNumber} size={85} level="M" />
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-dashed border-gray-300 my-3"></div>

        <div className="text-center text-[12px] mt-2 text-gray-500 leading-snug">
          ກະລຸນາເກັບໃບບິນນີ້ໄວ້ເພື່ອສະແກນອອກ<br />
          {receiptFooter}
        </div>
      </div>

      {/* Buttons */}
      <div className="flex gap-3 mt-6 px-2 justify-center max-w-[320px] mx-auto">
        <button onClick={() => toast.success('🖨️ Printing...')} className="flex-[1.2] bg-emerald-500 text-white rounded-none py-3.5 px-3 font-bold text-[15px] flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 active:scale-95 transition-transform hover:bg-emerald-600">
          <Printer size={20} /> ພິມໃບບິນ
        </button>
        <button onClick={reset} className="flex-1 bg-white text-gray-700 border border-gray-200 rounded-none py-3.5 px-3 font-bold text-[15px] flex items-center justify-center gap-2 shadow-sm active:scale-95 transition-transform hover:bg-gray-50">
          <RotateCcw size={20} /> ຄັນຕໍ່ໄປ
        </button>
      </div>
    </div>
  );

  return (
    <div className="font-sans w-full flex flex-col">
      {/* Main Card */}
      <div className="shadow-[0_12px_36px_rgba(0,0,0,0.22),0_4px_14px_rgba(0,0,0,0.12)] rounded-none overflow-visible w-full border-0 flex flex-col" style={{ borderRadius: 0 }}>
        {/* Header Bar — Dark Gray */}
        <div
          className="bg-[#5D5D5D] px-3 py-2.5 md:py-0 min-h-[60px] md:h-16 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-2 md:gap-3 rounded-none shrink-0"
          style={{ borderRadius: 0 }}
        >
          {/* Top Row on Mobile / Left Section on Desktop: Icon + Title */}
          <div className="flex items-center justify-between w-full md:w-auto h-10 shrink-0">
            <div className="flex items-center gap-2 sm:gap-2.5">
              <LogIn size={20} className="w-4.5 h-4.5 sm:w-5 sm:h-5 text-white shrink-0" />
              <h1 className="text-sm sm:text-base md:text-[17px] font-bold text-white tracking-normal whitespace-nowrap">
                ລົດເຂົ້າ
              </h1>
            </div>
          </div>

          {/* Controls: Search Box + Action Buttons */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center md:justify-end md:ml-auto gap-2 md:gap-2.5 w-full md:w-auto shrink-0">
            {/* Search Box from History */}
            <div className="flex items-center bg-white shadow-sm w-full md:w-[280px] lg:w-[315px] xl:w-[325px] rounded-l-none rounded-r-full overflow-hidden pl-3 sm:pl-3.5 h-10 min-h-[40px] shrink-0">
              <div className="flex items-center justify-center text-[#F9A825] shrink-0">
                <Search size={18} className="w-[18px] h-[18px] text-[#F9A825]" />
              </div>
              <input
                type="tel"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={4}
                name="historySearchFilter"
                autoComplete="off"
                data-lpignore="true"
                placeholder="ຄົ້ນຫາເລກປ້າຍລົດ"
                value={historyQuery}
                onChange={(e) => {
                  const val = e.target.value.replace(/\D/g, '').slice(0, 4);
                  setHistoryQuery(val);
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && canSearch) {
                    searchHistory();
                  }
                }}
                className="px-2.5 h-full text-base md:text-[17px] font-bold text-gray-800 placeholder:text-base md:placeholder:text-[17px] placeholder:font-bold placeholder:text-gray-500 focus:outline-none flex-1 min-w-0 bg-transparent [&::-webkit-search-cancel-button]:hidden [&::-webkit-search-decoration]:hidden"
              />
              {historyQuery && (
                <button
                  type="button"
                  onClick={() => {
                    setHistoryQuery('');
                    setHistoryResults([]);
                    setApiHasMatch(null);
                  }}
                  className="px-1 text-gray-400 hover:text-gray-600 transition-colors cursor-pointer shrink-0"
                  title="ລຶບຂໍ້ຄວາມ"
                >
                  <X size={15} />
                </button>
              )}
              <button
                type="button"
                onClick={searchHistory}
                disabled={!canSearch || loadingHistory}
                className="bg-[#F9A825] hover:bg-[#e69510] text-black font-bold px-3.5 sm:px-4.5 h-full text-base md:text-[17px] transition-colors rounded-r-full ml-auto flex items-center justify-center shrink-0 disabled:cursor-not-allowed enabled:cursor-pointer enabled:active:scale-95"
              >
                {loadingHistory ? (
                  <RefreshCw size={15} className="animate-spin text-black" />
                ) : (
                  'ຄົ້ນຫາ'
                )}
              </button>
            </div>

            {/* Action Buttons: 3 columns on mobile, inline on sm+ */}
            <div className="grid grid-cols-3 sm:flex items-center gap-1.5 sm:gap-2 w-full sm:w-auto shrink-0">
              <button
                type="button"
                onClick={reset}
                className="bg-[#B02019] hover:bg-[#8f1913] text-white px-2 sm:px-3.5 md:px-4.5 h-10 rounded-none font-bold shadow-md transition-all text-xs sm:text-sm md:text-[16px] shrink-0 flex items-center justify-center gap-1 sm:gap-1.5 active:scale-95 border-0 cursor-pointer"
                title="ລ້າງຂໍ້ມູນທັງໝົດເປັນຄ່າເລີ່ມຕົ້ນ"
              >
                <RotateCcw size={16} className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white shrink-0" strokeWidth={2.2} />
                <span className="whitespace-nowrap">ລ້າງຂໍ້ມູນ</span>
              </button>
              <button
                type="button"
                onClick={toggleNoPlate}
                className={`flex items-center justify-center gap-1 sm:gap-1.5 px-2 sm:px-3.5 md:px-4.5 h-10 font-bold transition-all text-xs sm:text-sm md:text-[16px] rounded-none cursor-pointer border-0 outline-none focus:outline-none active:scale-95 shadow-md shrink-0 ${
                  noPlate
                    ? 'bg-[#B45309] hover:bg-[#92400e] text-white'
                    : 'bg-[#EAB308] hover:bg-[#CA8A04] text-black'
                }`}
                title="ລົດບໍ່ມີປ້າຍ"
              >
                <Ban size={16} className={`w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0 ${noPlate ? 'text-white' : 'text-black'}`} strokeWidth={2.2} />
                <span className="whitespace-nowrap">ລົດບໍ່ມີປ້າຍ</span>
              </button>
              <button
                type="button"
                onClick={toggleMemberMode}
                className="bg-white hover:bg-gray-100 text-[#232323] px-2 sm:px-3.5 md:px-4.5 h-10 rounded-full font-bold shadow-md transition-all text-xs sm:text-sm md:text-[16px] shrink-0 flex items-center justify-center gap-1 sm:gap-1.5 active:scale-95 border-0 cursor-pointer"
              >
                <CalendarDays size={16} className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#232323] shrink-0" strokeWidth={2.2} />
                <span className="whitespace-nowrap">ຝາກມີກຳນົດ</span>
              </button>
            </div>
          </div>
        </div>

        {/* Top Red Stripe */}
        <div className="h-[2.5px] bg-[#B02019] w-full" />

        {/* Body — Orange (Equal spacing top and bottom for Section 1 and 2) */}
        <div className="bg-[#F9A825] px-3 sm:px-4 pt-3.5 sm:pt-4 pb-3.5 sm:pb-4">
          {/* History Pre-fill Alert Banner */}
          {historyFoundBadge && (
            <div className="bg-emerald-600 text-white px-3.5 py-2.5 mb-3.5 shadow-md flex items-center justify-between animate-fade-in font-bold text-xs sm:text-sm">
              <div className="flex items-center gap-2">
                <Check size={18} className="text-white shrink-0 stroke-[2.5]" />
                <span>ດຶງຂໍ້ມູນຈາກປະຫວັດ: <span className="underline decoration-white/60">{historyFoundBadge}</span> (ກະລຸນາກວດສອບ ຫຼື ກົດ Check-in ໄດ້ເລີຍ)</span>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {historyResults.length > 1 && (
                  <button
                    type="button"
                    onClick={() => setHistoryModalOpen(true)}
                    className="bg-white/20 hover:bg-white/30 text-white px-2 py-0.5 text-xs rounded-none cursor-pointer"
                  >
                    ປ່ຽນຄັນອື່ນ ({historyResults.length})
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setHistoryFoundBadge(null)}
                  className="text-white/80 hover:text-white p-0.5 cursor-pointer"
                  title="ປິດ"
                >
                  <X size={16} />
                </button>
              </div>
            </div>
          )}

          <p className="text-sm sm:text-base md:text-[17px] font-bold text-black leading-tight mb-3.5 sm:mb-4">1.ເລືອກປະເພດລົດ</p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-3.5 md:gap-4 mb-3.5 sm:mb-4">
            {[...types]
              .sort((a, b) => {
                const order = ['motorcycle', 'ev_motorcycle', 'car', 'truck'];
                return order.indexOf(a.name) - order.indexOf(b.name);
              })
              .map(vt => (
                <button
                  key={vt.id}
                  type="button"
                  onClick={() => setSelType(vt.id)}
                  className={`h-24 sm:h-26 md:h-28 flex flex-col items-center justify-center transition-all rounded-none border-0 outline-none ring-0 ${
                    selType === vt.id
                      ? 'bg-[#B02019] text-white shadow-xl'
                      : 'bg-white text-gray-900 shadow-md hover:shadow-lg'
                  }`}
                >
                  <div className={`mb-1.5 transition-colors ${selType === vt.id ? 'text-white' : 'text-gray-900'}`}>
                    {icons[vt.name] || <Car size={32} />}
                  </div>
                  <span className={`text-xs sm:text-sm md:text-[15px] font-bold text-center tracking-normal whitespace-nowrap transition-colors ${selType === vt.id ? 'text-white' : 'text-gray-900'}`}>
                    {vt.label}
                  </span>
                </button>
              ))}
          </div>

          <p className="text-sm sm:text-base md:text-[17px] font-bold text-black leading-tight mb-3.5 sm:mb-4">2.ຂໍ້ມູນປ້າຍລົດ</p>

          {noPlate ? (
            <div className="border-2 border-dashed border-[#B45309] py-5 sm:py-7 md:py-8 px-3 sm:px-6 mb-0 text-center rounded-none">
              <Ban size={36} className="sm:w-11 sm:h-11 mx-auto text-[#B02019] mb-2 sm:mb-3" strokeWidth={2.2} />
              <p className="text-black font-bold text-sm sm:text-base md:text-[17px] mb-3 md:mb-4">ລົດຄັນນີ້ຈະ check in ໂດຍບໍ່ມີຂໍ້ມູນປ້າຍລົດ</p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3 max-w-lg mx-auto">
                <input
                  type="text"
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  placeholder="ໝາຍເຫດເຊັ່ນ : ລົດສີແດງ,ເບີໂທ ແລະ ອື່ນໆ ຯລຯ"
                  className="w-full flex-1 px-3 sm:px-4 h-10 sm:h-11 bg-white text-gray-800 text-xs sm:text-sm md:text-base focus:outline-none placeholder-gray-500 rounded-none shadow-sm"
                  maxLength={50}
                />
                <div className="px-4 h-10 sm:h-11 bg-[#FBC267] flex items-center justify-center text-sm md:text-[16px] font-bold text-[#5D5D5D] shadow-sm shrink-0">
                  {memberInfo ? '0 ₭' : previewPrice !== null ? `${new Intl.NumberFormat('lo-LA').format(previewPrice)} ₭` : 'xxxxxxxx ₭'}
                </div>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-3.5 md:gap-4 mb-0">
              <input
                type="tel"
                value={plate}
                onChange={e => setPlate(e.target.value.replace(/\D/g, '').slice(0, 4))}
                placeholder="1234"
                className="w-full bg-white h-14 md:h-18 px-4 text-center text-base md:text-[17px] font-bold text-black placeholder-gray-400 focus:outline-none shadow-md rounded-none"
              />
              <input
                value={plateLetters}
                onChange={e => setPlateLetters(e.target.value.replace(/\d/g, '').toUpperCase())}
                placeholder="ກຂ"
                className="w-full bg-white h-14 md:h-18 px-4 text-center text-base md:text-[17px] font-bold text-black placeholder-gray-400 focus:outline-none shadow-md rounded-none"
                maxLength={2}
              />
              <div className="relative w-full">
                <button
                  type="button"
                  onClick={() => setProvinceModalOpen(true)}
                  className={`w-full bg-white h-14 md:h-18 px-4 text-left text-base md:text-[17px] font-bold focus:outline-none shadow-md rounded-none cursor-pointer flex items-center justify-between border-0 transition-all hover:bg-gray-50 active:scale-[0.99] ${
                    !plateProv ? 'text-gray-400' : 'text-black'
                  }`}
                >
                  <div className="flex items-center gap-2 truncate">
                    <MapPin size={20} className={`shrink-0 ${plateProv ? 'text-[#B02019]' : 'text-gray-400'}`} />
                    <span className="truncate">{plateProv || 'ປ້າຍອອກແຂວງ'}</span>
                  </div>
                  <ChevronDown size={20} className="text-gray-400 shrink-0" />
                </button>
              </div>
              <div
                className="w-full bg-[#FBC267] h-14 md:h-18 px-4 flex items-center justify-center text-base md:text-[17px] font-bold text-[#5D5D5D] shadow-md rounded-none select-none tracking-normal"
                title="ຄ່າບໍລິການ"
              >
                {memberInfo
                  ? '0 ₭'
                  : previewPrice !== null
                    ? `${new Intl.NumberFormat('lo-LA').format(previewPrice)} ₭`
                    : 'xxxxxxxx ₭'}
              </div>
            </div>
          )}

          {/* Membership Info Badge (if active member found) */}
          {!isMemberMode && memberInfo && (
            <div className="bg-emerald-600 px-5 py-3 mt-3 sm:mt-3.5 flex items-center justify-between shadow-md text-white">
              <div className="flex flex-col">
                <span className="font-bold text-lg">{getMemberTypeLabel(memberInfo)} (ສະມາຊິກ)</span>
                <span className="text-sm font-medium">ໝົດອາຍຸ: {new Date(memberInfo.endDate).toLocaleDateString('lo-LA')}</span>
              </div>
              <div className="font-bold text-2xl">0 ₭</div>
            </div>
          )}

          {/* Member Registration Mode */}
          {isMemberMode && (
            <div className="mt-3 sm:mt-3.5 animate-scale-in">
              <div className="flex items-center justify-between mb-2 sm:mb-2.5">
                <p className="text-sm sm:text-base md:text-[17px] font-bold text-black m-0">
                  3.ປະເພດສະມາຊິກ
                </p>
                {currRule && (
                  <span className="text-sm sm:text-base md:text-[17px] font-bold bg-[#B02019] text-white px-2.5 py-1 shadow-sm">
                    ລາຄາລາຍວັນ: {new Intl.NumberFormat('lo-LA').format(Number(currRule.dailyRate))} ₭ / ມື້
                  </span>
                )}
              </div>

              <select
                value={memberForm.memberType}
                onChange={e => {
                  const t = e.target.value;
                  const end = calcMemberEndDate(memberForm.startDate, t);
                  setMemberForm({ ...memberForm, memberType: t, endDate: end });
                }}
                className="w-full h-12 sm:h-14 px-4 bg-white text-sm sm:text-base md:text-[17px] font-bold text-black border-none focus:outline-none shadow-md appearance-none mb-3 sm:mb-4 rounded-none cursor-pointer"
              >
                <option value="DAILY">ລາຍວັນ (Daily)</option>
                <option value="WEEKLY">ລາຍອາທິດ (Weekly)</option>
                <option value="MONTHLY">ລາຍເດືອນ (Monthly)</option>
                <option value="YEARLY">ລາຍປີ (Yearly)</option>
                <option value="CUSTOM">ກຳນົດເອງ (Custom)</option>
              </select>

              <div className="grid grid-cols-2 gap-3 sm:gap-4 md:gap-6 mb-3 sm:mb-4">
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <p className="text-sm sm:text-base md:text-[17px] font-bold text-black m-0">ວັນທີເລີ່ມ</p>
                  </div>
                  <input
                    type="date"
                    required
                    value={memberForm.startDate}
                    onChange={e => {
                      const s = e.target.value;
                      if (memberForm.memberType === 'CUSTOM') {
                        setMemberForm(prev => ({ ...prev, startDate: s }));
                      } else {
                        const end = calcMemberEndDate(s, memberForm.memberType);
                        setMemberForm(prev => ({ ...prev, startDate: s, endDate: end }));
                      }
                    }}
                    className="w-full h-11 sm:h-12 px-3 sm:px-4 bg-white text-sm sm:text-base md:text-[17px] font-bold text-black border-none focus:outline-none shadow-md rounded-none cursor-pointer"
                  />
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <p className="text-sm sm:text-base md:text-[17px] font-bold text-black m-0">ວັນໝົດອາຍຸ</p>
                    {memberForm.memberType === 'CUSTOM' && (
                      <span className="text-sm sm:text-base md:text-[17px] font-bold text-[#B02019]">
                        ({customDays} ມື້)
                      </span>
                    )}
                  </div>
                  <input
                    type="date"
                    required
                    value={memberForm.endDate}
                    onChange={e => {
                      // Automatically switch to CUSTOM when date is manually modified
                      setMemberForm(prev => ({ ...prev, memberType: 'CUSTOM', endDate: e.target.value }));
                    }}
                    className="w-full h-11 sm:h-12 px-3 sm:px-4 bg-white text-sm sm:text-base md:text-[17px] font-bold text-black border-none focus:outline-none shadow-md rounded-none cursor-pointer"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between mb-1.5">
                <p className="text-sm sm:text-base md:text-[17px] font-bold text-black m-0">ຈຳນວນເງິນທີ່ຕ້ອງຈ່າຍ</p>
                {currRule && memberForm.memberType === 'CUSTOM' && (
                  <span className="text-sm sm:text-base md:text-[17px] font-bold text-black">
                    ຄິດໄລ່: {customDays} ມື້ × {new Intl.NumberFormat('lo-LA').format(Number(currRule.dailyRate))} ₭
                  </span>
                )}
              </div>

              <input
                type="text"
                readOnly
                value={`${new Intl.NumberFormat('lo-LA').format(memberForm.paidAmount)} ₭`}
                className="w-full h-12 sm:h-14 px-4 bg-white text-sm sm:text-base md:text-[17px] font-bold text-[#14B8A6] border-none focus:outline-none shadow-md mb-2 rounded-none"
              />

              {/* Informative Price Card */}
              {currRule && (
                <div className="bg-white p-3 shadow-md flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 text-sm sm:text-base md:text-[17px] font-bold rounded-none">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[#B02019]">ລາຄາລາຍວັນ:</span>
                    <span className="text-black">
                      {new Intl.NumberFormat('lo-LA').format(Number(currRule.dailyRate))} ₭ / ມື້
                    </span>
                  </div>
                  <div>
                    {memberForm.memberType === 'CUSTOM' ? (
                      <div className="flex items-center gap-1">
                        <span className="text-black">ຈຳນວນ:</span>
                        <span className="text-[#B02019]">{customDays} ມື້</span>
                        <span className="text-black">=</span>
                        <span className="text-[#14B8A6]">{new Intl.NumberFormat('lo-LA').format(memberForm.paidAmount)} ₭</span>
                      </div>
                    ) : (
                      <span className="text-gray-500 font-medium">
                        (ດຶງລາຄາຈາກ Database ໂດຍກົງ)
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Bottom Red Stripe */}
        <div className="h-[2.5px] bg-[#B02019] w-full" />

        {/* Footer Bar — Dark Gray with Centered Check-in Button */}
        <div
          className="bg-[#5D5D5D] px-3 py-3 md:py-0 min-h-[60px] md:h-16 flex items-center justify-center rounded-none shrink-0"
          style={{ borderRadius: 0 }}
        >
          {/* Button: Check in */}
          <button
            type="button"
            onClick={isMemberMode ? handleMemberSubmit : handleCheckIn}
            disabled={!selType || loading}
            className="bg-white hover:bg-gray-100 text-[#232323] px-6 sm:px-8 h-10 rounded-none font-bold shadow-md transition-all text-xs sm:text-sm md:text-[15px] flex items-center justify-center gap-1.5 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed border-0 cursor-pointer"
            style={{ borderRadius: 0 }}
          >
            <LogIn size={17} className="w-4 h-4 sm:w-4.5 sm:h-4.5 text-[#232323] shrink-0" />
            <span className="whitespace-nowrap">{loading ? 'ກຳລັງປະມວນຜົນ...' : 'ລົດເຂົ້າ(Check in)'}</span>
          </button>
        </div>
      </div>

      {/* Province Selection Modal Popup */}
      {provinceModalOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5 animate-fade-in"
          onClick={() => setProvinceModalOpen(false)}
        >
          <div
            className="bg-white w-full max-w-xl sm:max-w-2xl max-h-[90vh] flex flex-col shadow-2xl rounded-none border-0 overflow-hidden animate-scale-in"
            onClick={e => e.stopPropagation()}
            style={{ borderRadius: 0 }}
          >
            {/* Modal Header — Dark Gray Bar */}
            <div className="bg-[#5D5D5D] px-5 sm:px-6 h-12 sm:h-14 flex items-center justify-between shrink-0 rounded-none">
              <div className="flex items-center gap-2.5">
                <MapPin size={20} className="text-[#F9A825] shrink-0" />
                <h2 className="text-base sm:text-[17px] font-bold text-white tracking-normal">
                  ເລືອກປ້າຍອອກແຂວງ
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setProvinceModalOpen(false)}
                className="text-white/80 hover:text-white p-1 hover:bg-white/10 transition-colors cursor-pointer"
                title="ປິດ"
              >
                <X size={20} />
              </button>
            </div>

            {/* Red Stripe */}
            <div className="h-[2px] bg-[#B02019] w-full shrink-0" />

            {/* Modal Body */}
            <div className="bg-[#F8F9FA] p-3.5 sm:p-5 flex-1 overflow-y-auto">
              {/* Quick Action / Status Bar */}
              <div className="flex items-center justify-between mb-3 pb-2.5 border-b border-gray-200">
                <span className="text-sm sm:text-[15px] font-bold text-gray-800">
                  ເລືອກແຂວງທີ່ລົດຂຶ້ນທະບຽນ (18 ແຂວງ):
                </span>
                {plateProv && (
                  <button
                    type="button"
                    onClick={() => {
                      setPlateProv('');
                      setProvinceModalOpen(false);
                    }}
                    className="text-sm sm:text-[15px] font-bold text-[#B02019] hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <X size={16} /> ລຶບການເລືອກ (ບໍ່ລະບຸແຂວງ)
                  </button>
                )}
              </div>

              {/* Province Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-2.5">
                {laosProvinces.map(p => {
                  const isSelected = plateProv === p;
                  return (
                    <button
                      key={p}
                      type="button"
                      onClick={() => {
                        setPlateProv(p);
                        setProvinceModalOpen(false);
                      }}
                      className={`h-10 sm:h-11 px-3 rounded-none font-bold text-[14px] sm:text-[15px] flex items-center justify-between transition-all duration-150 text-left border cursor-pointer ${
                        isSelected
                          ? 'bg-[#B02019] text-white border-[#B02019] shadow-sm'
                          : 'bg-white hover:bg-[#F9A825] hover:text-black text-gray-900 border-gray-200 shadow-sm hover:border-amber-400 hover:shadow-md'
                      } active:scale-[0.98]`}
                    >
                      <span className="truncate">{p}</span>
                      {isSelected && (
                        <Check size={16} className="shrink-0 text-white ml-1" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="bg-white px-4 sm:px-5 py-3 flex items-center justify-between border-t border-gray-200 shrink-0">
              <div className="text-sm sm:text-[15px] font-bold text-gray-700 truncate">
                ແຂວງທີ່ເລືອກ: <span className="text-black font-extrabold">{plateProv || 'ຍັງບໍ່ໄດ້ເລືອກ'}</span>
              </div>
              {plateProv && (
                <button
                  type="button"
                  onClick={() => {
                    setPlateProv('');
                    setProvinceModalOpen(false);
                  }}
                  className="text-sm sm:text-[15px] font-bold text-[#B02019] hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <X size={16} /> ລຶບການເລືອກ
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── History Selection Modal ── */}
      {historyModalOpen && historyResults.length > 0 && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 animate-fade-in">
          <div
            className="bg-white max-w-2xl w-full shadow-2xl rounded-none border-0 overflow-hidden flex flex-col"
            style={{ borderRadius: 0, border: 'none' }}
          >
            {/* Header */}
            <div
              className="bg-[#545454] px-4 py-3 sm:px-5 sm:py-3.5 flex items-center justify-between text-white rounded-none shrink-0"
              style={{ borderRadius: 0 }}
            >
              <div className="flex items-center gap-2.5">
                <History size={22} className="text-white shrink-0 stroke-[2]" />
                <div>
                  <h3 className="text-base sm:text-[17px] font-bold text-white tracking-wide">
                    ເລືອກລົດຈາກປະຫວັດການຝາກ (History)
                  </h3>
                  <p className="text-xs text-gray-300 font-normal">
                    ພົບ {historyResults.length} ລາຍການທີ່ເຄີຍຝາກ • ກົດເລືອກເພື່ອ Check-in ໄດ້ເລີຍ
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setHistoryModalOpen(false)}
                className="w-8 h-8 rounded-full bg-white hover:bg-gray-100 flex items-center justify-center text-black cursor-pointer shadow-sm active:scale-95 transition-all shrink-0"
                title="ປິດ"
              >
                <X size={18} className="text-black stroke-[2.5]" />
              </button>
            </div>

            {/* Top Red Stripe */}
            <div className="h-[2.5px] bg-[#B02019] w-full shrink-0" />

            {/* Body: List of matching history items */}
            <div className="p-3.5 sm:p-4 bg-gray-50 max-h-[60vh] overflow-y-auto flex flex-col gap-2.5">
              {historyResults.map((t, idx) => {
                const vType = t.vehicleType?.label || types.find(x => x.id === t.vehicleTypeId)?.label || 'ລົດ';
                const plateText = [t.plateProvince, t.plateLetters, t.plateNumber].filter(Boolean).join(' ') || 'ລົດບໍ່ມີປ້າຍ';
                const checkoutTime = t.checkOutAt
                  ? new Date(t.checkOutAt).toLocaleString('lo-LA', { dateStyle: 'short', timeStyle: 'short' })
                  : (t.checkInAt ? new Date(t.checkInAt).toLocaleString('lo-LA', { dateStyle: 'short', timeStyle: 'short' }) : '-');

                return (
                  <div
                    key={t.id || `hist-${idx}`}
                    onClick={() => selectHistoryTicket(t)}
                    className="bg-white border-2 border-gray-200 hover:border-[#F9A825] p-3 sm:p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 cursor-pointer transition-all hover:bg-amber-50/40 rounded-none shadow-xs group"
                    style={{ borderRadius: 0 }}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-full bg-amber-50 border border-amber-200 flex items-center justify-center text-[#F9A825] shrink-0 group-hover:scale-105 transition-transform">
                        <Car size={24} />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-base sm:text-[17px] font-black text-black">
                            {plateText}
                          </span>
                          <span className="text-xs bg-amber-100 text-amber-900 font-bold px-2 py-0.5 rounded-none border border-amber-200">
                            {vType}
                          </span>
                        </div>
                        <p className="text-xs text-gray-500 font-bold mt-0.5">
                          Ticket: #{t.ticketNumber} • ອອກວັນທີ: {checkoutTime}
                        </p>
                        {t.notes && (
                          <p className="text-xs text-gray-600 font-normal mt-0.5">
                            ໝາຍເຫດ: {t.notes}
                          </p>
                        )}
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        selectHistoryTicket(t);
                      }}
                      className="bg-[#F9A825] hover:bg-[#e69510] text-black font-bold px-4 py-2 text-xs sm:text-sm rounded-none shrink-0 shadow-xs active:scale-95 cursor-pointer self-end sm:self-center"
                      style={{ borderRadius: 0 }}
                    >
                      ເລືອກຄັນນີ້
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
