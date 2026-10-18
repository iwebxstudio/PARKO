// ============================================
// ລະບົບ PARKO — App Router (ຕົວຈັດການເສັ້ນທາງລະບົບຫຼັກ)
// ກຳນົດເສັ້ນທາງການເຂົ້າເຖິງ (Routing) ແລະ ຄວບຄຸມສິດທິການເຂົ້າເຖິງລະຫວ່າງພະນັກງານ ແລະ ຜູ້ດູແລລະບົບ
// ============================================
import React, { Suspense, lazy, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import AppLayout from './components/layout/AppLayout';

// ໂຫຼດໜ້າຕ່າງໆ ແບບ Lazy Loading ເພື່ອເພີ່ມຄວາມໄວໃນການໂຫຼດໜ້າເວັບຄັ້ງທຳອິດ
const Login = lazy(() => import('./pages/Login'));
const Register = lazy(() => import('./pages/Register'));
const CheckIn = lazy(() => import('./pages/staff/CheckIn'));
const CheckOut = lazy(() => import('./pages/staff/CheckOut'));
const LostTicket = lazy(() => import('./pages/staff/LostTicket'));
const LostTicketHistory = lazy(() => import('./pages/staff/LostTicketHistory'));
const History = lazy(() => import('./pages/admin/History'));
const Users = lazy(() => import('./pages/admin/Users'));
const Members = lazy(() => import('./pages/admin/Members'));
const Notifications = lazy(() => import('./pages/admin/Notifications'));
const Statistics = lazy(() => import('./pages/admin/Statistics'));
const Reports = lazy(() => import('./pages/admin/Reports'));
const Settings = lazy(() => import('./pages/admin/Settings'));
const AuditLog = lazy(() => import('./pages/admin/AuditLog'));

function PageLoader() {
  return (
    <div className="min-h-[50vh] flex items-center justify-center">
      <div className="animate-spin w-8 h-8 border-3 border-primary-500 border-t-transparent rounded-full" />
    </div>
  );
}

function ProtectedRoute({ children, adminOnly = false }: { children: React.ReactNode; adminOnly?: boolean }) {
  const { isAuthenticated, isLoading, user } = useAuth();
  if (isLoading) return <div className="min-h-screen flex items-center justify-center bg-gray-50"><div className="animate-spin w-10 h-10 border-4 border-primary-500 border-t-transparent rounded-full" /></div>;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (adminOnly && user?.role !== 'ADMIN') return <Navigate to="/staff/check-in" replace />;
  return <>{children}</>;
}

function AppRoutes() {
  const { isAuthenticated } = useAuth();
  const location = useLocation();

  useEffect(() => {
    document.title = 'PARKO SYSTEM';
  }, [location.pathname]);
  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        <Route path="/login" element={isAuthenticated ? <Navigate to="/staff/check-in" replace /> : <Login />} />
        <Route path="/register" element={isAuthenticated ? <Navigate to="/staff/check-in" replace /> : <Register />} />
        <Route path="/" element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
          {/* ເສັ້ນທາງສຳລັບພະນັກງານປະຈຳການ (Staff Routes) */}
          <Route path="staff/check-in" element={<CheckIn />} />
          <Route path="staff/check-out" element={<CheckOut />} />
          <Route path="staff/lost-ticket" element={<LostTicket />} />
          <Route path="staff/lost-ticket-history" element={<LostTicketHistory />} />
          <Route path="admin/lost-tickets" element={<LostTicketHistory />} />
          {/* ເສັ້ນທາງສຳລັບຜູ້ດູແລລະບົບ (Admin Routes) */}
          <Route path="admin/dashboard" element={<Navigate to="/staff/check-out" replace />} />
          <Route path="admin/history" element={<History />} />
          <Route path="admin/users" element={<ProtectedRoute adminOnly><Users /></ProtectedRoute>} />
          <Route path="admin/members" element={<Members />} />
          <Route path="admin/notifications" element={<Notifications />} />
          <Route path="admin/statistics" element={<Statistics />} />
          <Route path="admin/reports" element={<ProtectedRoute adminOnly><Reports /></ProtectedRoute>} />
          <Route path="admin/settings" element={<ProtectedRoute adminOnly><Settings /></ProtectedRoute>} />
          <Route path="admin/audit-log" element={<ProtectedRoute adminOnly><AuditLog /></ProtectedRoute>} />
          {/* ກຳນົດເສັ້ນທາງເລີ່ມຕົ້ນ (Default Redirect) ໄປຍັງໜ້າ Check-in */}
          <Route index element={<Navigate to="/staff/check-in" replace />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
        <Toaster
          position="top-center"
          gutter={10}
          containerStyle={{
            top: '50%',
            bottom: 'auto',
            transform: 'translateY(-50%)',
          }}
          toastOptions={{
            duration: 3500,
            style: {
              background: '#1e293b',
              color: '#ffffff',
              border: 'none',
              padding: '14px 26px',
              fontWeight: 700,
              fontSize: '15px',
              borderRadius: '0px',
              boxShadow: '0 12px 36px -4px rgba(0, 0, 0, 0.45)',
            },
            success: {
              iconTheme: { primary: '#22c55e', secondary: '#ffffff' },
              style: {
                background: '#0f3a2b',
                color: '#ffffff',
                border: 'none',
                borderRadius: '0px',
              },
            },
            error: {
              iconTheme: { primary: '#ef4444', secondary: '#ffffff' },
              style: {
                background: '#1e293b',
                color: '#ffffff',
                border: 'none',
                borderRadius: '0px',
              },
            },
          }}
        />
      </AuthProvider>
    </BrowserRouter>
  );
}

