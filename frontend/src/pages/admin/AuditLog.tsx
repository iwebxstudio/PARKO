// PARKO — Audit Log / ບັນທຶກການເຄື່ອນໄຫວ (Admin)
import React, { useState, useEffect, useRef } from 'react';
import { ClipboardList, Trash2, AlertTriangle, RefreshCw, Filter, ChevronDown, Check } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../api/client';

export default function AuditLog() {
  const [logs, setLogs] = useState<any[]>([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(1);
  const [filter, setFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);
  const [filterOpen, setFilterOpen] = useState(false);
  const filterRef = useRef<HTMLDivElement>(null);

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

  // Close filter dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (filterRef.current && !filterRef.current.contains(event.target as Node)) {
        setFilterOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const maxPageButtons = isMobile ? 4 : 9;

  const categoryOptions = [
    { id: '', label: 'ທັງໝົດ' },
    { id: 'Parking', label: 'Parking' },
    { id: 'Users', label: 'Users' },
    { id: 'LostTicket', label: 'LostTicket' },
    { id: 'Pricing', label: 'Pricing' },
    { id: 'Settings', label: 'Settings' },
  ];

  const selectedOption = categoryOptions.find(opt => opt.id === filter) || categoryOptions[0];

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await api.get(`/audit?page=${page}&limit=12${filter ? `&entityType=${filter}` : ''}`);
      const r = data.data || data;
      setLogs(r.logs || []);
      setTotal(r.pagination?.totalPages || 1);
    } catch {
      toast.error('ໂຫຼດຂໍ້ມູນ Audit Log ບໍ່ສຳເລັດ');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [page, filter]);

  const handleDeleteOld = async () => {
    if (!confirm('ຢືນຢັນການລຶບ Audit Log ທີ່ເກົ່າກວ່າ 3 ເດືອນ? (ການກະທຳນີ້ບໍ່ສາມາດແກ້ໄຂໄດ້)')) return;
    setIsDeleting(true);
    try {
      const res = await api.delete('/audit/old?months=3');
      const count = res.data?.data?.deletedCount || res.data?.deletedCount || 0;
      toast.success(`ລຶບຂໍ້ມູນສຳເລັດແລ້ວ ${count} ລາຍການ`);
      setPage(1);
      load();
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'ລຶບຂໍ້ມູນບໍ່ສຳເລັດ');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleDeleteAll = async () => {
    if (!confirm('⚠️ ຄຳເຕືອນ! ຢືນຢັນການລຶບ Audit Log *ທັງໝົດ* ບໍ? (ການກະທຳນີ້ບໍ່ສາມາດແກ້ໄຂໄດ້ແລະຂໍ້ມູນຈະຫາຍໄປທັງໝົດ)')) return;
    setIsDeleting(true);
    try {
      const res = await api.delete('/audit/all');
      const count = res.data?.data?.deletedCount || res.data?.deletedCount || 0;
      toast.success(`ລຶບຂໍ້ມູນທັງໝົດສຳເລັດແລ້ວ ${count} ລາຍການ`);
      setPage(1);
      load();
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'ລຶບຂໍ້ມູນບໍ່ສຳເລັດ');
    } finally {
      setIsDeleting(false);
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
      const hours = String(d.getHours()).padStart(2, '0');
      const minutes = String(d.getMinutes()).padStart(2, '0');
      const seconds = String(d.getSeconds()).padStart(2, '0');
      return `${hours}:${minutes}:${seconds}`;
    } catch {
      return dateStr;
    }
  };

  const formatIpAddress = (ip?: string) => {
    if (!ip) return '-';
    let clean = ip.replace(/^::ffff:/i, '').trim();
    if (clean === '::1' || clean === 'localhost' || /^172\.(1[6-9]|2[0-9]|3[0-1])\.\d+\.\d+$/.test(clean)) {
      return '127.0.0.1';
    }
    return clean;
  };

  const getVisiblePages = () => {
    if (total <= maxPageButtons) {
      return Array.from({ length: total }, (_, i) => i + 1);
    }
    let start = Math.max(1, page - Math.floor(maxPageButtons / 2));
    let end = Math.min(total, start + maxPageButtons - 1);
    if (end - start + 1 < maxPageButtons) {
      start = Math.max(1, end - maxPageButtons + 1);
    }
    return Array.from({ length: end - start + 1 }, (_, i) => start + i);
  };

  const visiblePages = getVisiblePages();

  return (
    <div className="font-sans w-full flex flex-col pb-6">
      {/* Main Container Card */}
      <div
        className="shadow-[0_12px_36px_rgba(0,0,0,0.22),0_4px_14px_rgba(0,0,0,0.12)] rounded-none overflow-hidden bg-[#FFFAEE] w-full border-0 flex flex-col"
        style={{ borderRadius: 0 }}
      >
        {/* Top Header Bar — Dark Gray (#5D5D5D) */}
        <div
          className="bg-[#5D5D5D] px-3 py-2.5 md:py-0 min-h-[60px] md:h-16 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-2.5 md:gap-3 rounded-none shrink-0"
          style={{ borderRadius: 0 }}
        >
          {/* Top Row on Mobile / Left Section on Desktop: Icon + Title + Mobile Refresh button */}
          <div className="flex items-center justify-between w-full md:w-auto h-10 shrink-0">
            <div className="flex items-center gap-2.5">
              <ClipboardList size={20} className="w-5 h-5 text-white shrink-0" />
              <h1 className="text-base md:text-[17px] font-bold text-white tracking-normal whitespace-nowrap">
                Audit Log 
              </h1>
            </div>

            {/* Mobile-Only Refresh Button */}
            <button
              type="button"
              onClick={load}
              disabled={loading}
              className="md:hidden h-10 px-3 bg-white hover:bg-gray-100 text-black font-bold flex items-center justify-center gap-1.5 shadow-sm rounded-none border-0 cursor-pointer"
              style={{ borderRadius: 0 }}
            >
              <RefreshCw size={16} className={`text-black shrink-0 ${loading ? 'animate-spin' : ''}`} />
              <span className="text-xs">Refresh</span>
            </button>
          </div>

          {/* Controls on Mobile: Filter + Delete Buttons */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center md:justify-end md:ml-auto gap-2 md:gap-2.5 w-full md:w-auto shrink-0">
            {/* Category Filter Dropdown (matching Members.tsx) */}
            <div ref={filterRef} className="relative w-full sm:w-[150px] md:w-[155px] shrink-0">
              <button
                type="button"
                onClick={() => setFilterOpen((prev) => !prev)}
                className="w-full h-10 bg-white shadow-sm flex items-center justify-between gap-1.5 px-3 transition-colors cursor-pointer select-none border-0 outline-none rounded-none hover:bg-gray-50 active:bg-gray-100"
                style={{ borderRadius: 0 }}
              >
                <div className="flex items-center gap-1.5 min-w-0 flex-1 overflow-hidden">
                  <Filter size={17} className="text-[#F9A825] shrink-0" />
                  <span className="text-gray-800 font-bold text-base md:text-[17px] truncate">
                    {selectedOption.label}
                  </span>
                </div>
                <ChevronDown
                  size={16}
                  className={`text-gray-500 shrink-0 transition-transform duration-200 ${
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
                  {categoryOptions.map((opt) => {
                    const isSelected = filter === opt.id;
                    return (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => {
                          setFilter(opt.id);
                          setPage(1);
                          setFilterOpen(false);
                        }}
                        className={`w-full h-10 px-3 flex items-center justify-between gap-2 text-left transition-colors font-bold text-base md:text-[17px] border-0 outline-none rounded-none cursor-pointer ${
                          isSelected
                            ? 'bg-amber-100/70 text-[#B02019]'
                            : 'text-gray-800 hover:bg-amber-50 hover:text-[#B02019]'
                        }`}
                        style={{ borderRadius: 0 }}
                      >
                        <span className="truncate">{opt.label}</span>
                        {isSelected && <Check size={16} className="text-[#B02019] shrink-0" />}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Action Buttons: 2 columns on mobile, flex on sm+ */}
            <div className="grid grid-cols-2 sm:flex items-center gap-2 w-full sm:w-auto shrink-0">
              {/* Delete old (> 3 months) */}
              <button
                type="button"
                onClick={handleDeleteOld}
                disabled={isDeleting}
                className="bg-amber-600 hover:bg-amber-700 active:bg-amber-800 text-white font-bold h-10 px-2.5 sm:px-3.5 flex items-center justify-center gap-1 sm:gap-1.5 text-xs sm:text-sm md:text-[16px] transition-colors shadow-sm rounded-none border-0 outline-none cursor-pointer disabled:opacity-50 shrink-0"
                style={{ borderRadius: 0 }}
              >
                <Trash2 size={16} className="text-white shrink-0" />
                <span className="whitespace-nowrap">ລຶບເກົ່າກວ່າ 3 ເດືອນ</span>
              </button>

              {/* Delete all */}
              <button
                type="button"
                onClick={handleDeleteAll}
                disabled={isDeleting}
                className="bg-[#B02019] hover:bg-[#961b15] active:bg-[#7e140f] text-white font-bold h-10 px-2.5 sm:px-3.5 flex items-center justify-center gap-1 sm:gap-1.5 text-xs sm:text-sm md:text-[16px] transition-colors shadow-sm rounded-none border-0 outline-none cursor-pointer disabled:opacity-50 shrink-0"
                style={{ borderRadius: 0 }}
              >
                <AlertTriangle size={16} className="text-white shrink-0" />
                <span className="whitespace-nowrap">ລຶບທັງໝົດ</span>
              </button>
            </div>

            {/* Desktop-Only Refresh Button */}
            <button
              type="button"
              onClick={load}
              disabled={loading}
              className="hidden md:flex bg-white hover:bg-gray-100 active:bg-gray-200 text-black font-bold h-10 px-3.5 items-center justify-center gap-1.5 text-base md:text-[16px] transition-colors shadow-sm rounded-none border-0 outline-none cursor-pointer shrink-0"
              style={{ borderRadius: 0 }}
            >
              <RefreshCw size={17} className={`text-black shrink-0 ${loading ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>
          </div>
        </div>

        {/* Top Red Stripe Divider */}
        <div className="h-[2.5px] bg-[#B02019] w-full shrink-0" />

        {/* Table Content (matching Users.tsx) */}
        <div className="overflow-x-auto no-scrollbar">
          <table className="w-full text-center border-collapse">
            <thead>
              <tr
                className="bg-gradient-to-r from-[#4C4C4C] via-[#6E6E6E] to-[#A8A8A8] text-white text-base md:text-[17px] font-bold h-16"
                style={{ background: 'linear-gradient(90deg, #4C4C4C 0%, #6E6E6E 50%, #A8A8A8 100%)' }}
              >
                <th className="px-5 border-r border-white/30 text-base md:text-[17px] font-bold align-middle text-center whitespace-nowrap">
                  ວັນທີ
                </th>
                <th className="px-5 border-r border-white/30 text-base md:text-[17px] font-bold align-middle text-center whitespace-nowrap">
                  ເວລາ
                </th>
                <th className="px-6 border-r border-white/30 text-base md:text-[17px] font-bold align-middle text-left whitespace-nowrap">
                  ຜູ້ໃຊ້ (User)
                </th>
                <th className="px-6 border-r border-white/30 text-base md:text-[17px] font-bold align-middle text-center whitespace-nowrap">
                  ການກະທຳ (Action)
                </th>
                <th className="px-6 text-base md:text-[17px] font-bold align-middle text-right whitespace-nowrap">
                  IP Address
                </th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr className="h-16">
                  <td colSpan={5} className="py-12 text-center text-gray-800 bg-[#FFFAEE] text-base md:text-[17px] align-middle">
                    <RefreshCw size={32} className="animate-spin text-[#F9A825] mx-auto mb-2" />
                    <p className="font-bold text-base md:text-[17px]">ກຳລັງໂຫຼດຂໍ້ມູນ Audit Log...</p>
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr className="h-16">
                  <td colSpan={5} className="py-12 text-center text-gray-500 font-bold bg-[#FFFAEE] text-base md:text-[17px] align-middle">
                    ບໍ່ມີຂໍ້ມູນ Audit Log
                  </td>
                </tr>
              ) : (
                logs.map((l, idx) => {
                  const isEvenRow = idx % 2 === 1;
                  const rowBg = isEvenRow ? 'bg-[#FFFAEE]' : 'bg-[#FDF1D7]';
                  const borderClass = isEvenRow ? 'border-r border-gray-200' : 'border-r border-[#EADFC7]';

                  return (
                    <tr
                      key={l.id}
                      className={`${rowBg} hover:bg-[#EAD0A0] transition-colors duration-150 text-base md:text-[17px] font-bold text-gray-800 h-14 cursor-default`}
                    >
                      {/* Column 1: Date */}
                      <td className={`px-5 ${borderClass} text-gray-800 whitespace-nowrap text-base md:text-[17px] font-bold align-middle text-center`}>
                        {formatDate(l.createdAt)}
                      </td>

                      {/* Column 2: Time */}
                      <td className={`px-5 ${borderClass} text-gray-800 whitespace-nowrap text-base md:text-[17px] font-bold align-middle text-center`}>
                        {formatTime(l.createdAt)}
                      </td>

                      {/* Column 3: User */}
                      <td className={`px-6 ${borderClass} text-gray-800 whitespace-nowrap text-base md:text-[17px] font-bold align-middle text-left`}>
                        {l.user?.displayName || l.user?.username || 'System'}
                      </td>

                      {/* Column 4: Action */}
                      <td className={`px-6 ${borderClass} text-[#B02019] whitespace-nowrap text-base md:text-[17px] font-bold align-middle text-center`}>
                        {l.action}
                      </td>

                      {/* Column 5: IP Address */}
                      <td className="px-6 text-gray-800 whitespace-nowrap text-base md:text-[17px] font-bold align-middle text-right">
                        {formatIpAddress(l.ipAddress)}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Bottom Red Stripe Divider */}
        <div className="h-[2.5px] bg-[#B02019] w-full shrink-0" />

        {/* Bottom Footer Bar — Dark Gray (matching CheckOut footer) */}
        <div
          className="bg-[#5D5D5D] px-3 py-3 md:py-0 min-h-[60px] md:h-16 flex flex-col sm:flex-row items-center justify-between gap-3 rounded-none shrink-0"
          style={{ borderRadius: 0 }}
        >
          {/* Left: Total Count Badge (Square w-10 h-10) */}
          <div className="flex items-center gap-2 text-white font-bold text-base md:text-[17px]">
            <span>ຈຳນວນ</span>
            <span
              className="bg-[#B02019] text-white h-10 min-w-10 px-2 flex items-center justify-center text-base md:text-[17px] font-bold shadow-sm rounded-none border-0 shrink-0 text-center"
              style={{ borderRadius: 0 }}
            >
              {logs.length}
            </span>
            <span>ລາຍການ</span>
          </div>

          {/* Right: Pagination Controls */}
          <div className="flex items-center gap-1.5 sm:gap-2 max-w-full overflow-x-auto no-scrollbar py-1">
            <button
              type="button"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1 || loading}
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
                onClick={() => setPage(p)}
                disabled={loading}
                className={`h-10 w-10 flex items-center justify-center font-bold text-base md:text-[17px] shadow-sm transition-colors text-white rounded-none border-0 outline-none cursor-pointer shrink-0 ${
                  page === p
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
              onClick={() => setPage((p) => Math.min(total, p + 1))}
              disabled={page >= total || loading || total === 0}
              className="bg-[#B02019] hover:bg-[#961b15] text-white font-bold h-10 px-4 sm:w-24 flex items-center justify-center text-base md:text-[17px] transition-colors shadow-sm rounded-none border-0 outline-none disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer shrink-0"
              style={{ borderRadius: 0 }}
            >
              ໄປໜ້າ
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
