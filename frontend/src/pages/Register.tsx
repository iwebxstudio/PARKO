// ============================================
// PARKO — ໜ້າລົງທະບຽນຜູ້ໃຊ້ງານໃໝ່ (Register Page)
// ໜ້າທີ່: ຈັດການການລົງທະບຽນບັນຊີຜູ້ໃຊ້ງານໃໝ່ເຂົ້າສູ່ລະບົບ ໂດຍອອກແບບແຍກສອງຝັ່ງຄືກັນກັບໜ້າເຂົ້າສູ່ລະບົບ
// ດ້ານຊ້າຍ: ແຜງແບຣນສີແດງ (Red Brand Panel) | ດ້ານຂວາ: ຟອມປ້ອນຂໍ້ມູນສີຂາວ (White Form Panel)
// ============================================
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { User, Mail, Phone, Lock, Eye, EyeOff, Loader2, UserPlus } from 'lucide-react';
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
    <div className="auth-page-wrapper" style={styles.pageWrapper}>
      {/* ກຸ່ມອົງປະກອບກາງໜ້າຈໍ: ບັດລົງທະບຽນ ແລະ ແຖບທ້າຍໜ້າສະແດງລິຂະສິດ */}
      <div className="auth-card-group" style={styles.cardGroup}>

        {/* ບັດຫຼັກຂອງການລົງທະບຽນ (Main Card) */}
        <div className="auth-card" style={styles.card}>

          {/* ===== ແຜງດ້ານຊ້າຍ — ຂໍ້ມູນແບຣນ PARKO (ສີແດງ) ===== */}
          <div className="auth-brand-panel" style={styles.brandPanel}>
            {/* ໂລໂກ້ລະບົບ — ກ່ອງສີ່ຫຼ່ຽມພ້ອມຕົວອັກສອນ P ໃນວົງມົນ */}
            <div className="auth-logo-box" style={styles.logoBox}>
              <div className="auth-logo-inner" style={styles.logoInnerCircle}>P</div>
            </div>

            {/* ຂໍ້ຄວາມຫົວຂໍ້ ແລະ ຄຳອະທິບາຍແບຣນ */}
            <h2 className="auth-brand-title" style={styles.brandTitle}>PARKO SYSTEM</h2>
            <p className="auth-brand-subtitle" style={styles.brandSubtitle}>ໂປຣແກຣມບໍລິຫານຈັດການບ່ອນຈອດລົດ</p>
            <p className="auth-version-tag" style={styles.versionTag}>VERSION RC1</p>
          </div>

          {/* ===== ແຜງດ້ານຂວາ — ຟອມປ້ອນຂໍ້ມູນລົງທະບຽນ (ສີຂາວ) ===== */}
          <div className="auth-form-panel" style={styles.formPanel}>

            {/* ຫົວຂໍ້ຟອມລົງທະບຽນ */}
            <h1 className="auth-form-title" style={styles.formTitle}>ລົງທະບຽນ/SignUp</h1>

            {/* ຟອມຮັບຂໍ້ມູນການລົງທະບຽນ */}
            <form onSubmit={handleRegister} style={{ width: '100%' }}>

              {/* ຊ່ອງປ້ອນຊື່ຜູ້ໃຊ້ງານ (Username) */}
              <fieldset style={styles.fieldset}>
                <legend style={styles.legend}>ຊື່ຜູ້ໃຊ້/USERNAME</legend>
                <div style={styles.inputWrapper}>
                  <User style={styles.inputIcon} />
                  <input
                    id="register-username"
                    type="text"
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    style={styles.input}
                    placeholder="ປ້ອນຊື່ຜູ້ໃຊ້/USERNAME"
                    autoComplete="username"
                    autoFocus
                  />
                </div>
              </fieldset>

              {/* ຊ່ອງປ້ອນອີເມວ (Email) */}
              <fieldset style={{ ...styles.fieldset, marginTop: 14 }}>
                <legend style={styles.legend}>ອີເມວ/EMAIL</legend>
                <div style={styles.inputWrapper}>
                  <Mail style={styles.inputIcon} />
                  <input
                    id="register-email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    style={styles.input}
                    placeholder="ປ້ອນອີເມວ/EMAIL"
                    autoComplete="email"
                  />
                </div>
              </fieldset>

              {/* ຊ່ອງປ້ອນເບີໂທລະສັບ (Phone Number) */}
              <fieldset style={{ ...styles.fieldset, marginTop: 14 }}>
                <legend style={styles.legend}>ເບີໂທລະສັບ/PHONE</legend>
                <div style={styles.inputWrapper}>
                  <Phone style={styles.inputIcon} />
                  <input
                    id="register-phone"
                    type="tel"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    style={styles.input}
                    placeholder="ປ້ອນເບີໂທລະສັບ/PHONE"
                    autoComplete="tel"
                  />
                </div>
              </fieldset>

              {/* ຊ່ອງປ້ອນລະຫັດຜ່ານ (Password) */}
              <fieldset style={{ ...styles.fieldset, marginTop: 14 }}>
                <legend style={styles.legend}>ລະຫັດຜ່ານ/PASSWORD</legend>
                <div style={styles.inputWrapper}>
                  <Lock style={styles.inputIcon} />
                  <input
                    id="register-password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    style={styles.input}
                    placeholder="ປ້ອນລະຫັດຜ່ານ/PASSWORD"
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    style={styles.eyeButton}
                  >
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
              </fieldset>

              {/* ປຸ່ມກົດສົ່ງຟອມລົງທະບຽນ (Submit Button) */}
              <button
                id="register-submit"
                type="submit"
                disabled={loading}
                style={{
                  ...styles.submitButton,
                  marginTop: 18,
                  background: loading ? '#888' : '#555',
                  cursor: loading ? 'not-allowed' : 'pointer',
                }}
              >
                {loading ? (
                  <>
                    <Loader2 style={{ width: 20, height: 20, animation: 'spin 1s linear infinite' }} />
                    ກຳລັງລົງທະບຽນ...
                  </>
                ) : (
                  <>
                    <UserPlus style={{ width: 20, height: 20 }} />
                    ລົງທະບຽນ/SignUp
                  </>
                )}
              </button>
            </form>

            {/* ລິ້ງກ໌ສຳລັບກັບໄປໜ້າເຂົ້າສູ່ລະບົບ */}
            <div style={styles.registerRow}>
              <span style={{ color: '#555', fontSize: 14 }}>ມີບັນຊີແລ້ວບໍ? </span>
              <Link to="/login" style={styles.registerLink}>
                ເຂົ້າສູ່ລະບົບທີ່ນີ້
              </Link>
            </div>
          </div>
        </div>

        {/* ແຖບທ້າຍໜ້າສະແດງລິຂະສິດ (Footer) */}
        <div className="auth-footer" style={styles.footer}>
          <div className="auth-footer-inner" style={styles.footerInner}>
            <p className="auth-footer-line" style={styles.footerLine1}>Powered by iwebxstudio technology</p>
            <p className="auth-footer-line" style={styles.footerLine2}>© 2026 Parko.All rights reserved.</p>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ============================================
   ຮູບແບບການຕົກແຕ່ງ (Inline Styles ໃຫ້ສອດຄ່ອງກັບໜ້າ Login)
   ============================================ */
