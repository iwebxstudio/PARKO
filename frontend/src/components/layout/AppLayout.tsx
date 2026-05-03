// ============================================
// PARKO — App Layout with Sidebar Navigation
// ============================================
import React, { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import {
  LayoutDashboard, LogIn, LogOut as LogOutIcon, Car, ScanLine,
  AlertTriangle, Users, BarChart3, DollarSign, Settings,
  ClipboardList, Menu, X, ParkingCircle, ChevronDown,
} from 'lucide-react';

export default function AppLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const isAdmin = user?.role === 'ADMIN';

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const staffLinks = [
    { to: '/staff/check-in', icon: LogIn, label: 'ລົດເຂົ້າ (Check in)' },
    { to: '/staff/check-out', icon: ScanLine, label: 'ລົດອອກ (Check out)' },
    { to: '/staff/lost-ticket', icon: AlertTriangle, label: 'ແຈ້ງປີ້ຫາຍ (Lost Ticket)' },
  ];

  const adminLinks = [
    { to: '/admin/dashboard', icon: LayoutDashboard, label: 'ແຜງຄວບຄຸມ' },
    { to: '/admin/users', icon: Users, label: 'ຈັດການຜູ້ໃຊ້' },
    { to: '/admin/reports', icon: BarChart3, label: 'ລາຍງານ' },
    { to: '/admin/settings', icon: Settings, label: 'ຕັ້ງຄ່າລະບົບ' },
    { to: '/admin/audit-log', icon: ClipboardList, label: 'Audit Log' },
  ];

  const navLinkClass = ({ isActive }: { isActive: boolean }) =>
    `flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 text-sm font-bold ${isActive
      ? 'bg-primary-50 text-primary-700 border border-primary-100'
      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
    }`;

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/60 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed md:static inset-y-0 left-0 z-40 w-72 bg-white/95 backdrop-blur-xl border-r border-gray-200 flex flex-col transform transition-transform duration-300 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
          }`}
      >
        {/* Logo */}
        <div className="flex items-center gap-3 px-6 py-5 border-b border-gray-200">
          <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center shadow-lg shadow-primary-500/30">
            <ParkingCircle className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-gray-900 tracking-wide">PARKO V2.0</h1>
            <p className="text-[10px] text-gray-500 uppercase tracking-widest">Parking System</p>
          </div>
          <button
            className="ml-auto md:hidden text-gray-500 hover:text-gray-900"
            onClick={() => setSidebarOpen(false)}
          >
            <X size={20} />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto px-4 py-4 space-y-1">
          {/* Staff Section */}
          <p className="px-4 py-2 text-[10px] font-bold uppercase tracking-widest text-gray-400">
          </p>
          {staffLinks.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              className={navLinkClass}
              onClick={() => setSidebarOpen(false)}
            >
              <link.icon size={18} />
              {link.label}
            </NavLink>
          ))}

          {/* Admin Section */}
          {isAdmin && (
            <>
              <div className="my-3 border-t border-gray-100" />
              <p className="px-4 py-2 text-[10px] font-bold uppercase tracking-widest text-gray-400">
              </p>
              {adminLinks.map((link) => (
                <NavLink
                  key={link.to}
                  to={link.to}
                  className={navLinkClass}
                  onClick={() => setSidebarOpen(false)}
                >
                  <link.icon size={18} />
                  {link.label}
                </NavLink>
              ))}
            </>
          )}
        </nav>

        {/* User info */}
        <div className="px-4 py-4 border-t border-gray-200">
          <div className="flex items-center gap-3 px-3 py-2">
            <div className="w-9 h-9 rounded-full gradient-primary flex items-center justify-center text-white text-sm font-bold">
              {user?.displayName?.[0] || 'U'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-gray-900 truncate">{user?.displayName}</p>
              <p className="text-xs text-gray-500">{user?.role}</p>
            </div>
            <button
              onClick={handleLogout}
              className="p-2 text-gray-500 hover:text-red-500 transition-colors rounded-lg hover:bg-gray-100"
              title="Logout"
            >
              <LogOutIcon size={18} />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Top bar (mobile) */}
        <header className="md:hidden flex items-center justify-between px-4 py-3 bg-white border-b border-gray-200">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2 text-gray-600 hover:text-gray-900"
          >
            <Menu size={24} />
          </button>
          <div className="flex items-center gap-2">
            <ParkingCircle className="w-6 h-6 text-primary-500" />
            <span className="font-bold text-gray-900">PARKO</span>
          </div>
          <div className="w-10" />
        </header>

        {/* Page Content */}
        <div className="flex-1 overflow-y-auto p-4 md:p-8 gradient-mesh">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
