// PARKO — App Router
import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import AppLayout from './components/layout/AppLayout';
import Login from './pages/Login';
import Register from './pages/Register';
import CheckIn from './pages/staff/CheckIn';
import CheckOut from './pages/staff/CheckOut';
import LostTicket from './pages/staff/LostTicket';
import Dashboard from './pages/admin/Dashboard';
import Users from './pages/admin/Users';
import Reports from './pages/admin/Reports';
import Settings from './pages/admin/Settings';
import AuditLog from './pages/admin/AuditLog';

function ProtectedRoute({ children, adminOnly = false }: { children: React.ReactNode; adminOnly?: boolean }) {
  const { isAuthenticated, isLoading, user } = useAuth();
  if (isLoading) return <div className="min-h-screen flex items-center justify-center bg-gray-50"><div className="animate-spin w-10 h-10 border-4 border-primary-500 border-t-transparent rounded-full" /></div>;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (adminOnly && user?.role !== 'ADMIN') return <Navigate to="/staff/check-in" replace />;
  return <>{children}</>;
}

function AppRoutes() {
  const { isAuthenticated, user } = useAuth();
  return (
    <Routes>
      <Route path="/login" element={isAuthenticated ? <Navigate to={user?.role === 'ADMIN' ? '/admin/dashboard' : '/staff/check-in'} replace /> : <Login />} />
      <Route path="/register" element={isAuthenticated ? <Navigate to={user?.role === 'ADMIN' ? '/admin/dashboard' : '/staff/check-in'} replace /> : <Register />} />
      <Route path="/" element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
        {/* Staff routes */}
        <Route path="staff/check-in" element={<CheckIn />} />
        <Route path="staff/check-out" element={<CheckOut />} />
        <Route path="staff/lost-ticket" element={<LostTicket />} />
        {/* Admin routes */}
        <Route path="admin/dashboard" element={<ProtectedRoute adminOnly><Dashboard /></ProtectedRoute>} />
        <Route path="admin/users" element={<ProtectedRoute adminOnly><Users /></ProtectedRoute>} />
        <Route path="admin/reports" element={<ProtectedRoute adminOnly><Reports /></ProtectedRoute>} />
        <Route path="admin/settings" element={<ProtectedRoute adminOnly><Settings /></ProtectedRoute>} />
        <Route path="admin/audit-log" element={<ProtectedRoute adminOnly><AuditLog /></ProtectedRoute>} />
        {/* Default redirect */}
        <Route index element={<Navigate to="/staff/check-in" replace />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
        <Toaster position="top-right" toastOptions={{
          duration: 3000,
          style: { background: '#1e293b', color: '#f1f5f9', border: '1px solid #334155' },
          success: { iconTheme: { primary: '#22c55e', secondary: '#fff' } },
          error: { iconTheme: { primary: '#ef4444', secondary: '#fff' } },
        }} />
      </AuthProvider>
    </BrowserRouter>
  );
}