const styles: Record<string, React.CSSProperties> = {
  pageWrapper: {
    minHeight: '100dvh',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '24px 16px',
    boxSizing: 'border-box',
    background: '#FDF1D7',
  },

  cardGroup: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    width: '100%',
    maxWidth: 740,
    margin: 0,
    padding: 0,
    boxSizing: 'border-box',
  },

  card: {
    width: '100%',
    display: 'flex',
    flexDirection: 'row',
    overflow: 'hidden',
    boxShadow: '0 8px 32px rgba(0,0,0,0.15)',
    margin: 0,
  },

  /* ---------- ແຜງດ້ານຊ້າຍ (ແບຣນສີແດງ) ---------- */
  brandPanel: {
    width: '50%',
    minHeight: 450,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '40px 28px',
    background: '#A52422',
    borderRight: '4px solid #FFAB10',
  },

  logoBox: {
    width: 66,
    height: 66,
    borderRadius: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: '#FFAB10',
    marginBottom: 18,
    border: '4px solid #fff',
  },

  logoInnerCircle: {
    fontSize: 28,
    fontWeight: 800,
    color: '#fff',
    letterSpacing: 0,
    lineHeight: 1,
  },

  brandTitle: {
    fontSize: 22,
    fontWeight: 800,
    color: '#fff',
    textAlign: 'center',
    letterSpacing: 2,
    margin: '0 0 2px 0',
  },

  brandSubtitle: {
    fontSize: 17,
    fontWeight: 700,
    color: '#fff',
    textAlign: 'center',
    margin: '0 0 2px 0',
  },

  versionTag: {
    fontSize: 15,
    fontWeight: 700,
    color: '#fff',
    textAlign: 'center',
    letterSpacing: 2,
    margin: 0,
  },

  /* ---------- ແຜງດ້ານຂວາ (ຟອມສີຂາວ) ---------- */
  formPanel: {
    width: '50%',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '36px 30px',
    background: '#fff',
  },

  formTitle: {
    fontSize: 20,
    fontWeight: 800,
    color: '#333',
    textAlign: 'center',
    margin: '0 0 20px 0',
  },

  /* ການນຳໃຊ້ fieldset ເພື່ອໃຫ້ມີເສັ້ນຂອບພ້ອມຂໍ້ຄວາມກຳກັບ (Legend) */
  fieldset: {
    border: '2px solid #5D5D5D',
    borderRadius: 0,
    padding: '4px 12px 8px 12px',
    margin: 0,
    width: '100%',
  },

  legend: {
    fontSize: 14,
    fontWeight: 700,
    color: '#555',
    padding: '0 6px',
    marginLeft: -2,
  },

  inputWrapper: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
  },

  inputIcon: {
    width: 20,
    height: 20,
    color: '#888',
    flexShrink: 0,
  },

  input: {
    flex: 1,
    border: 'none',
    outline: 'none',
    fontSize: 15,
    padding: '6px 0',
    background: 'transparent',
    color: '#333',
    fontFamily: 'inherit',
  },

  eyeButton: {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    color: '#888',
    padding: 4,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },

  /* ປຸ່ມກົດສົ່ງຟອມລົງທະບຽນ */
  submitButton: {
    width: '100%',
    padding: '14px 0',
    border: 'none',
    color: '#fff',
    fontSize: 16,
    fontWeight: 700,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    transition: 'all 0.2s ease',
    fontFamily: 'inherit',
  },

  /* ລິ້ງກ໌ສຳລັບກັບໄປໜ້າເຂົ້າສູ່ລະບົບ */
  registerRow: {
    marginTop: 18,
    textAlign: 'center',
  },

  registerLink: {
    fontSize: 14,
    fontWeight: 700,
    color: '#A52422',
    textDecoration: 'underline',
    textUnderlineOffset: 3,
  },

  /* ສ່ວນທ້າຍໜ້າສະແດງລິຂະສິດ */
  footer: {
    marginTop: 24,
    marginBottom: 0,
    textAlign: 'center',
    width: '100%',
    maxWidth: 740,
  },

  footerInner: {
    display: 'inline-block',
    textAlign: 'left',
  },

  footerLine1: {
    fontSize: 18,
    fontWeight: 800,
    color: '#333',
    margin: 0,
    lineHeight: 1.4,
  },

  footerLine2: {
    fontSize: 18,
    fontWeight: 800,
    color: '#333',
    margin: 0,
    lineHeight: 1.4,
  },
};
