// PARKO — ໜ້າຕ່າງແຈ້ງເຕືອນລົດສະມາຊິກໃກ້ໝົດອາຍຸ ຫຼື ກາຍກຳນົດ (Notifications ສຳລັບ Admin & Staff)
import React, { useState, useEffect } from 'react';
import { Bell, AlertTriangle, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../api/client';
import { io } from 'socket.io-client';
import type { Membership } from '../../types';

import carIcon from '../../components/icons/car.svg?raw';
import motorbikeIcon from '../../components/icons/motorbike.svg?raw';
import zapIcon from '../../components/icons/zap.svg?raw';
import truckIcon from '../../components/icons/truck.svg?raw';
import bikeIcon from '../../components/icons/bike.svg?raw';

function SvgIcon({ raw, className = "w-5 h-5" }: { raw: string; className?: string }) {
  return (
    <span
      className={`inline-flex items-center justify-center shrink-0 [&>svg]:w-full [&>svg]:h-full [&>svg]:stroke-current ${className}`}
      dangerouslySetInnerHTML={{ __html: raw }}
    />
  );
}

const getVehicleIconRaw = (nameOrLabel = '') => {
  const s = nameOrLabel.toLowerCase();
  if (s.includes('ev') || s.includes('ໄຟຟ້າ') || s.includes('⚡')) return zapIcon;
  if (s.includes('motorcycle') || s.includes('ລົດຈັກ') || s.includes('🏍️')) return motorbikeIcon;
  if (s.includes('bike') || s.includes('ລົດຖີບ') || s.includes('🚲')) return bikeIcon;
  if (s.includes('truck') || s.includes('ບັນທຸກ') || s.includes('🚚')) return truckIcon;
  return carIcon;
};

export default function Notifications() {
  const [expiringMembers, setExpiringMembers] = useState<Membership[]>([]);
  const [pricingRules, setPricingRules] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);


  const ITEMS_PER_PAGE = 8;
  const totalPages = Math.max(1, Math.ceil(expiringMembers.length / ITEMS_PER_PAGE));
  const paginatedMembers = expiringMembers.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  // ກຳນົດຈຳນວນປຸ່ມເລກໜ້າສູງສຸດຕາມຂະໜາດໜ້າຈໍ: 4 ປຸ່ມສຳລັບມືຖື (< 640px) ແລະ 9 ປຸ່ມສຳລັບ Desktop
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



  const loadData = async () => {
    setLoading(true);
    try {
      const [mRes, pRes] = await Promise.all([
        api.get('/membership'),
        api.get('/pricing')
      ]);

      const members = mRes.data.data || mRes.data || [];
      const rules = pRes.data.data || pRes.data || [];
      setPricingRules(rules);

      const now = new Date();
      const sevenDaysLater = new Date(now);
      sevenDaysLater.setDate(sevenDaysLater.getDate() + 7);
      sevenDaysLater.setHours(23, 59, 59, 999);

      // ເງື່ອນໄຂການກວດສອບແຈ້ງເຕືອນ:
      // 1. ຕ້ອງເປັນລົດທີ່ກຳລັງຈອດຢູ່ໃນບ່ອນຈອດ (ມີປີ້ສະຖານະ ACTIVE ຢ່າງໜ້ອຍ 1 ໃບ, ຖ້າ Check-out ແລ້ວ tickets ຈະເທົ່າກັບ 0)
      // 2. ເປັນລົດທີ່ກາຍກຳນົດແລ້ວ (endDate < now) ຫຼື ໃກ້ຈະໝົດອາຍຸພາຍໃນ 7 ວັນຂ້າງໜ້າ (endDate <= sevenDaysLater)
      const expiring = members.filter((m: any) => {
        const hasActiveTicket = Array.isArray(m.tickets) && m.tickets.length > 0;
        if (!hasActiveTicket) return false;

        const end = new Date(m.endDate);
        end.setHours(23, 59, 59, 999);
        return end <= sevenDaysLater;
      }).sort((a: any, b: any) => new Date(a.endDate).getTime() - new Date(b.endDate).getTime());

      setExpiringMembers(expiring);
      window.dispatchEvent(new CustomEvent('notification-count-update', { detail: expiring.length }));
      try {
        const channel = new BroadcastChannel('parko_channel');
        channel.postMessage({ type: 'notification_count', count: expiring.length });
        channel.close();
      } catch {}
    } catch {
      toast.error('Failed to load notifications');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();

    // 1. ການສື່ສານຂ້າມແຖບ Browser ຜ່ານ Broadcast Channel
    let channel: BroadcastChannel | null = null;
    try {
      channel = new BroadcastChannel('parko_channel');
      channel.onmessage = (event) => {
        if (event.data === 'membership_updated' || event.data === 'parking_updated') {
          loadData();
        }
      };
    } catch {}

    // 2. ການເຊື່ອມຕໍ່ແບບ Real-time ຜ່ານ WebSocket ກັບ Backend
    const WS = import.meta.env.VITE_WS_URL || '';
    const socket = io(`${WS}/parking`, { transports: ['websocket'] });
    socket.on('parking_update', () => {
      loadData();
    });

    // 3. ຮັບຟັງອີເວັ້ນພາຍໃນແຖບດຽວກັນ (Custom Event)
    const handleUpdate = () => loadData();
    window.addEventListener('membership-updated', handleUpdate);

    // 4. ກວດຈັບການສະຫຼັບແທັບກັບມາເປີດໜ້າຕ່າງນີ້ໃໝ່ (Window focus & visibility change)
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        loadData();
      }
    };
    window.addEventListener('focus', handleUpdate);
    document.addEventListener('visibilitychange', handleVisibility);

    // 5. ໂຫຼດຂໍ້ມູນອັດຕະໂນມັດທຸກໆ 8 ວິນາທີເພື່ອປ້ອງກັນຂໍ້ມູນຕົກຄ້າງ (Periodic Polling Fallback)
    const interval = setInterval(loadData, 8000);

    return () => {
      channel?.close();
      socket.disconnect();
      window.removeEventListener('membership-updated', handleUpdate);
      window.removeEventListener('focus', handleUpdate);
      document.removeEventListener('visibilitychange', handleVisibility);
      clearInterval(interval);
    };
  }, []);

  // ຟັງຊັນຊ່ວຍຄຳນວນສະຖານະ, ຈຳນວນວັນທີ່ກາຍກຳນົດ, ຈຳນວນວັນທີ່ເຫຼືອ ແລະ ຄ່າບໍລິການກາຍກຳນົດ
  const getExpirationStatus = (m: any) => {
    const end = new Date(m.endDate);
    end.setHours(23, 59, 59, 999);
    const now = new Date();
    const diffMs = end.getTime() - now.getTime();
    const isOverdue = diffMs < 0;

    let overdueDays = 0;
    let daysRemaining = 0;

    if (isOverdue) {
      overdueDays = Math.max(1, Math.ceil((now.getTime() - end.getTime()) / (1000 * 60 * 60 * 24)));
    } else {
      daysRemaining = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
    }

    // ຄົ້ນຫາອັດຕາຄ່າບໍລິການລາຍວັນຈາກຕາຕະລາງລາຄາໃນຖານຂໍ້ມູນ
    const rule = pricingRules.find(r => r.vehicleTypeId === m.vehicleTypeId) || m.vehicleType?.pricingRules?.[0];
    const dailyRate = Number(rule?.dailyRate || 0);
    const overdueFee = isOverdue ? overdueDays * dailyRate : 0;

    return {
      isOverdue,
      overdueDays,
      daysRemaining,
      dailyRate,
      overdueFee,
    };
  };



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

  return (
    <div className="font-sans w-full flex flex-col pb-6">
      {/* ກ່ອງຫຼັກສະແດງລາຍການແຈ້ງເຕືອນ (Main Container Card) */}
      <div
        className="shadow-[0_12px_36px_rgba(0,0,0,0.22),0_4px_14px_rgba(0,0,0,0.12)] rounded-none overflow-visible w-full border-0 flex flex-col"
        style={{ borderRadius: 0 }}
      >
        {/* ແຖບຫົວຂໍ້ດ້ານເທິງ — ໂທນສີເທົາເຂັ້ມ (#5D5D5D) */}
        <div
          className="bg-[#5D5D5D] px-3 py-2.5 md:py-0 min-h-[60px] md:h-16 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-2 md:gap-3 lg:gap-3 rounded-none shrink-0"
          style={{ borderRadius: 0 }}
        >
          {/* ດ້ານຊ້າຍ: ໄອຄອນ ແລະ ຫົວຂໍ້ແຈ້ງເຕືອນ */}
          <div className="flex items-center justify-between w-full md:w-auto h-10">
            <div className="flex items-center gap-2.5">
              <Bell size={20} className="w-5 h-5 text-white shrink-0" />
              <h1 className="text-base md:text-[17px] font-bold text-white tracking-normal whitespace-nowrap">
                ແຈ້ງເຕືອນ
              </h1>
            </div>
          </div>

          {/* ດ້ານຂວາ: ປຸ່ມຣີເຟຣຊໂຫຼດຂໍ້ມູນໃໝ່ */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={loadData}
              disabled={loading}
              className="bg-white hover:bg-gray-100 active:bg-gray-200 text-black font-bold h-10 px-4 flex items-center justify-center gap-2 text-base md:text-[17px] transition-colors shadow-sm rounded-none border-0 outline-none cursor-pointer"
              style={{ borderRadius: 0 }}
            >
              <RefreshCw size={17} className={`text-black shrink-0 ${loading ? 'animate-spin' : ''}`} />
              <span>ໂຫຼດໃໝ່</span>
            </button>
          </div>
        </div>

        {/* ເສັ້ນຂັ້ນສີແດງດ້ານເທິງ (#B02019) */}
        <div className="h-[2.5px] bg-[#B02019] w-full shrink-0" />

        {/* ສ່ວນເນື້ອໃນຫຼັກ — ພື້ນຫຼັງສີເຫຼືອງສົ້ມ (#F9A825) */}
        <div className="bg-[#F9A825] p-3 flex flex-col justify-start">
          {loading ? (
            <div className="py-12 sm:py-16 text-center flex flex-col items-center justify-center select-none">
              <RefreshCw size={32} className="animate-spin text-black mb-2" />
              <p className="text-black font-bold text-base md:text-[17px]">ກຳລັງໂຫຼດຂໍ້ມູນແຈ້ງເຕືອນ...</p>
            </div>
          ) : expiringMembers.length === 0 ? (
            <div className="py-12 sm:py-16 text-center flex flex-col items-center justify-center select-none">
              <h3 className="text-base sm:text-[18px] font-bold text-black mb-1">ບໍ່ມີແຈ້ງເຕືອນໃໝ່</h3>
              <p className="text-sm sm:text-base font-bold text-black">ບໍ່ມີລົດສະມາຊິກທີ່ກາຍກຳນົດ ຫຼື ໃກ້ຈະໝົດອາຍຸໃນຂະນະນີ້</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-3.5 lg:gap-4 items-start animate-fade-in">
              {paginatedMembers.map(m => {
                const { isOverdue, overdueDays, daysRemaining, dailyRate, overdueFee } = getExpirationStatus(m);

                // ແຍກຂໍ້ມູນປ້າຍທະບຽນລົດອອກເປັນຕົວອັກສອນ ແລະ ຕົວເລກ
                const parts = m.plateNumber.split(' ');
                let letters = '-';
                let num = m.plateNumber;
                if (parts.length > 1) {
                  letters = parts[0];
                  num = parts.slice(1).join(' ');
                } else {
                  const match = m.plateNumber.match(/^([^\d]+)(\d+)$/);
                  if (match) { letters = match[1]; num = match[2]; }
                }

                const iconRaw = getVehicleIconRaw((m.vehicleType?.name || '') + ' ' + (m.vehicleType?.label || ''));

                return (
                  <div
                    key={m.id}
                    className="bg-white shadow-[0_4px_12px_rgba(0,0,0,0.12)] hover:shadow-[0_8px_20px_rgba(0,0,0,0.18)] transition-all flex flex-col rounded-none overflow-hidden h-fit"
                    style={{ borderRadius: 0 }}
                  >
                    {/* ສ່ວນຫົວຂອງກາດ: ແຖບສີແດງເຂັ້ມເຕືອນກາຍກຳນົດ ຫຼື ແຖບສີແດງເຕືອນໃກ້ໝົດອາຍຸ */}
                    <div className={`${isOverdue ? 'bg-[#991B1B]' : 'bg-[#B02019]'} py-2 sm:py-2.5 flex justify-center items-center gap-2 shadow-inner px-2`}>
                      <AlertTriangle size={18} className="text-white shrink-0" />
                      <span className="text-base sm:text-[17px] font-bold text-white tracking-wide">
                        {isOverdue
                          ? `ກາຍກຳນົດ ${overdueDays} ວັນ`
                          : daysRemaining === 0
                            ? 'ໝົດອາຍຸມື້ນີ້'
                            : `ເຫຼືອອີກ ${daysRemaining} ວັນ`}
                      </span>
                    </div>

                    {/* ສ່ວນເນື້ອໃນລາຍລະອຽດຂອງກາດສະມາຊິກ */}
                    <div className="px-3 py-2.5 sm:px-3.5 sm:py-3 flex flex-col bg-white">
                      <div className="flex justify-center mb-1 text-gray-700">
                        <SvgIcon raw={iconRaw} className={`w-8 h-8 ${isOverdue ? 'text-[#991B1B]' : 'text-[#B02019]'}`} />
                      </div>

                      <div className="grid grid-cols-[auto_auto_1fr] gap-x-2 gap-y-0.5 text-[15px] sm:text-[15.5px] font-bold text-black mx-auto w-fit leading-tight my-0.5">
                        <span className="text-right">ລະຫັດ</span>
                        <span>:</span>
                        <span className="truncate">{m.memberCode}</span>

                        <span className="text-right">ປະເພດ</span>
                        <span>:</span>
                        <span className="truncate">{m.vehicleType?.label || '-'}</span>

                        <span className="text-right">ຮູບແບບ</span>
                        <span>:</span>
                        <span className="truncate text-amber-700">{m.memberType}</span>

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
                        <span className="whitespace-nowrap">{new Date(m.startDate).toLocaleDateString('lo-LA')}</span>

                        <span className="text-right">ວັນໝົດອາຍຸ</span>
                        <span>:</span>
                        <span className={`whitespace-nowrap ${isOverdue ? 'text-red-700 underline font-black' : 'text-red-600'}`}>
                          {new Date(m.endDate).toLocaleDateString('lo-LA')}
                        </span>

                        <span className="text-right">ຈຳນວນເງິນ</span>
                        <span>:</span>
                        <span className="whitespace-nowrap text-emerald-600">{new Intl.NumberFormat('lo-LA').format(m.paidAmount)} ₭</span>
                      </div>

                      {/* ກ່ອງສະແດງລາຍລະອຽດຄ່າບໍລິການສ່ວນທີ່ກາຍກຳນົດ */}
                      {isOverdue && (
                        <div className="mt-2.5 p-2 bg-red-50 border border-red-300 text-center rounded-none">
                          <div className="text-[13px] font-bold text-red-800">
                            ລາຄາທີ່ຕ້ອງຈ່າຍກາຍກຳນົດ:
                          </div>
                          <div className="text-[17px] font-black text-[#B02019] my-0.5">
                            {new Intl.NumberFormat('lo-LA').format(overdueFee)} ₭
                          </div>
                          <div className="text-[12px] font-bold text-gray-700">
                            ({overdueDays} ມື້ × {new Intl.NumberFormat('lo-LA').format(dailyRate)} ₭/ມື້)
                          </div>
                        </div>
                      )}

                    </div>
                  </div>
                );
              })}
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
          {/* ສ່ວນສະແດງຈຳນວນລາຍການທັງໝົດ (Total Count Badge) */}
          <div className="flex items-center gap-2 text-white font-bold text-base md:text-[17px]">
            <span>ຈຳນວນ</span>
            <span
              className="bg-[#B02019] text-white h-10 w-10 flex items-center justify-center text-base md:text-[17px] font-bold shadow-sm rounded-none border-0 shrink-0 text-center"
              style={{ borderRadius: 0 }}
            >
              {expiringMembers.length}
            </span>
            <span>ລາຍການ</span>
          </div>

          {/* ສ່ວນປຸ່ມຄວບຄຸມການປ່ຽນໜ້າ (Pagination Controls) */}
          <div className="flex items-center gap-1.5 sm:gap-2 max-w-full overflow-x-auto no-scrollbar py-1">
            <button
              type="button"
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage <= 1 || loading}
              className={`text-white font-bold h-10 px-4 sm:w-24 flex items-center justify-center text-base md:text-[17px] transition-colors shadow-sm rounded-none border-0 outline-none cursor-pointer shrink-0 ${
                currentPage <= 1 || loading
                  ? 'bg-[#852929] cursor-not-allowed'
                  : 'bg-[#B02019] hover:bg-[#961b15]'
              }`}
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
                    : 'bg-[#852929] hover:bg-[#961b15]'
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
              className={`text-white font-bold h-10 px-4 sm:w-24 flex items-center justify-center text-base md:text-[17px] transition-colors shadow-sm rounded-none border-0 outline-none cursor-pointer shrink-0 ${
                currentPage >= totalPages || loading || totalPages === 0
                  ? 'bg-[#852929] cursor-not-allowed'
                  : 'bg-[#B02019] hover:bg-[#961b15]'
              }`}
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
