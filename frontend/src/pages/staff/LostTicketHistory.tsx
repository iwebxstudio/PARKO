// ============================================
// PARKO — ໜ້າປະຫວັດການແຈ້ງປີ້ລົດເສຍ (Lost Ticket History Page)
// ໜ້າທີ່: ສະແດງລາຍການປະຫວັດກໍລະນີປີ້ລົດເສຍທັງໝົດ, ຄົ້ນຫາຕາມປ້າຍລົດ ຫຼື ລະຫັດປີ້, ເບິ່ງຫຼັກຖານຮູບພາບ, ແກ້ໄຂສະຖານະ ແລະ ລຶບຂໍ້ມູນ (ສຳລັບ Admin)
// ============================================
import React, { useState, useEffect, useCallback } from 'react';
import {
  FileWarning, Search, X, Eye, Trash2, CheckCircle2,
  AlertCircle, RefreshCw, ZoomIn, Clock, User, Car, ShieldAlert,
  CameraOff, ChevronLeft, ChevronRight, FileText
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../api/client';
import { useAuth } from '../../contexts/AuthContext';

interface TableColumnDef {
  key: string;
  label: string;
  align?: 'left' | 'center' | 'right';
  minWidth?: string;
}

const TABLE_COLUMNS: TableColumnDef[] = [
  { key: 'index', label: 'ລ/ດ', align: 'center', minWidth: 'min-w-[56px]' },
  { key: 'ticketId', label: 'Ticket ID', align: 'left', minWidth: 'min-w-[120px]' },
  { key: 'plateNumber', label: 'ທະບຽນລົດ', align: 'left', minWidth: 'min-w-[170px]' },
  { key: 'vehicleType', label: 'ປະເພດລົດ', align: 'center', minWidth: 'min-w-[110px]' },
  { key: 'photo', label: 'ຮູບພາບ', align: 'center', minWidth: 'min-w-[100px]' },
  { key: 'createdAt', label: 'ວັນທີບັນທຶກ', align: 'left', minWidth: 'min-w-[160px]' },
  { key: 'penaltyAmount', label: 'ຄ່າປັບໃໝ', align: 'right', minWidth: 'min-w-[140px]' },
  { key: 'staff', label: 'ຜູ້ບັນທຶກ', align: 'left', minWidth: 'min-w-[130px]' },
  { key: 'status', label: 'ສະຖານະ', align: 'center', minWidth: 'min-w-[146px]' },
  { key: 'actions', label: 'ຈັດການ', align: 'center', minWidth: 'min-w-[90px]' },
];

interface LostTicketCaseItem {
  id: string;
  ticketId: string;
  staffId: string;
  vehiclePhotoUrl?: string | null;
  driverPhotoUrl?: string | null;
  idCardPhotoUrl?: string | null;
  notes: string;
  resolution: 'PENDING' | 'RESOLVED' | 'REJECTED';
  penaltyAmount: number;
  resolvedAt?: string | null;
  resolvedById?: string | null;
  createdAt: string;
  updatedAt: string;
  ticket?: {
    id: string;
    ticketNumber: string;
    plateNumber?: string | null;
    plateLetters?: string | null;
    plateProvince?: string | null;
    checkInAt: string;
    status: string;
    vehicleType?: {
      id: number;
      label: string;
      name: string;
    } | null;
  } | null;
  staff?: {
    id: string;
    displayName: string;
    username: string;
  } | null;
  resolvedBy?: {
    id: string;
    displayName: string;
    username: string;
  } | null;
}

export default function LostTicketHistory() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'ADMIN';

  const [cases, setCases] = useState<LostTicketCaseItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  interface LightboxState {
    photos: { key: string; label: string; url: string }[];
    index: number;
    caseTitle: string;
  }

  // ສະຖານະການເປີດໜ້າຕ່າງປັອບອັບຕ່າງໆ (Modals State)
  const [selectedCase, setSelectedCase] = useState<LostTicketCaseItem | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<LostTicketCaseItem | null>(null);
  const [lightbox, setLightbox] = useState<LightboxState | null>(null);
  const [resolving, setResolving] = useState(false);

  const openLightbox = useCallback(
    (photos: { key: string; label: string; url: string }[], initialIndex = 0, caseTitle = '') => {
      if (!photos || photos.length === 0) return;
      setLightbox({
        photos,
        index: Math.max(0, Math.min(initialIndex, photos.length - 1)),
        caseTitle,
      });
    },
    []
  );

  const nextLightboxPhoto = useCallback(() => {
    setLightbox((prev) =>
      prev && prev.photos.length > 0
        ? { ...prev, index: (prev.index + 1) % prev.photos.length }
        : null
    );
  }, []);

  const prevLightboxPhoto = useCallback(() => {
    setLightbox((prev) =>
      prev && prev.photos.length > 0
        ? { ...prev, index: (prev.index - 1 + prev.photos.length) % prev.photos.length }
        : null
    );
  }, []);

  // ລະບົບຄວບຄຸມການເລື່ອນເບິ່ງຮູບພາບຜ່ານແປ້ນພິມ (Keyboard Navigation)
  useEffect(() => {
    if (!lightbox) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setLightbox(null);
      } else if (e.key === 'ArrowRight') {
        nextLightboxPhoto();
      } else if (e.key === 'ArrowLeft') {
        prevLightboxPhoto();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [lightbox, nextLightboxPhoto, prevLightboxPhoto]);

  const ITEMS_PER_PAGE = 8;
  const API_URL = import.meta.env.VITE_API_URL?.replace('/api', '') || '';

  // ລະບົບຄວາມປອດໄພ: ກວດສອບ ແລະ ປັບແຕ່ງ URL ຂອງຮູບພາບໃຫ້ປອດໄພ (Sanitized Photo URL Resolver)
  const getPhotoSrc = useCallback((url?: string | null): string => {
    if (!url || typeof url !== 'string') return '';
    const trimmed = url.trim();
    // ປ້ອງກັນການໂຈມຕີແບບ XSS ແລະ ໂປຣໂຕຄອນທີ່ເປັນອັນຕະລາຍ
    if (/^(javascript|vbscript|data:(?!image\/)):/i.test(trimmed)) {
      return '';
    }
    if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
      return trimmed;
    }
    const cleanBase = API_URL.replace(/\/+$/, '');
    const cleanPath = trimmed.startsWith('/') ? trimmed : `/${trimmed}`;
    return `${cleanBase}${cleanPath}`;
  }, [API_URL]);

  // ດຶງລາຍການຮູບພາບຫຼັກຖານທັງໝົດທີ່ບັນທຶກໄວ້ໃນ Case ນີ້
  const getCasePhotos = useCallback((c: LostTicketCaseItem) => {
    const list: { key: string; label: string; url: string }[] = [];
    if (c.driverPhotoUrl) {
      list.push({ key: 'driver', label: 'ຮູບໜ້າເຈົ້າຂອງລົດ / ຜູ້ມາຮັບ', url: getPhotoSrc(c.driverPhotoUrl) });
    }
    if (c.idCardPhotoUrl) {
      list.push({ key: 'idCard', label: 'ຮູບໃບບັບຂີ່ / ບັດປະຈຳຕົວ', url: getPhotoSrc(c.idCardPhotoUrl) });
    }
    if (c.vehiclePhotoUrl) {
      list.push({ key: 'vehicle', label: 'ຮູບໜ້າລົດ / ປ້າຍລົດ', url: getPhotoSrc(c.vehiclePhotoUrl) });
    }
    return list;
  }, [getPhotoSrc]);

  const loadData = useCallback(async (page = 1, query = '') => {
    setLoading(true);
    try {
      const { data } = await api.get('/lost-tickets', {
        params: {
          page,
          limit: ITEMS_PER_PAGE,
          search: query.trim() || undefined,
        },
      });
      const payload = data.data || data;
      setCases(payload.cases || []);
      if (payload.pagination) {
        setTotalPages(payload.pagination.totalPages || 1);
        setTotalCount(payload.pagination.total || 0);
        setCurrentPage(payload.pagination.page || 1);
      }
    } catch (e: any) {
      toast.error('ໂຫຼດຂໍ້ມູນປະຫວັດປີ້ເສຍລົ້ມເຫຼວ');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData(currentPage, searchQuery);
  }, [currentPage, loadData]);

  const handleSearchSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!searchQuery.trim()) {
      toast.error('ກະລຸນາໃສ່ Ticket ID ຫຼື ປ້າຍລົດ');
      return;
    }
    setCurrentPage(1);
    loadData(1, searchQuery);
  };

  const handleClearSearch = () => {
    setSearchQuery('');
    setCurrentPage(1);
    loadData(1, '');
  };

  const handleResolveCase = async (caseItem: LostTicketCaseItem) => {
    if (!confirm('ຢືນຢັນການແກ້ໄຂ / ປິດ Case ປີ້ລົດເສຍນີ້?')) return;
    setResolving(true);
    try {
      await api.patch(`/lost-tickets/${caseItem.id}/resolve`, {
        resolution: 'RESOLVED',
        penaltyAmount: Number(caseItem.penaltyAmount) || 0,
      });
      toast.success('ແກ້ໄຂ Case ສຳເລັດແລ້ວ');
      setSelectedCase(null);
      loadData(currentPage, searchQuery);
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'ແກ້ໄຂ Case ບໍ່ສຳເລັດ');
    } finally {
      setResolving(false);
    }
  };

  const handleDeleteCase = async () => {
    if (!deleteConfirm) return;
    const tId = toast.loading('ກຳລັງລຶບຂໍ້ມູນ...');
    try {
      await api.delete(`/lost-tickets/${deleteConfirm.id}`);
      toast.success('ລຶບປະຫວັດປີ້ເສຍສຳເລັດ', { id: tId });
      setDeleteConfirm(null);
      loadData(currentPage, searchQuery);
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'ລຶບບໍ່ສຳເລັດ', { id: tId });
    }
  };

  const formatDate = (isoString?: string | null) => {
    if (!isoString) return '-';
    try {
      const d = new Date(isoString);
      const day = String(d.getDate()).padStart(2, '0');
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const year = d.getFullYear();
      const hours = String(d.getHours()).padStart(2, '0');
      const minutes = String(d.getMinutes()).padStart(2, '0');
      return `${day}/${month}/${year} ${hours}:${minutes}`;
    } catch {
      return isoString;
    }
  };

  const formatKip = (val?: number | string | null) => {
    const num = Number(val) || 0;
    return `${num.toLocaleString()} ກີບ`;
  };

  return (
    <div className="font-sans w-full flex flex-col">
      {/* ບັດບັນຈຸຕາຕະລາງຫຼັກ (Main Container Card) */}
      <div
        className="shadow-[0_12px_36px_rgba(0,0,0,0.22),0_4px_14px_rgba(0,0,0,0.12)] rounded-none overflow-hidden bg-[#FFFAEE] border-0 flex flex-col"
        style={{ borderRadius: 0 }}
      >
        {/* ແຖບຫົວຂໍ້ດ້ານເທິງ — ສີເທົາເຂັ້ມ */}
        <div
          className="bg-[#5D5D5D] px-3 sm:px-4 md:px-6 py-2.5 md:py-0 min-h-[60px] md:h-16 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-2 md:gap-3 rounded-none shrink-0"
          style={{ borderRadius: 0 }}
        >
          {/* ແຖວເທິງໃນຈໍມືຖື / ສ່ວນຊ້າຍໃນຈໍຄອມພິວເຕີ: ໄອຄອນ ແລະ ຫົວຂໍ້ */}
          <div className="flex items-center justify-between w-full md:w-auto h-10 shrink-0">
            <div className="flex items-center gap-2.5">
              <FileWarning className="w-5 h-5 text-white shrink-0" />
              <h1 className="text-base md:text-[17px] font-bold text-white tracking-normal whitespace-nowrap">
                ປະຫວັດປີ້ເສຍ
              </h1>
            </div>
          </div>

          {/* ດ້ານຂວາ: ຊ່ອງປ້ອນຂໍ້ມູນຄົ້ນຫາ */}
          <div className="flex items-center gap-3 justify-end w-full md:w-auto shrink-0">
            <form
              onSubmit={handleSearchSubmit}
              className="flex items-center bg-white shadow-sm w-full md:w-[280px] lg:w-[315px] xl:w-[325px] rounded-l-none rounded-r-full overflow-hidden pl-3 sm:pl-3.5 h-10 min-h-[40px] shrink-0"
            >
              <div className="flex items-center justify-center text-[#F9A825] shrink-0">
                <Search size={18} className="w-[18px] h-[18px] text-[#F9A825]" />
              </div>
              <input
                type="search"
                name="lostTicketSearch"
                autoComplete="off"
                data-lpignore="true"
                placeholder="ຄົ້ນຫາ Ticket ID, ປ້າຍລົດ"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="px-2.5 h-full text-base md:text-[17px] font-bold text-gray-800 placeholder:text-base md:placeholder:text-[17px] placeholder:font-bold placeholder:text-gray-500 focus:outline-none flex-1 min-w-0 bg-transparent [&::-webkit-search-cancel-button]:hidden [&::-webkit-search-decoration]:hidden"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={handleClearSearch}
                  className="px-1.5 text-gray-400 hover:text-gray-600 transition-colors cursor-pointer shrink-0"
                >
                  <X size={16} />
                </button>
              )}
              <button
                type="submit"
                disabled={loading}
                className="bg-[#F9A825] hover:bg-[#e69510] text-black font-bold px-3.5 sm:px-4.5 h-full text-base md:text-[17px] transition-colors rounded-r-full ml-auto flex items-center justify-center cursor-pointer shrink-0 disabled:opacity-50"
              >
                {loading ? <RefreshCw size={16} className="animate-spin text-black" /> : 'ຄົ້ນຫາ'}
              </button>
            </form>
          </div>
        </div>

        {/* ເສັ້ນແບ່ງແຖບສີແດງດ້ານເທິງ */}
        <div className="h-[2.5px] bg-[#B02019] w-full" />

        {/* ຕາຕະລາງເນື້ອໃນຂໍ້ມູນປະຫວັດປີ້ເສຍ */}
        <div className="overflow-x-auto table-responsive-scrollbar">
          <table className="w-full min-w-max text-center border-collapse">
            <thead>
              <tr
                className="bg-gradient-to-r from-[#4C4C4C] via-[#6E6E6E] to-[#A8A8A8] text-white text-base md:text-[17px] font-bold h-16 whitespace-nowrap select-none"
                style={{ background: 'linear-gradient(90deg, #4C4C4C 0%, #6E6E6E 50%, #A8A8A8 100%)' }}
              >
                {TABLE_COLUMNS.map((col, cIdx) => {
                  const isLast = cIdx === TABLE_COLUMNS.length - 1;
                  const alignClass =
                    col.align === 'left' ? 'text-left' : col.align === 'right' ? 'text-right' : 'text-center';
                  return (
                    <th
                      key={col.key}
                      className={`px-5 ${!isLast ? 'border-r border-white/30' : ''} ${col.minWidth || ''} text-base md:text-[17px] font-bold align-middle ${alignClass} whitespace-nowrap`}
                    >
                      {col.label}
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr className="h-24">
                  <td colSpan={TABLE_COLUMNS.length} className="py-12 text-center text-gray-800 font-bold bg-[#FFFAEE] text-base md:text-[17px] align-middle">
                    <div className="flex items-center justify-center gap-2">
                      <RefreshCw size={20} className="animate-spin text-[#F9A825]" />
                      <span>ກຳລັງໂຫຼດຂໍ້ມູນປະຫວັດປີ້ເສຍ...</span>
                    </div>
                  </td>
                </tr>
              ) : cases.length === 0 ? (
                <tr className="h-24">
                  <td colSpan={TABLE_COLUMNS.length} className="py-12 text-center text-gray-600 font-bold bg-[#FFFAEE] text-base md:text-[17px] align-middle">
                    ບໍ່ມີຂໍ້ມູນປະຫວັດປີ້ເສຍ
                  </td>
                </tr>
              ) : (
                cases.map((c, idx) => {
                  const rowNumber = String((currentPage - 1) * ITEMS_PER_PAGE + idx + 1).padStart(2, '0');
                  const borderClass = 'border-r border-[#EADFC7]';
                  const cellTextClass = 'text-base md:text-[17px] font-bold text-gray-800 align-middle whitespace-nowrap';

                  const plateStr = c.ticket
                    ? [c.ticket.plateProvince, c.ticket.plateLetters, c.ticket.plateNumber].filter(Boolean).join(' ') || 'ລົດບໍ່ມີປ້າຍ'
                    : '-';

                  const casePhotos = getCasePhotos(c);

                  return (
                    <tr
                      key={c.id}
                      className="bg-[#FFFAEE] hover:bg-[#F3EAD3] border-b border-[#EADFC7]/70 transition-colors duration-150 text-base md:text-[17px] font-bold text-gray-800 h-14 cursor-default whitespace-nowrap"
                    >
                      {/* ຖັນ 1: ລ/ດ */}
                      <td className={`px-3.5 ${borderClass} ${cellTextClass} text-center`}>
                        {rowNumber}
                      </td>

                      {/* ຖັນ 2: Ticket ID */}
                      <td className={`px-5 ${borderClass} ${cellTextClass} text-left`}>
                        {c.ticket?.ticketNumber || '-'}
                      </td>

                      {/* ຖັນ 3: ທະບຽນລົດ */}
                      <td className={`px-5 ${borderClass} ${cellTextClass} text-left`}>
                        {plateStr}
                      </td>

                      {/* ຖັນ 4: ປະເພດລົດ */}
                      <td className={`px-5 ${borderClass} ${cellTextClass} text-center`}>
                        {c.ticket?.vehicleType?.label || '-'}
                      </td>

                      {/* ຖັນ 5: ຮູບພາບຫຼັກຖານທີ່ບັນທຶກໄວ້ */}
                      <td className={`px-4 ${borderClass} align-middle text-center whitespace-nowrap`}>
                        {casePhotos.length > 0 ? (
                          <div className="flex items-center justify-center">
                            <button
                              type="button"
                              onClick={() =>
                                openLightbox(
                                  casePhotos,
                                  0,
                                  `Ticket #${c.ticket?.ticketNumber || c.id}`
                                )
                              }
                              className="group relative inline-flex items-center justify-center p-0 bg-transparent border-0 outline-none shadow-none cursor-pointer hover:opacity-90 active:scale-95 transition-all"
                              title="ຄລິກເພື່ອເບິ່ງຮູບພາບທັງໝົດ"
                            >
                              <div
                                className="w-10 h-10 overflow-hidden flex items-center justify-center relative rounded-none"
                                style={{ borderRadius: 0 }}
                              >
                                <img
                                  src={casePhotos[0].url}
                                  alt={casePhotos[0].label}
                                  loading="lazy"
                                  decoding="async"
                                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-200 rounded-none"
                                  style={{ borderRadius: 0 }}
                                  onError={(e) => {
                                    (e.currentTarget as HTMLElement).style.display = 'none';
                                  }}
                                />
                                <div
                                  className="absolute inset-0 bg-black/25 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-white rounded-none"
                                  style={{ borderRadius: 0 }}
                                >
                                  <ZoomIn size={15} />
                                </div>
                              </div>
                            </button>
                          </div>
                        ) : (
                          <span className="text-gray-400 font-bold text-base md:text-[17px]">-</span>
                        )}
                      </td>

                      {/* ຖັນ 6: ວັນທີບັນທຶກ */}
                      <td className={`px-5 ${borderClass} ${cellTextClass} text-left`}>
                        {formatDate(c.createdAt)}
                      </td>

                      {/* ຖັນ 7: ຄ່າປັບໃໝ */}
                      <td className={`px-5 ${borderClass} ${cellTextClass} text-right`}>
                        {formatKip(c.penaltyAmount)}
                      </td>

                      {/* ຖັນ 8: ຜູ້ບັນທຶກ */}
                      <td className={`px-5 ${borderClass} ${cellTextClass} text-left`}>
                        {c.staff?.displayName || c.staff?.username || '-'}
                      </td>

                      {/* ຖັນ 9: ສະຖານະ */}
                      <td className={`px-5 ${borderClass} align-middle text-center whitespace-nowrap`}>
                        <button
                          type="button"
                          onClick={() => setSelectedCase(c)}
                          className={`inline-flex items-center justify-center w-[124px] h-[34px] rounded-full text-base md:text-[17px] font-bold text-white shadow-sm transition-all active:scale-95 cursor-pointer border-0 outline-none select-none ${
                            c.resolution === 'RESOLVED'
                              ? 'bg-[#088395] hover:bg-[#077282]'
                              : 'bg-[#B02019] hover:bg-[#961b15]'
                          }`}
                          title={
                            c.resolution === 'RESOLVED'
                              ? 'ແກ້ໄຂແລ້ວ (ຄລິກເພື່ອເບິ່ງລາຍລະອຽດ)'
                              : 'ຍັງບໍ່ແກ້ໄຂ (ຄລິກເພື່ອຈັດການ / ປິດ Case)'
                          }
                        >
                          {c.resolution === 'RESOLVED' ? 'ແກ້ໄຂແລ້ວ' : 'ຍັງບໍ່ແກ້ໄຂ'}
                        </button>
                      </td>

                      {/* ຖັນ 10: ປຸ່ມຄຳສັ່ງຈັດການ */}
                      <td className="px-5 align-middle text-center whitespace-nowrap">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            type="button"
                            onClick={() => setSelectedCase(c)}
                            title="ເບິ່ງຫຼັກຖານ & ລາຍລະອຽດ"
                            className="w-9 h-9 rounded flex items-center justify-center bg-[#F9A825] hover:bg-[#e0921a] text-white shadow-sm transition-all active:scale-95 cursor-pointer"
                          >
                            <Eye size={19} className="text-white" />
                          </button>
                          {isAdmin && (
                            <button
                              type="button"
                              onClick={() => setDeleteConfirm(c)}
                              title="ລຶບ"
                              className="w-9 h-9 rounded flex items-center justify-center bg-[#B02019] hover:bg-[#961b15] text-white shadow-sm transition-all active:scale-95 cursor-pointer"
                            >
                              <Trash2 size={18} className="text-white" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* ເສັ້ນແບ່ງແຖບສີແດງດ້ານລຸ່ມ */}
        <div className="h-[2.5px] bg-[#B02019] w-full" />

        {/* ແຖບທ້າຍລຸ່ມສຸດ — ສ່ວນຄວບຄຸມການປ່ຽນໜ້າ (Pagination Bar) */}
        <div
          className="bg-[#5D5D5D] px-3 sm:px-4 md:px-6 py-3 md:py-0 min-h-[60px] md:h-16 flex flex-col sm:flex-row items-center justify-between gap-3 rounded-none shrink-0"
          style={{ borderRadius: 0 }}
        >
          {/* ດ້ານຊ້າຍ: ຈຳນວນລາຍການທັງໝົດ */}
          <div className="flex items-center gap-2 text-white font-bold text-base md:text-[17px]">
            <span>ຈຳນວນ</span>
            <span
              className="bg-[#B02019] text-white h-10 min-w-[40px] px-3.5 flex items-center justify-center text-base md:text-[17px] font-bold shadow-sm rounded-none border-0 shrink-0 text-center"
              style={{ borderRadius: 0 }}
            >
              {totalCount}
            </span>
            <span>ລາຍການ</span>
          </div>

          {/* ດ້ານຂວາ: ປຸ່ມຄວບຄຸມການປ່ຽນໜ້າ (Pagination Controls) */}
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

            {Array.from({ length: totalPages }, (_, i) => i + 1)
              .filter((page) => {
                let start = Math.max(1, currentPage - 2);
                let end = Math.min(totalPages, start + 4);
                if (end - start < 4) start = Math.max(1, end - 4);
                return page >= start && page <= end;
              })
              .map((page) => (
                <button
                  key={page}
                  type="button"
                  onClick={() => setCurrentPage(page)}
                  disabled={loading}
                  className={`h-10 w-10 flex items-center justify-center font-bold text-base md:text-[17px] shadow-sm transition-colors text-white rounded-none border-0 outline-none cursor-pointer shrink-0 ${
                    currentPage === page
                      ? 'bg-[#B02019]'
                      : 'bg-[#B02019] hover:bg-[#961b15]'
                  }`}
                  style={{ borderRadius: 0 }}
                >
                  {page}
                </button>
              ))}

            <button
              type="button"
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage >= totalPages || totalPages === 0 || loading}
              className="bg-[#B02019] hover:bg-[#961b15] text-white font-bold h-10 px-4 sm:w-24 flex items-center justify-center text-base md:text-[17px] transition-colors shadow-sm rounded-none border-0 outline-none disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer shrink-0"
              style={{ borderRadius: 0 }}
            >
              ໄປໜ້າ
            </button>
          </div>
        </div>
      </div>

      {/* ໜ້າຕ່າງປັອບອັບເບິ່ງລາຍລະອຽດ ແລະ ຫຼັກຖານ (Detail & Evidence Modal) */}
      {selectedCase && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-3 sm:p-4 animate-fade-in">
          <div
            className="bg-[#FFFDF7] w-full max-w-4xl shadow-2xl rounded-none overflow-hidden flex flex-col max-h-[92vh]"
            style={{ borderRadius: 0 }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* ສ່ວນຫົວຂອງໜ້າຕ່າງປັອບອັບ */}
            <div className="bg-[#5D5D5D] px-4 sm:px-6 h-14 sm:h-16 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2.5">
                <FileText className="w-5 h-5 text-white" />
                <h2 className="text-base sm:text-[18px] font-bold text-white tracking-normal">
                  ລາຍລະອຽດ & ຫຼັກຖານປີ້ເສຍ
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setSelectedCase(null)}
                className="w-8 h-8 rounded-full bg-white flex items-center justify-center text-[#5D5D5D] hover:bg-gray-100 shadow transition-transform active:scale-95 cursor-pointer"
                title="ປິດ"
              >
                <X size={18} />
              </button>
            </div>

            {/* ເສັ້ນແບ່ງແຖບສີແດງ */}
            <div className="h-[2.5px] bg-[#B02019] w-full shrink-0" />

            {/* ເນື້ອໃນຂອງໜ້າຕ່າງ (ສາມາດເລື່ອນຂຶ້ນ-ລົງໄດ້) */}
            <div className="p-4 sm:p-6 overflow-y-auto space-y-4">
              {/* ກ່ອງສະຫຼຸບຂໍ້ມູນປີ້ເສຍ — ແບ່ງສອງຝັ່ງດ້ວຍເສັ້ນແບ່ງກາງ */}
              <div className="bg-[#FDF1D7] border-2 border-[#5D5D5D] p-4 sm:p-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-0 md:divide-x-2 md:divide-[#5D5D5D]">
                  {/* ຖັນດ້ານຊ້າຍ */}
                  <div className="space-y-2.5 sm:space-y-3 md:pr-6 text-sm sm:text-base md:text-[17px] font-bold text-black">
                    <div className="flex items-baseline">
                      <span className="whitespace-nowrap">Ticket ID : </span>
                      <span className="ml-2 font-bold text-black">{selectedCase.ticket?.ticketNumber || '-'}</span>
                    </div>
                    <div className="flex items-baseline">
                      <span className="whitespace-nowrap">ທະບຽນລົດ : </span>
                      <span className="ml-2 font-bold text-black">
                        {[
                          selectedCase.ticket?.plateProvince,
                          selectedCase.ticket?.plateLetters,
                          selectedCase.ticket?.plateNumber,
                        ].filter(Boolean).join(' ') || 'ລົດບໍ່ມີປ້າຍ'}
                      </span>
                    </div>
                    <div className="flex items-baseline">
                      <span className="whitespace-nowrap">ວັນທີບັນທຶກ : </span>
                      <span className="ml-2 font-bold text-black">{formatDate(selectedCase.createdAt)}</span>
                    </div>
                    <div className="flex items-baseline">
                      <span className="whitespace-nowrap">ໝາຍເຫດ / ສາເຫດ : </span>
                      <span className="ml-2 font-bold text-black">{selectedCase.notes || '-'}</span>
                    </div>
                  </div>

                  {/* ຖັນດ້ານຂວາ */}
                  <div className="space-y-2.5 sm:space-y-3 md:pl-6 text-sm sm:text-base md:text-[17px] font-bold text-black">
                    <div className="flex items-baseline">
                      <span className="whitespace-nowrap">ສະຖານະ : </span>
                      <span
                        className={`ml-2 font-bold ${
                          selectedCase.resolution === 'RESOLVED' ? 'text-[#088395]' : 'text-[#B02019]'
                        }`}
                      >
                        {selectedCase.resolution === 'RESOLVED' ? 'ແກ້ໄຂແລ້ວ' : 'ຍັງບໍ່ແກ້ໄຂ'}
                      </span>
                    </div>
                    <div className="flex items-baseline">
                      <span className="whitespace-nowrap">ປະເພດ : </span>
                      <span className="ml-2 font-bold text-black">{selectedCase.ticket?.vehicleType?.label || '-'}</span>
                    </div>
                    <div className="flex items-baseline">
                      <span className="whitespace-nowrap">ຜູ້ບັນທຶກ : </span>
                      <span className="ml-2 font-bold text-black">
                        {selectedCase.staff?.displayName || selectedCase.staff?.username || '-'}
                      </span>
                    </div>
                    <div className="flex items-baseline">
                      <span className="whitespace-nowrap">ຄ່າປັບໃໝ : </span>
                      <span className="ml-2 font-bold text-black">{formatKip(selectedCase.penaltyAmount)}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* ສ່ວນສະແດງຮູບພາບຫຼັກຖານ 4 ຊ່ອງ */}
              {(() => {
                const modalPhotos = getCasePhotos(selectedCase);
                const caseTitle = `Ticket #${selectedCase.ticket?.ticketNumber || selectedCase.id}`;

                const evidenceSlots = [
                  {
                    key: 'driver',
                    label: 'ຮູບໜ້າເຈົ້າຂອງລົດ',
                    url: selectedCase.driverPhotoUrl ? getPhotoSrc(selectedCase.driverPhotoUrl) : null,
                  },
                  {
                    key: 'idCard',
                    label: 'ຮູບໃບຂັບຂີ່/ບັດປະຈຳຕົວ',
                    url: selectedCase.idCardPhotoUrl ? getPhotoSrc(selectedCase.idCardPhotoUrl) : null,
                  },
                  {
                    key: 'vehicleDoc',
                    label: 'ຮູບເອກະສານລົດ',
                    url: null,
                  },
                  {
                    key: 'vehicle',
                    label: 'ຮູບໜ້າລົດ/ປ້າຍລົດ',
                    url: selectedCase.vehiclePhotoUrl ? getPhotoSrc(selectedCase.vehiclePhotoUrl) : null,
                  },
                ];

                return (
                  <div>
                    <h3 className="text-base md:text-[17px] font-bold text-black mb-3">
                      ຮູບພາບຫຼັກຖານ (ຄລິກເພື່ອເບິ່ງຂະໜາດເຕັມ)
                    </h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
                      {evidenceSlots.map((slot) => {
                        const hasPhoto = Boolean(slot.url);
                        const photoIndex = modalPhotos.findIndex((p) => p.key === slot.key);

                        return (
                          <div
                            key={slot.key}
                            onClick={() => {
                              if (hasPhoto) {
                                openLightbox(
                                  modalPhotos,
                                  photoIndex !== -1 ? photoIndex : 0,
                                  caseTitle
                                );
                              }
                            }}
                            className={`h-36 sm:h-40 bg-[#D9D9D9] flex flex-col items-center justify-center p-2 relative overflow-hidden transition-all select-none ${
                              hasPhoto ? 'cursor-pointer group hover:shadow-md' : 'cursor-default'
                            }`}
                          >
                            {hasPhoto ? (
                              <>
                                <img
                                  src={slot.url!}
                                  alt={slot.label}
                                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200 rounded-none"
                                  style={{ borderRadius: 0 }}
                                />
                                <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center transition-opacity text-white text-xs font-bold gap-1">
                                  <ZoomIn size={22} />
                                  <span>ເບິ່ງຮູບເຕັມ</span>
                                </div>
                                <div className="absolute bottom-0 inset-x-0 bg-black/60 text-white text-[11px] sm:text-xs py-1 text-center font-bold truncate px-1">
                                  {slot.label}
                                </div>
                              </>
                            ) : (
                              /* ຊ່ອງຫວ່າງ: ສະແດງໄອຄອນ ZoomIn ແລະ ຊື່ຮູບພາບກໍລະນີບໍ່ມີຮູບ */
                              <div className="flex flex-col items-center justify-center text-center p-2 gap-2">
                                <ZoomIn size={28} className="text-gray-600 stroke-[2]" />
                                <span className="text-xs sm:text-[13px] font-bold text-gray-800 leading-tight">
                                  {slot.label}
                                </span>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })()}
            </div>

            {/* ເສັ້ນແບ່ງແຖບສີແດງ */}
            <div className="h-[2.5px] bg-[#B02019] w-full shrink-0" />

            {/* ສ່ວນທ້າຍຂອງໜ້າຕ່າງປັອບອັບພ້ອມປຸ່ມດຳເນີນການ */}
            <div className="bg-[#5D5D5D] px-4 sm:px-6 py-3 flex items-center justify-center shrink-0">
              {selectedCase.resolution === 'PENDING' ? (
                <button
                  type="button"
                  onClick={() => handleResolveCase(selectedCase)}
                  disabled={resolving}
                  className="bg-white hover:bg-gray-100 text-black px-8 py-2.5 font-bold text-base md:text-[17px] shadow-md flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-95 disabled:opacity-50 rounded-none"
                  style={{ borderRadius: 0 }}
                >
                  {resolving ? (
                    <RefreshCw size={18} className="animate-spin text-black" />
                  ) : (
                    <CheckCircle2 size={20} className="text-[#088395]" />
                  )}
                  <span>ແກ້ໄຂສະຖານະ</span>
                </button>
              ) : (
                <button
                  type="button"
                  disabled
                  className="bg-gray-200 text-gray-500 px-8 py-2.5 font-bold text-base md:text-[17px] shadow-sm flex items-center justify-center gap-2 cursor-not-allowed opacity-75 rounded-none"
                  style={{ borderRadius: 0 }}
                  title="Case ນີ້ແກ້ໄຂແລ້ວ (ບໍ່ສາມາດແກ້ໄຂຊ້ຳໄດ້)"
                >
                  <CheckCircle2 size={20} className="text-gray-400" />
                  <span>ແກ້ໄຂແລ້ວ</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ໜ້າຕ່າງປັອບອັບສະແດງຮູບພາບເຕັມຈໍພ້ອມລະບົບເລື່ອນຮູບ (Fullscreen Photo Lightbox Modal) */}
      {lightbox && lightbox.photos.length > 0 && (() => {
        const currentPhoto = lightbox.photos[lightbox.index] || lightbox.photos[0];
        const hasMultiple = lightbox.photos.length > 1;

        return (
          <div
            className="fixed inset-0 z-[60] bg-black/90 backdrop-blur-sm flex flex-col items-center justify-between p-3 sm:p-5 animate-fade-in select-none"
            onClick={() => setLightbox(null)}
          >
            {/* ແຖບຫົວຂໍ້ດ້ານເທິງຂອງ Lightbox */}
            <div
              className="w-full max-w-5xl flex items-center justify-between text-white py-2 px-2 shrink-0 border-b border-white/15"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center min-w-0 pr-3">
                <h3 className="font-bold text-base sm:text-lg text-white truncate">
                  {currentPhoto?.label}
                </h3>
              </div>

              <div className="flex items-center gap-3 shrink-0">
                {hasMultiple && (
                  <span className="bg-white/20 text-white font-bold text-xs sm:text-sm px-3 py-1 rounded-full border border-white/30">
                    {lightbox.index + 1} / {lightbox.photos.length}
                  </span>
                )}
                <button
                  type="button"
                  onClick={() => setLightbox(null)}
                  className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/25 text-white flex items-center justify-center transition-colors cursor-pointer"
                  title="ປິດ (Esc)"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* ພື້ນທີ່ສະແດງຮູບພາບຂະໜາດເຕັມກາງໜ້າຈໍ */}
            <div
              className="relative w-full max-w-5xl flex-1 flex items-center justify-center my-auto p-2"
              onClick={(e) => e.stopPropagation()}
            >
              {/* ປຸ່ມກົດເບິ່ງຮູບກ່ອນໜ້າ */}
              {hasMultiple && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    prevLightboxPhoto();
                  }}
                  className="absolute left-1 sm:left-4 z-20 w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-black/60 hover:bg-[#F9A825] hover:text-black text-white flex items-center justify-center transition-all cursor-pointer shadow-lg border border-white/30 active:scale-95"
                  title="ຮູບກ່ອນໜ້າ (Arrow Left)"
                >
                  <ChevronLeft size={28} />
                </button>
              )}

              {/* ຮູບພາບຫຼັກທີ່ກຳລັງສະແດງ */}
              <div className="relative max-h-[72vh] flex items-center justify-center overflow-hidden">
                <img
                  key={currentPhoto?.url}
                  src={currentPhoto?.url}
                  alt={currentPhoto?.label}
                  className="max-h-[72vh] max-w-full object-contain rounded shadow-2xl transition-all duration-200 animate-fade-in"
                />
              </div>

              {/* ປຸ່ມກົດເບິ່ງຮູບຖັດໄປ */}
              {hasMultiple && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    nextLightboxPhoto();
                  }}
                  className="absolute right-1 sm:right-4 z-20 w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-black/60 hover:bg-[#F9A825] hover:text-black text-white flex items-center justify-center transition-all cursor-pointer shadow-lg border border-white/30 active:scale-95"
                  title="ຮູບຖັດໄປ (Arrow Right)"
                >
                  <ChevronRight size={28} />
                </button>
              )}
            </div>

            {/* ແຖບສະແດງຮູບຕົວຢ່າງຂະໜາດນ້ອຍດ້ານລຸ່ມ (Thumbnails) */}
            <div
              className="w-full max-w-2xl flex flex-col items-center gap-2 pt-2 border-t border-white/15 shrink-0"
              onClick={(e) => e.stopPropagation()}
            >
              {hasMultiple && (
                <div className="flex items-center justify-center gap-3 overflow-x-auto py-1 px-2 max-w-full">
                  {lightbox.photos.map((p, pIdx) => {
                    const isActive = pIdx === lightbox.index;
                    return (
                      <button
                        key={p.key + pIdx}
                        type="button"
                        onClick={() => setLightbox({ ...lightbox, index: pIdx })}
                        className={`w-14 h-12 rounded overflow-hidden transition-all cursor-pointer relative shrink-0 border-2 ${
                          isActive
                            ? 'border-[#F9A825] ring-2 ring-[#F9A825]/60 scale-105'
                            : 'border-white/30 opacity-60 hover:opacity-100 hover:border-white'
                        }`}
                        title={p.label}
                      >
                        <img src={p.url} alt={p.label} className="w-full h-full object-cover" />
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        );
      })()}

      {/* ໜ້າຕ່າງປັອບອັບຢືນຢັນການລຶບຂໍ້ມູນສຳລັບຜູ້ດູແລລະບົບ (Admin Delete Confirmation Modal) */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 animate-scale-in">
          <div
            className="bg-[#FFF9EE] w-full max-w-md shadow-2xl rounded-none overflow-hidden"
            style={{ borderRadius: 0 }}
          >
            <div className="bg-[#5D5D5D] px-6 h-14 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Trash2 className="w-5 h-5 text-white" />
                <h3 className="text-base font-bold text-white">ຢືນຢັນການລຶບ</h3>
              </div>
              <button
                type="button"
                onClick={() => setDeleteConfirm(null)}
                className="w-7 h-7 rounded-full bg-white flex items-center justify-center text-[#5D5D5D] hover:bg-gray-100 shadow transition-transform cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>
            <div className="h-[2.5px] bg-[#B02019] w-full" />
            <div className="p-6 text-center">
              <p className="text-base font-bold text-gray-900 mb-2">
                ທ່ານແນ່ໃຈບໍ່ວ່າຕ້ອງການລຶບປະຫວັດປີ້ເສຍນີ້?
              </p>
              <p className="text-sm text-gray-600 mb-6">
                Ticket ID: <b className="text-black">{deleteConfirm.ticket?.ticketNumber || '-'}</b>
                <br />
                ການກະທຳນີ້ບໍ່ສາມາດຍົກເລີກໄດ້.
              </p>
              <div className="flex items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={() => setDeleteConfirm(null)}
                  className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-5 py-2.5 font-bold text-sm cursor-pointer"
                >
                  ຍົກເລີກ
                </button>
                <button
                  type="button"
                  onClick={handleDeleteCase}
                  className="bg-[#B02019] hover:bg-red-800 text-white px-5 py-2.5 font-bold text-sm cursor-pointer shadow-md"
                >
                  ຢືນຢັນລຶບ
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
