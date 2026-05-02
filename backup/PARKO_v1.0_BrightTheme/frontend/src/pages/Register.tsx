// PARKO — Register Page
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { LogIn, UserPlus } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../api/client';

export default function Register() {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [password, setPassword] = useState('');
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
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4 relative overflow-hidden">
      {/* Background Decor */}
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-primary-100 blur-[120px] rounded-full" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-secondary-100 blur-[120px] rounded-full" />

      <div className="glass-card w-full max-w-md p-8 relative z-10">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-br from-primary-400 to-secondary-500 rounded-2xl mx-auto flex items-center justify-center mb-4 shadow-lg shadow-primary-500/20">
            <UserPlus size={32} className="text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">ລົງທະບຽນ PARKO</h1>
          <p className="text-gray-500">ສ້າງບັນຊີຜູ້ໃຊ້ໃໝ່ສຳລັບພະນັກງານ</p>
        </div>

        <form onSubmit={handleRegister} className="space-y-4">
          <div>
            <label className="block text-sm font-bold text-gray-600 mb-1">ຊື່ຜູ້ໃຊ້ (Username)</label>
            <input type="text" required value={username} onChange={(e) => setUsername(e.target.value)}
              className="input-field" placeholder="staff02" />
          </div>
          <div>
            <label className="block text-sm font-bold text-gray-600 mb-1">ອີເມວ (Email)</label>
            <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
              className="input-field" placeholder="staff@parko.com" />
          </div>
          <div>
            <label className="block text-sm font-bold text-gray-600 mb-1">ເບີໂທລະສັບ (Phone) - ທາງເລືອກ</label>
            <input type="tel" value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)}
              className="input-field" placeholder="020 9999 9999" />
          </div>
          <div>
            <label className="block text-sm font-bold text-gray-600 mb-1">ລະຫັດຜ່ານ (Password)</label>
            <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)}
              className="input-field" placeholder="••••••••" />
          </div>

          <button type="submit" disabled={loading} className="btn-primary w-full mt-6 py-3 text-lg flex items-center justify-center gap-2">
            {loading ? <span className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full" /> : <UserPlus size={20} />}
            ລົງທະບຽນ
          </button>
          
          <div className="text-center mt-4">
            <p className="text-gray-500 text-sm">
              ມີບັນຊີແລ້ວບໍ? <Link to="/login" className="text-primary-600 font-bold hover:text-primary-700">ເຂົ້າສູ່ລະບົບ</Link>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}
