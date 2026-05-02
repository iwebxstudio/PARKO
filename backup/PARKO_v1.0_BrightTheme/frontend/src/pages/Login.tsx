// ============================================
// PARKO — Login Page
// Modern dark theme login with gradient
// ============================================
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { ParkingCircle, Eye, EyeOff, Loader2 } from 'lucide-react';
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
    <div className="min-h-screen flex items-center justify-center bg-gray-50 gradient-mesh p-4">
      <div className="w-full max-w-md animate-fade-in">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl gradient-primary shadow-xl shadow-primary-500/20 mb-4">
            <ParkingCircle className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-wide">PARKO</h1>
          <p className="text-gray-500 text-sm mt-1">Parking Management System</p>
        </div>

        {/* Login Form */}
        <div className="glass-card p-8">
          <h2 className="text-xl font-bold text-gray-900 mb-6 text-center">ເຂົ້າສູ່ລະບົບ</h2>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-bold text-gray-600 mb-2">Username / Email / Phone</label>
              <input
                id="login-username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="input-field"
                placeholder="admin, staff01, or 020..."
                autoComplete="username"
                autoFocus
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-600 mb-2">Password</label>
              <div className="relative">
                <input
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input-field pr-12"
                  placeholder="Enter password"
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            <button
              id="login-submit"
              type="submit"
              disabled={loading}
              className="btn-primary w-full flex items-center justify-center gap-2 text-base"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Logging in...
                </>
              ) : (
                'ເຂົ້າສູ່ລະບົບ (Login)'
              )}
            </button>
          </form>

          {/* Demo credentials */}
          <div className="mt-6 p-4 rounded-xl bg-gray-50 border border-gray-100">
            <p className="text-xs text-gray-500 font-bold text-center mb-2">Demo Credentials</p>
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="text-center">
                <span className="badge badge-active">Admin</span>
                <p className="text-gray-600 font-medium mt-1">admin / admin123</p>
              </div>
              <div className="text-center">
                <span className="badge badge-completed">Staff</span>
                <p className="text-gray-600 font-medium mt-1">staff01 / staff123</p>
              </div>
            </div>
          </div>
          
          <div className="text-center mt-6">
            <p className="text-gray-500 text-sm">
              ຍັງບໍ່ມີບັນຊີບໍ? <Link to="/register" className="text-primary-600 font-bold hover:text-primary-700">ລົງທະບຽນທີ່ນີ້</Link>
            </p>
          </div>
        </div>

        <p className="text-center text-gray-400 text-xs mt-6 font-medium">
          PARKO v1.0 — Parking Management System
        </p>
      </div>
    </div>
  );
}
