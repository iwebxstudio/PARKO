// ============================================
// PARKO — Register Page
// Split-panel layout: Orange form + Teal brand
// Matching the Login page design
// ============================================
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ParkingCircle, UserPlus, Eye, EyeOff, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../api/client';

export default function Register() {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post('/auth/register', { username, email, phoneNumber, password });
      toast.success('ລົງທະບຽນສຳເລັດ! ກະລຸນາເຂົ້າສູ່ລະບົບ');
      navigate('/login');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'ການລົງທະບຽນຜິດພາດ');
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
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-0 text-center">
            ລົງທະບຽນ
          </h1>
          <p className="text-gray-900 text-base font-bold text-center mb-6">
            ສ້າງບັນຊີໃໝ່ສຳລັບພະນັກງານ
          </p>

          {/* Form */}
          <form onSubmit={handleRegister} className="space-y-4">
            <div>
              <label className="block text-sm font-bold text-gray-800 mb-1.5">
                ຊື່ຜູ້ໃຊ້ (Username)
              </label>
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-4 py-3 bg-white text-gray-900 placeholder-gray-400 border-none outline-none shadow-md focus:ring-2 focus:ring-white/50 transition-all duration-200"
                placeholder="staff02"
                autoFocus
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-800 mb-1.5">
                ອີເມວ (Email)
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 bg-white text-gray-900 placeholder-gray-400 border-none outline-none shadow-md focus:ring-2 focus:ring-white/50 transition-all duration-200"
                placeholder="staff@parko.com"
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-800 mb-1.5">
                ເບີໂທລະສັບ (Phone)
              </label>
              <input
                type="tel"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                className="w-full px-4 py-3 bg-white text-gray-900 placeholder-gray-400 border-none outline-none shadow-md focus:ring-2 focus:ring-white/50 transition-all duration-200"
                placeholder="020 9999 9999"
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-800 mb-1.5">
                ລະຫັດຜ່ານ (Password)
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 pr-12 bg-white text-gray-900 placeholder-gray-400 border-none outline-none shadow-md focus:ring-2 focus:ring-white/50 transition-all duration-200"
                  placeholder="••••••••"
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

            {/* Register Button */}
            <button
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
                  ກຳລັງລົງທະບຽນ...
                </>
              ) : (
                <>
                  <UserPlus size={20} />
                  ລົງທະບຽນ (Register)
                </>
              )}
            </button>
          </form>

          {/* Login Link */}
          <div className="text-center mt-5">
            <p className="text-gray-800 text-sm font-bold">
              ມີບັນຊີແລ້ວບໍ?{' '}
              <Link to="/login" className="font-bold text-white underline underline-offset-2 hover:text-gray-100 transition-colors">
                ເຂົ້າສູ່ລະບົບ
              </Link>
            </p>
          </div>
        </div>

        {/* ===== RIGHT PANEL — Teal Brand ===== */}
        <div className="w-full md:w-1/2 p-8 md:p-10 flex flex-col items-center justify-center"
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
