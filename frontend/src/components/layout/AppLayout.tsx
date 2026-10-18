// ============================================
// ລະບົບ PARKO — App Layout with Sidebar Navigation (ໂຄງສ້າງຫຼັກຂອງແອັບພລິເຄຊັນ)
// ປະກອບມີແຖບເມນູຂ້າງ (Sidebar) ທີ່ຮອງຮັບການຫຍໍ້-ຂະຫຍາຍ, ແຖບຫົວດ້ານເທິງ (Header) ແລະ ລະບົບແຈ້ງເຕືອນ Real-time
// ============================================
import React, { useState } from 'react';
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import {
  LogIn, LogOut, Car, ScanLine,
  AlertTriangle, CircleUserRound, Users, BarChart3, DollarSign, Settings,
  ClipboardList, Menu, X, ChevronDown, Bell, FileSpreadsheet, History,
  BellRing, CircleUser, FileWarning,
} from 'lucide-react';
import api from '../../api/client';
import { io } from 'socket.io-client';



export default function AppLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [expiringCount, setExpiringCount] = useState(0);
  const isAdmin = user?.role === 'ADMIN';
  const location = useLocation();

  const refreshExpiringCount = React.useCallback(() => {
    if (!user) return;
    api.get('/membership').then(res => {
      const raw = res.data?.data || res.data;
      const members = Array.isArray(raw) ? raw : [];
      const now = new Date();
      const sevenDaysLater = new Date(now);
      sevenDaysLater.setDate(sevenDaysLater.getDate() + 7);
      sevenDaysLater.setHours(23, 59, 59, 999);

      const expiring = members.filter((m: any) => {
        const hasActiveTicket = Array.isArray(m.tickets) && m.tickets.length > 0;
        if (!hasActiveTicket) return false;

        const end = new Date(m.endDate);
        end.setHours(23, 59, 59, 999);
        return end <= sevenDaysLater;
      });
      setExpiringCount(expiring.length);
    }).catch(() => { });
  }, [user]);

  // ອັບເດດຈຳນວນແຈ້ງເຕືອນໃໝ່ທຸກຄັ້ງເມື່ອມີການປ່ຽນແປງຜູ້ໃຊ້ ຫຼື ເມື່ອມີການປ່ຽນໜ້າເວັບ
  React.useEffect(() => {
    refreshExpiringCount();
  }, [refreshExpiringCount, location.pathname]);

  // ຕິດຕາມເຫດການແຈ້ງເຕືອນແບບ Real-time ຜ່ານ Custom Events, WebSocket, BroadcastChannel ແລະ ການດຶງຂໍ້ມູນເປັນໄລຍະ
  React.useEffect(() => {
    const handleCountUpdate = (e: any) => {
      if (typeof e.detail === 'number') {
        setExpiringCount(e.detail);
      } else {
        refreshExpiringCount();
      }
    };

    window.addEventListener('notification-count-update', handleCountUpdate);
    window.addEventListener('membership-updated', handleCountUpdate);

    // ກະຈາຍສັນຍານແຈ້ງເຕືອນລະຫວ່າງແຖບໜ້າຈໍບຣາວເຊີ (Cross-tab BroadcastChannel)
    let channel: BroadcastChannel | null = null;
    try {
      channel = new BroadcastChannel('parko_channel');
      channel.onmessage = (event) => {
        if (event.data === 'membership_updated' || event.data === 'parking_updated') {
          refreshExpiringCount();
        } else if (event.data?.type === 'notification_count' && typeof event.data.count === 'number') {
          setExpiringCount(event.data.count);
        }
      };
    } catch {}

    // ເຊື່ອມຕໍ່ WebSocket ສຳລັບການອັບເດດສະຖານະບ່ອນຈອດລົດ ແລະ ການແຈ້ງເຕືອນແບບທັນທີທັນໃດ
    const WS = import.meta.env.VITE_WS_URL || '';
    const socket = io(`${WS}/parking`, { transports: ['websocket'] });
    socket.on('parking_update', () => {
      refreshExpiringCount();
    });

    const handleFocus = () => refreshExpiringCount();
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        refreshExpiringCount();
      }
    };
    window.addEventListener('focus', handleFocus);
    document.addEventListener('visibilitychange', handleVisibility);

    const interval = setInterval(refreshExpiringCount, 8000);

    return () => {
      channel?.close();
      socket.disconnect();
      window.removeEventListener('notification-count-update', handleCountUpdate);
      window.removeEventListener('membership-updated', handleCountUpdate);
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('visibilitychange', handleVisibility);
      clearInterval(interval);
    };
  }, [refreshExpiringCount]);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const allLinks = [
    { to: '/staff/check-in', icon: LogIn, label: 'ລົດເຂົ້າ', roles: ['ADMIN', 'STAFF'] },
    { to: '/staff/check-out', icon: ScanLine, label: 'ລົດອອກ', roles: ['ADMIN', 'STAFF'] },
    { to: '/staff/lost-ticket', icon: AlertTriangle, label: 'ແຈ້ງປີ້ລົດຫາຍ', roles: ['ADMIN', 'STAFF'] },
    { to: '/staff/lost-ticket-history', icon: FileWarning, label: 'ປະຫວັດປີ້ເສຍ', roles: ['ADMIN', 'STAFF'] },
    { to: '/admin/history', icon: History, label: 'ປະຫວັດການຝາກ', roles: ['ADMIN', 'STAFF'] },
    { to: '/admin/members', icon: Car, label: 'ຝາກມີກຳນົດ', roles: ['ADMIN', 'STAFF'] },
    { to: '/admin/statistics', icon: BarChart3, label: 'ສະຖິຕິ', roles: ['ADMIN', 'STAFF'] },
    { to: '/admin/reports', icon: FileSpreadsheet, label: 'ລາຍງານ', roles: ['ADMIN'] },
    { to: '/admin/users', icon: Users, label: 'ຈັດການຜູ້ໃຊ້', roles: ['ADMIN'] },
    { to: '/admin/notifications', icon: Bell, label: 'ແຈ້ງເຕືອນ', badge: expiringCount, roles: ['ADMIN', 'STAFF'] },
    { to: '/admin/settings', icon: Settings, label: 'ຕັ້ງຄ່າລະບົບ', roles: ['ADMIN'] },
    { to: '/admin/audit-log', icon: ClipboardList, label: 'Audit Log', roles: ['ADMIN'] },
  ];

  const currentLinks = allLinks.filter(l => l.roles.includes(user?.role || ''));

  const navLinkClass = ({ isActive }: { isActive: boolean }) =>
    `flex items-center relative transition-all duration-150 text-[17px] font-bold rounded-none ${
      sidebarCollapsed
        ? 'w-10 h-10 mx-auto justify-center p-0'
        : 'w-full gap-3 px-4 py-2.5'
    } ${
      isActive
        ? 'bg-[#B02019] hover:bg-[#961B15] text-white shadow-md'
        : 'text-white hover:bg-[#F9A825] hover:text-black active:bg-[#e09514] active:text-black'
    }`;

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      {/* ແຜ່ນບັງພື້ນຫຼັງສຳລັບໜ້າຈໍມືຖື (Mobile Overlay) */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/60 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* ແຖບເມນູດ້ານຂ້າງ (Sidebar) — ຮອງຮັບການເລື່ອນຂຶ້ນ-ລົງໄດ້ຢ່າງລຽບນຽນ */}
      <aside
        className={`fixed md:static inset-y-0 left-0 z-40 ${sidebarCollapsed ? 'md:w-20' : 'md:w-72'} w-72 overflow-y-auto overflow-x-hidden transform transition-all duration-300 shadow-xl flex flex-col sidebar-scrollbar ${isAdmin ? 'admin-sidebar-border' : 'staff-sidebar-border'
          } ${sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}
        style={{ background: '#5D5D5D' }}
      >
        {/* ສ່ວນຫົວໂລໂກ້ສີແດງ PARKO SYSTEM (ຕິດແໜ້ນຢູ່ດ້ານເທິງສຸດຂອງ Sidebar) */}
        <div className={`flex items-center ${sidebarCollapsed ? 'justify-center px-0' : 'gap-3 px-5'} shrink-0 sticky top-0 z-10 shadow-sm transition-all duration-300`} style={{ background: '#B02019', height: '72px' }}>
          <div
            className="w-10 h-10 rounded-none border-[3.5px] border-white flex items-center justify-center shadow-md shrink-0 select-none"
            style={{ background: '#F9A825' }}
          >
            <span className="text-white font-black text-2xl leading-none font-sans">
              P
            </span>
          </div>
          {!sidebarCollapsed && <h1 className="text-lg font-bold text-white tracking-wide truncate transition-opacity duration-300">PARKO SYSTEM</h1>}
          <button
            className="ml-auto md:hidden text-white/80 hover:text-white shrink-0"
            onClick={() => setSidebarOpen(false)}
          >
            <X size={20} />
          </button>
        </div>

        {/* ລາຍການເມນູຫຼັກຂອງລະບົບ (Navigation Links) */}
        <nav className={`${sidebarCollapsed ? 'px-0' : 'px-3'} py-3 space-y-1`}>
          {currentLinks.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              className={navLinkClass}
              onClick={() => setSidebarOpen(false)}
              title={sidebarCollapsed ? link.label : undefined}
            >
              {({ isActive }) => (
                <>
                  <link.icon size={20} className="shrink-0" />
                  {!sidebarCollapsed && (
                    <>
                      <span className="flex-1 truncate">{link.label}</span>
                      {link.badge !== undefined && link.badge > 0 && (
                        <span className={`${isActive ? 'bg-[#FFAB10] text-black font-extrabold' : 'bg-red-600 text-white font-bold'} text-[10px] px-2 py-0.5 rounded-full min-w-[20px] text-center shadow-sm`}>
                          {link.badge}
                        </span>
                      )}
                    </>
                  )}
                  {sidebarCollapsed && link.badge !== undefined && link.badge > 0 && (
                    <span className={`absolute -top-1 -right-1 ${isActive ? 'bg-[#FFAB10] border-2 border-[#B02019]' : 'bg-red-600 border-2 border-[#5D5D5D]'} w-3.5 h-3.5 rounded-full`}></span>
                  )}
                </>
              )}
            </NavLink>
          ))}

          {/* ສ່ວນສະແດງຂໍ້ມູນຜູ້ໃຊ້ງານ ແລະ ປຸ່ມອອກຈາກລະບົບ (User Info & Sign Out) */}
          <div>
            {!sidebarCollapsed ? (
              <div className="flex items-stretch h-11 w-full rounded-none overflow-hidden shadow-sm">
                {/* ດ້ານຊ້າຍ: ສະແດງບົດບາດຂອງຜູ້ໃຊ້ງານ (ສີສົ້ມ #F9A825) */}
                <div
                  className="flex-auto flex items-center justify-center gap-2 px-3 select-none min-w-0"
                  style={{ background: '#F9A825' }}
                >
                  <CircleUserRound size={20} className="w-5 h-5 text-white shrink-0" strokeWidth={2.2} />
                  <span className="text-white font-bold text-[17px] tracking-normal whitespace-nowrap">
                    {(user?.role || 'admin').toLowerCase()}
                  </span>
                </div>

                {/* ດ້ານຂວາ: ປຸ່ມອອກຈາກລະບົບ (ສີແດງ #B02019) */}
                <button
                  type="button"
                  onClick={handleLogout}
                  className="flex-auto flex items-center justify-center gap-2 px-3 bg-[#B02019] hover:bg-[#961B15] active:bg-[#7e140f] text-white transition-colors cursor-pointer border-0 outline-none select-none min-w-0"
                  title="sign out"
                >
                  <span className="font-bold text-[17px] tracking-normal whitespace-nowrap">
                    sign out
                  </span>
                  <LogOut size={20} className="w-5 h-5 text-white shrink-0" strokeWidth={2.2} />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={handleLogout}
                className="w-10 h-10 mx-auto bg-[#B02019] hover:bg-[#961B15] active:bg-[#7e140f] text-white flex items-center justify-center transition-colors cursor-pointer rounded-none shadow-sm"
                title="sign out"
              >
                <LogOut size={20} className="w-5 h-5 text-white" strokeWidth={2.2} />
              </button>
            )}
          </div>
        </nav>
      </aside>

      {/* ພື້ນທີ່ເນື້ອຫາຫຼັກຂອງໜ້າຈໍ (Main Content Area) */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* ແຖບ Navbar ດ້ານເທິງ (ຕິດແໜ້ນຢູ່ດ້ານເທິງສຸດຂອງໜ້າຈໍ) */}
        <header
          className="relative flex items-center justify-between px-3 sm:px-4 md:px-5 shrink-0 shadow-md z-10 overflow-hidden"
          style={{ background: '#B02019', height: '72px' }}
        >
          {/* ລວດລາຍເສັ້ນສະຫຼຽງສີເທົາ ແລະ ເສັ້ນຕັດສີຂາວທີ່ເປັນເອກະລັກຂອງ PARKO ທາງດ້ານຂວາ */}
          <div className="absolute inset-y-0 right-0 w-[120px] sm:w-[130px] md:w-[295px] lg:w-[310px] pointer-events-none select-none">
            {/* ຊັ້ນເສັ້ນສະຫຼຽງສີຂາວດ້ານລຸ່ມ (ກວ້າງກວ່າ 4px ເພື່ອສ້າງຂອບເສັ້ນສີຂາວທີ່ຄົມຊັດ) */}
            <div
              className="absolute inset-0 bg-white"
              style={{
                clipPath: 'polygon(0 0, 100% 0, 100% 100%, 46px 100%)',
              }}
            />
            {/* ຊັ້ນເສັ້ນສະຫຼຽງສີເທົາດ້ານເທິງ (Offset 4px) */}
            <div
              className="absolute inset-0 bg-[#4D4D4D]"
              style={{
                clipPath: 'polygon(4px 0, 100% 0, 100% 100%, 50px 100%)',
              }}
            />
          </div>

          {/* ດ້ານຊ້າຍ: ປຸ່ມເມນູ Hamburger ສຳລັບຫຍໍ້/ຂະຫຍາຍ Sidebar ແລະ ຊື່ໜ້າຈໍ */}
          <div className="relative z-10 flex items-center gap-2.5 sm:gap-3.5">
            <button
              type="button"
              onClick={() => {
                if (window.innerWidth < 768) {
                  setSidebarOpen(!sidebarOpen);
                } else {
                  setSidebarCollapsed(!sidebarCollapsed);
                }
              }}
              className="text-white p-1 hover:opacity-80 active:scale-95 transition-all cursor-pointer flex items-center justify-center shrink-0"
              title="Toggle Sidebar"
              aria-label="Toggle Sidebar"
            >
              <Menu className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
            </button>
            <span className="text-base sm:text-lg md:text-xl font-bold text-white tracking-wide select-none drop-shadow-xs whitespace-nowrap">
              {isAdmin ? 'ໜ້າແອດມິນ' : 'ໜ້າພະນັກງານ'}
            </span>
          </div>

          {/* ດ້ານຂວາ: ກະດິ່ງແຈ້ງເຕືອນ, ເສັ້ນຂັ້ນ, ຄຳທັກທາຍ ແລະ ໄອຄອນໂປຣໄຟລ໌ */}
          <div className="relative z-10 flex items-center gap-2 sm:gap-3 md:gap-4">
            {/* ປຸ່ມກະດິ່ງແຈ້ງເຕືອນສະມາຊິກໃກ້ໝົດອາຍຸ */}
            <button
              type="button"
              onClick={() => navigate('/admin/notifications')}
              className="relative p-1 text-white hover:opacity-80 active:scale-95 transition-all cursor-pointer flex items-center justify-center"
              title="ແຈ້ງເຕືອນ"
              aria-label="ແຈ້ງເຕືອນ"
            >
              <BellRing className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
              {expiringCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-yellow-400 text-black text-[10px] font-bold w-4 h-4 flex items-center justify-center rounded-full shadow-sm ring-1 ring-[#4D4D4D]">
                  {expiringCount}
                </span>
              )}
            </button>

            {/* ເສັ້ນຂັ້ນແນວຕັ້ງສີຂາວ */}
            <div className="hidden md:block w-[2px] h-8 sm:h-9 bg-white mx-1 lg:mx-2 shrink-0 rounded-none" />

            {/* ຂໍ້ຄວາມທັກທາຍບົດບາດຜູ້ໃຊ້ງານ */}
            <span className="hidden md:inline-block text-white font-bold text-base lg:text-[17px] tracking-wide whitespace-nowrap select-none">
              Hi! {user?.role || 'ADMIN/STAFF'}
            </span>

            {/* ປຸ່ມໂປຣໄຟລ໌ຜູ້ໃຊ້ງານ (User Profile) */}
            <button
              type="button"
              onClick={() => navigate(isAdmin ? '/admin/users' : '#')}
              className="p-1 text-white hover:opacity-80 active:scale-95 transition-all cursor-pointer flex items-center justify-center"
              title={user?.displayName || user?.username || 'User Profile'}
              aria-label="User Profile"
            >
              <CircleUser className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
            </button>
          </div>
        </header>

        {/* ພື້ນທີ່ສະແດງຜົນຂອງແຕ່ລະໜ້າ (Page Content ຜ່ານ Outlet) */}
        <div
          className="flex-1 overflow-y-auto no-scrollbar p-3.5 bg-[#FDF1D7] flex flex-col"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          <Outlet />
        </div>
      </main>
    </div>
  );
}
