// ============================================
// PARKO — Login Page
// Split-panel layout: Orange form + Teal brand
// ============================================
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { ParkingCircle, Eye, EyeOff, Loader2, LogIn } from 'lucide-react';
import toast from 'react-hot-toast';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      toast.error('Please enter username and password');
      return;
    }

    setLoading(true);
    try {
      await login(username, password);
      toast.success('Login successful!');
      // Navigate based on role
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      navigate(user.role === 'ADMIN' ? '/admin/dashboard' : '/staff/check-in');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4"
      style={{ background: '#e8e8e8' }}>

      {/* Main Card */}
      <div className="w-full max-w-[900px] overflow-hidden shadow-2xl animate-fade-in flex flex-col md:flex-row">

        {/* ===== LEFT PANEL — Orange Form ===== */}
        <div className="w-full md:w-1/2 p-8 md:p-10 flex flex-col justify-center"
          style={{ background: 'linear-gradient(160deg, #FFB834 0%, #F5A623 50%, #E8961E 100%)' }}>

          {/* Title */}
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-8 text-center">
            ເຂົ້າສູ່ລະບົບ
          </h1>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-bold text-gray-800 mb-2">
                Username / Email / Phone
              </label>
              <input
                id="login-username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-4 py-3.5 bg-white text-gray-900 placeholder-gray-400 border-none outline-none shadow-md focus:ring-2 focus:ring-white/50 transition-all duration-200"
                placeholder="admin, staff01, or 020..."
                autoComplete="username"
                autoFocus
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-800 mb-2">
                Password
              </label>
              <div className="relative">
                <input
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3.5 pr-12 bg-white text-gray-900 placeholder-gray-400 border-none outline-none shadow-md focus:ring-2 focus:ring-white/50 transition-all duration-200"
                  placeholder="Enter password"
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            {/* Login Button */}
            <button
              id="login-submit"
              type="submit"
              disabled={loading}
              className="w-full py-3.5 font-bold text-white text-lg flex items-center justify-center gap-2 transition-all duration-200 active:scale-95 shadow-lg mt-2"
              style={{
                background: loading ? '#6b3a3a' : 'linear-gradient(135deg, #8B3A4A 0%, #6B2D3B 100%)',
                boxShadow: '0 4px 15px rgba(107, 45, 59, 0.4)',
              }}
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Logging in...
                </>
              ) : (
                <>
                  <LogIn className="w-5 h-5" />
                  ເຂົ້າສູ່ລະບົບ (Login)
                </>
              )}
            </button>
          </form>

          {/* Register Link */}
          <div className="text-center mt-5">
            <p className="text-gray-800 text-sm font-bold">
              ຍັງບໍ່ມີບັນຊີບໍ?{' '}
              <Link to="/register" className="font-bold text-white underline underline-offset-2 hover:text-gray-100 transition-colors">
                ລົງທະບຽນທີ່ນີ້
              </Link>
            </p>
          </div>
        </div>

        {/* ===== RIGHT PANEL — Teal Brand ===== */}
        <div className="w-full md:w-1/2 p-8 md:p-10 flex flex-col items-center justify-center relative"
          style={{ background: 'linear-gradient(160deg, #2A7F8F 0%, #1B6B7D 50%, #165A6B 100%)' }}>

          {/* Logo */}
          <div className="w-20 h-20 rounded-2xl flex items-center justify-center mb-6 shadow-xl"
            style={{ background: 'linear-gradient(135deg, #34d399 0%, #059669 100%)' }}>
            <ParkingCircle className="w-11 h-11 text-white" />
          </div>

          {/* Brand Text */}
          <h2 className="text-2xl md:text-3xl font-bold text-white text-center tracking-wide mb-1">
            PARKO(ປາຣ໌ຄໂຄ)
          </h2>
          <p className="text-lg md:text-xl font-bold text-white/90 text-center mb-10">
            ໂປຣແກຣມບໍລິຫານຈັດການບ່ອນຈອດລົດ
          </p>

          {/* Demo Credentials Card */}
          <div className="w-full max-w-[280px] bg-white/95 rounded-xl p-4 shadow-lg backdrop-blur-sm">
            <p className="text-xs text-gray-500 font-bold text-center mb-3 tracking-wide">
              Demo Credentials
            </p>
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="text-center">
                <span className="inline-block px-3 py-1 rounded-full text-xs font-bold bg-primary-100 text-primary-700">
                  Admin
                </span>
                <p className="text-gray-600 font-medium mt-1.5">admin / admin123</p>
              </div>
              <div className="text-center border-l border-gray-200">
                <span className="inline-block px-3 py-1 rounded-full text-xs font-bold bg-secondary-100 text-secondary-700">
                  Staff
                </span>
                <p className="text-gray-600 font-medium mt-1.5">staff01 / staff123</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <p className="text-center text-gray-500 text-sm font-bold mt-8 tracking-wide">
        COPYRIGHT © 2026 All rights reserved.
      </p>
    </div>
  );
}
