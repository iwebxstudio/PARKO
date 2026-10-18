// ============================================
// PARKO — ໜ້າເຂົ້າສູ່ລະບົບ (Login Page)
// ໜ້າທີ່: ຈັດການການກວດສອບສິດເຂົ້າໃຊ້ງານລະບົບ ໂດຍແບ່ງໂຄງສ້າງອອກເປັນ 2 ສ່ວນ: ແຜງແບຣນສີແດງ (ຊ້າຍ) ແລະ ຟອມປ້ອນຂໍ້ມູນສີຂາວ (ຂວາ)
// ============================================
import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { ParkingCircle, Eye, EyeOff, Loader2, LogIn, User, Lock, Check, X, HelpCircle, Phone, KeyRound } from 'lucide-react';
import toast from 'react-hot-toast';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showForgotModal, setShowForgotModal] = useState(false);

  // ດຶງຂໍ້ມູນຊື່ບັນຊີຜູ້ໃຊ້ງານທີ່ເຄີຍບັນທຶກໄວ້ໃນ LocalStorage ອອກມາສະແດງອັດຕະໂນມັດ ຖ້າຜູ້ໃຊ້ເຄີຍເລືອກ "ຈື່ຂ້ອຍໄວ້" (Remember Me)
  useEffect(() => {
    const savedRemember = localStorage.getItem('parko_remember_me');
    const savedUsername = localStorage.getItem('parko_remember_username');
    if (savedRemember === 'true' && savedUsername) {
      setUsername(savedUsername);
      setRememberMe(true);
    }
  }, []);

  // ກວດຈັບການກົດປຸ່ມ Escape (ESC) ເທິງແປ້ນພິມ ເພື່ອປິດໜ້າຕ່າງປັອບອັບແຈ້ງລືມລະຫັດຜ່ານ
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && showForgotModal) {
        setShowForgotModal(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showForgotModal]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      toast.error('Please enter username and password');
      return;
    }

    setLoading(true);
    try {
      await login(username, password);

      // ບັນທຶກ ຫຼື ລຶບຊື່ບັນຊີຜູ້ໃຊ້ງານໃນ LocalStorage ຕາມສະຖານະຂອງຕົວເລືອກ "ຈື່ຂ້ອຍໄວ້" (Remember Me)
      if (rememberMe) {
        localStorage.setItem('parko_remember_me', 'true');
        localStorage.setItem('parko_remember_username', username.trim());
      } else {
        localStorage.removeItem('parko_remember_me');
        localStorage.removeItem('parko_remember_username');
      }

      toast.success('Login successful!');
      // ນຳທາງຜູ້ໃຊ້ໄປຍັງໜ້າລະບົບຕາມລະດັບສິດທິ (Role): ແອດມິນໄປໜ້າກວດອອກລົດ (Check-out) ສ່ວນພະນັກງານທົ່ວໄປໄປໜ້າກວດເຂົ້າລົດ (Check-in)
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      navigate(user.role === 'ADMIN' ? '/staff/check-out' : '/staff/check-in');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page-wrapper" style={styles.pageWrapper}>
      {/* ກຸ່ມອົງປະກອບກາງໜ້າຈໍ: ບັດເຂົ້າສູ່ລະບົບ ແລະ ແຖບທ້າຍໜ້າສະແດງລິຂະສິດ */}
      <div className="auth-card-group" style={styles.cardGroup}>

        {/* ບັດຫຼັກຂອງການເຂົ້າສູ່ລະບົບ (Main Card) */}
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

        {/* ===== ແຜງດ້ານຂວາ — ຟອມປ້ອນຂໍ້ມູນເຂົ້າສູ່ລະບົບ (ສີຂາວ) ===== */}
        <div className="auth-form-panel" style={styles.formPanel}>

          {/* ຫົວຂໍ້ຟອມເຂົ້າສູ່ລະບົບ */}
          <h1 className="auth-form-title" style={styles.formTitle}>ເຂົ້າສູ່ລະບົບ/SignIn</h1>

          {/* ຟອມຮັບຂໍ້ມູນການເຂົ້າສູ່ລະບົບ */}
          <form onSubmit={handleSubmit} style={{ width: '100%' }}>

            {/* ຊ່ອງປ້ອນຊື່ຜູ້ໃຊ້ງານ (Username) */}
            <fieldset style={styles.fieldset}>
              <legend style={styles.legend}>ຊື່ຜູ້ໃຊ້/USERNAME</legend>
              <div style={styles.inputWrapper}>
                <User style={styles.inputIcon} />
                <input
                  id="login-username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  style={styles.input}
                  placeholder="ປ້ອນຊື່ຜູ້ໃຊ້/USERNAME"
                  autoComplete="username"
                  autoFocus
                />
              </div>
            </fieldset>

            {/* ຊ່ອງປ້ອນລະຫັດຜ່ານ (Password) */}
            <fieldset style={{ ...styles.fieldset, marginTop: 18 }}>
              <legend style={styles.legend}>ລະຫັດຜ່ານ/PASSWORD</legend>
              <div style={styles.inputWrapper}>
                <Lock style={styles.inputIcon} />
                <input
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  style={styles.input}
                  placeholder="ປ້ອນລະຫັດຜ່ານ/PASSWORD"
                  autoComplete="current-password"
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

            {/* ຕົວເລືອກ ຈື່ຂ້ອຍໄວ້ ແລະ ລິ້ງກ໌ລືມລະຫັດຜ່ານ */}
            <div style={styles.optionsRow}>
              <label
                style={styles.rememberLabel}
                onClick={(e) => {
                  e.preventDefault();
                  setRememberMe((prev) => !prev);
                }}
              >
                <div
                  role="checkbox"
                  aria-checked={rememberMe}
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === ' ' || e.key === 'Enter') {
                      e.preventDefault();
                      setRememberMe((prev) => !prev);
                    }
                  }}
                  style={{
                    ...styles.checkboxBox,
                    ...(rememberMe ? styles.checkboxChecked : {}),
                  }}
                >
                  {rememberMe && <Check size={13} color="#fff" strokeWidth={3.5} />}
                </div>
                <span style={{ userSelect: 'none', cursor: 'pointer' }}>ຈື່ຂ້ອຍໄວ້</span>
              </label>

              <button
                type="button"
                style={styles.forgotLink}
                onClick={() => setShowForgotModal(true)}
              >
                ລືມລະຫັດຜ່ານ
              </button>
            </div>

            {/* ປຸ່ມກົດສົ່ງຟອມເຂົ້າສູ່ລະບົບ (Submit Button) */}
            <button
              id="login-submit"
              type="submit"
              disabled={loading}
              style={{
                ...styles.submitButton,
                background: loading ? '#888' : '#555',
                cursor: loading ? 'not-allowed' : 'pointer',
              }}
            >
              {loading ? (
                <>
                  <Loader2 style={{ width: 20, height: 20, animation: 'spin 1s linear infinite' }} />
                  Logging in...
                </>
              ) : (
                <>
                  <LogIn style={{ width: 20, height: 20 }} />
                  ເຂົ້າສູ່ລະບົບ/SignIn
                </>
              )}
            </button>
          </form>

          {/* ລິ້ງກ໌ໄປຫາໜ້າລົງທະບຽນບັນຊີໃໝ່ */}
          <div style={styles.registerRow}>
            <span style={{ color: '#555', fontSize: 14 }}>ຍັງບໍ່ມີບັນຊີ? </span>
            <Link to="/register" style={styles.registerLink}>
              ລົງທະບຽນທີ່ນີ້
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

      {/* ===== ໜ້າຕ່າງປັອບອັບ (Modal) — ແຈ້ງລືມລະຫັດຜ່ານ ແລະ ຂໍ້ມູນຕິດຕໍ່ຜູ້ດູແລລະບົບ ===== */}
      {showForgotModal && (
        <div
          style={styles.modalOverlay}
          onClick={() => setShowForgotModal(false)}
        >
          <div
            style={styles.modalContent}
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
          >
            {/* ສ່ວນຫົວຂອງໜ້າຕ່າງປັອບອັບ (Modal Header) */}
            <div style={styles.modalHeader}>
              <div style={styles.modalHeaderLeft}>
                <HelpCircle size={22} color="#FFFFFF" strokeWidth={2.4} />
                <span style={styles.modalHeaderTitle}>ລືມລະຫັດຜ່ານ?</span>
              </div>
              <button
                type="button"
                style={styles.modalCloseCircleBtn}
                onClick={() => setShowForgotModal(false)}
                aria-label="Close"
              >
                <X size={18} color="#BA2025" strokeWidth={3} />
              </button>
            </div>

            {/* ເນື້ອໃນຫຼັກຂອງໜ້າຕ່າງປັອບອັບ (Modal Body) */}
            <div style={styles.modalBody}>
              {/* ໄອຄອນຮູບກະແຈກາງໜ້າຕ່າງ */}
              <div style={styles.modalCenterIconBox}>
                <KeyRound size={46} color="#111827" strokeWidth={2.2} />
              </div>

              {/* ຫົວຂໍ້ຫຼັກ ແລະ ຂໍ້ຄວາມແນະນຳ */}
              <h3 style={styles.modalMainTitle}>ລືມລະຫັດຜ່ານ?</h3>
              <p style={styles.modalSubText1}>ແຈ້ງເຕືອນການຣີເຊັດລະຫັດຜ່ານ / Password Reset</p>
              <p style={styles.modalSubText2}>ຕິດຕໍ່ຜູ້ Admin ເພື່ອຂໍຣີເຊັດລະຫັດຜ່ານ</p>

              {/* ກ່ອງສີສົ້ມສະແດງເບີໂທສາຍດ່ວນ (Hotline) ຂອງຜູ້ດູແລລະບົບ */}
              <div style={styles.modalHotlineCard}>
                <div style={styles.modalHotlineIconWrap}>
                  <Phone size={36} color="#7A1B19" strokeWidth={2.4} />
                </div>
                <div style={styles.modalHotlineTextCol}>
                  <div style={styles.modalHotlineLine}>ເບີໂທຕິດຕໍ່ແອດມິນ (Hotline)</div>
                  <a
                    href="tel:+8562029195838"
                    style={{
                      ...styles.modalHotlineLine,
                      textDecoration: 'none',
                      display: 'inline-block',
                    }}
                  >
                    +8562029195838
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ============================================
   ຮູບແບບການຕົກແຕ່ງ (Inline Styles)
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
    minHeight: 400,
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
    margin: '0 0 22px 0',
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

  /* ແຖວຕົວເລືອກເພີ່ມເຕີມ (ຈື່ຂ້ອຍໄວ້ ແລະ ລືມລະຫັດຜ່ານ) */
  optionsRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 14,
    marginBottom: 20,
    width: '100%',
  },

  rememberLabel: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    fontSize: 14,
    color: '#555',
    cursor: 'pointer',
    fontWeight: 500,
  },

  checkboxBox: {
    width: 18,
    height: 18,
    border: '2px solid #5D5D5D',
    background: '#fff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    flexShrink: 0,
    transition: 'all 0.15s ease',
  },

  checkboxChecked: {
    background: '#A52422',
    borderColor: '#A52422',
  },

  forgotLink: {
    fontSize: 14,
    color: '#A52422',
    textDecoration: 'none',
    fontWeight: 600,
    cursor: 'pointer',
    background: 'none',
    border: 'none',
    padding: 0,
    fontFamily: 'inherit',
    outline: 'none',
  },

  /* ປຸ່ມກົດສົ່ງຟອມເຂົ້າສູ່ລະບົບ */
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

  /* ລິ້ງກ໌ສຳລັບລົງທະບຽນບັນຊີໃໝ່ */
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

  /* ໜ້າຕ່າງປັອບອັບແຈ້ງລືມລະຫັດຜ່ານ */
  modalOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    backdropFilter: 'blur(3px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 9999,
    padding: 16,
    boxSizing: 'border-box',
  },

  modalContent: {
    background: '#FFFFFF',
    width: '100%',
    maxWidth: 480,
    borderRadius: 0,
    boxShadow: '0 20px 45px rgba(0, 0, 0, 0.28)',
    position: 'relative',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
    boxSizing: 'border-box',
  },

  modalHeader: {
    background: '#BA2025',
    padding: '14px 20px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    boxSizing: 'border-box',
  },

  modalHeaderLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
  },

  modalHeaderTitle: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: 700,
    margin: 0,
    lineHeight: 1,
  },

  modalCloseCircleBtn: {
    width: 32,
    height: 32,
    borderRadius: '50%',
    background: '#FFFFFF',
    border: 'none',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 0,
    boxShadow: '0 2px 5px rgba(0, 0, 0, 0.15)',
  },

  modalBody: {
    padding: '30px 24px 34px 24px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    textAlign: 'center',
    boxSizing: 'border-box',
  },

  modalCenterIconBox: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },

  modalMainTitle: {
    fontSize: 24,
    fontWeight: 800,
    color: '#000000',
    margin: '0 0 6px 0',
    lineHeight: 1.3,
  },

  modalSubText1: {
    fontSize: 16,
    fontWeight: 700,
    color: '#000000',
    margin: '0 0 6px 0',
    lineHeight: 1.4,
  },

  modalSubText2: {
    fontSize: 16,
    fontWeight: 700,
    color: '#000000',
    margin: '0 0 24px 0',
    lineHeight: 1.4,
  },

  modalHotlineCard: {
    background: '#FACB82',
    borderRadius: 0,
    padding: '16px 24px',
    width: '100%',
    boxSizing: 'border-box',
    display: 'flex',
    alignItems: 'center',
    gap: 20,
  },

  modalHotlineIconWrap: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },

  modalHotlineTextCol: {
    display: 'flex',
    flexDirection: 'column',
    gap: 4,
    textAlign: 'left',
  },

  modalHotlineLine: {
    fontSize: 16,
    fontWeight: 700,
    color: '#7A1B19',
    lineHeight: 1.35,
  },
};
