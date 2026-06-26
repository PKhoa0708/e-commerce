import React, { useState, useContext, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { authAPI } from '../services/api';
import { Phone, Mail, Lock, Eye, EyeOff, User, CheckCircle } from 'lucide-react';
import shoppersImg from '../assets/shoppers.png';

const Register = () => {
  const { loginWithGoogle, isAuthenticated } = useContext(AuthContext);
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [emailOrPhone, setEmailOrPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPopup, setShowPopup] = useState(false);
  const [popupMessage, setPopupMessage] = useState('');
  const [countdown, setCountdown] = useState(3);
  const countdownRef = useRef(null);

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/');
    }
  }, [isAuthenticated, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!name.trim()) {
      setErrorMsg('Vui lòng nhập Họ và tên.');
      return;
    }
    const input = emailOrPhone.trim();
    if (!input) {
      setErrorMsg('Vui lòng nhập Email hoặc Số điện thoại.');
      return;
    }

    // Determine if email or phone
    const isEmail = input.includes('@') || /[a-zA-Z]/.test(input);

    if (isEmail) {
      const emailRegex = /^[a-zA-Z0-9._%+-]+@gmail\.com$/i;
      if (!emailRegex.test(input)) {
        setErrorMsg('Email không hợp lệ');
        return;
      }
    } else {
      const phoneDigits = input.replace(/\D/g, '');
      if (phoneDigits.length !== 10 || input !== phoneDigits) {
        setErrorMsg('Số điện thoại không hợp lệ');
        return;
      }
      if (phoneDigits[0] !== '0') {
        setErrorMsg('Số điện thoại không hợp lệ');
        return;
      }
      if (phoneDigits[0] === phoneDigits[1]) {
        setErrorMsg('Số điện thoại không hợp lệ');
        return;
      }
      const allSame = phoneDigits.split('').every(d => d === phoneDigits[0]);
      if (allSame) {
        setErrorMsg('Số điện thoại không hợp lệ');
        return;
      }
    }

    if (!password) {
      setErrorMsg('Vui lòng nhập Mật khẩu.');
      return;
    }
    if (password.length < 6) {
      setErrorMsg('Mật khẩu phải có ít nhất 6 ký tự.');
      return;
    }

    setLoading(true);
    try {
      await authAPI.register(name, input, password);
      triggerSuccessPopup('Đăng ký tài khoản thành công!');
    } catch (err) {
      setErrorMsg(err.message || 'Có lỗi xảy ra khi đăng ký. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  // --- Success popup with countdown logic ---
  const triggerSuccessPopup = (message, redirectPath = '/login') => {
    setShowPopup(true);
    setPopupMessage(message);
    setCountdown(3);

    let sec = 3;
    countdownRef.current = setInterval(() => {
      sec -= 1;
      setCountdown(sec);
      if (sec <= 0) {
        clearInterval(countdownRef.current);
        setShowPopup(false);
        navigate(redirectPath);
      }
    }, 1000);
  };

  // Cleanup interval on unmount
  useEffect(() => {
    return () => {
      if (countdownRef.current) clearInterval(countdownRef.current);
    };
  }, []);

  const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

  const handleGoogleCredentialResponse = async (response) => {
    setErrorMsg('');
    setSuccessMsg('');
    setLoading(true);
    try {
      await loginWithGoogle(response.credential);
      triggerSuccessPopup('Đăng nhập/Đăng ký bằng Google thành công!', '/');
    } catch (err) {
      setErrorMsg(err.message || 'Xác thực Google thất bại.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!googleClientId) return;

    const initGoogle = () => {
      if (typeof window.google === 'undefined') return;
      window.google.accounts.id.initialize({
        client_id: googleClientId,
        callback: handleGoogleCredentialResponse,
      });

      const btnContainer = document.getElementById('google-signup-btn');
      if (btnContainer) {
        window.google.accounts.id.renderButton(btnContainer, {
          theme: 'outline',
          size: 'large',
          width: btnContainer.offsetWidth || 350,
          text: 'signup_with',
          shape: 'pill'
        });
      }
    };

    const timer = setTimeout(initGoogle, 500);
    return () => clearTimeout(timer);
  }, [googleClientId]);

  const handleGoogleSignupPlaceholder = () => {
    alert('Vui lòng cấu hình VITE_GOOGLE_CLIENT_ID trong tệp .env ở frontend để kích hoạt đăng ký Google chính thức.');
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-0 sm:p-4">

      {/* ── Success Popup Overlay ── */}
      {showPopup && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm" style={{ animation: 'fadeIn 0.3s ease-out' }}>
          <div className="bg-white rounded-3xl shadow-2xl p-8 mx-4 max-w-sm w-full text-center" style={{ animation: 'popIn 0.4s cubic-bezier(0.34,1.56,0.64,1)' }}>
            {/* Animated check icon */}
            <div className="mx-auto mb-4 w-20 h-20 rounded-full bg-emerald-50 flex items-center justify-center" style={{ animation: 'scaleIn 0.5s ease-out' }}>
              <CheckCircle className="w-12 h-12 text-emerald-500" strokeWidth={2} />
            </div>
            <h3 className="text-xl font-bold text-slate-800 mb-2">{popupMessage}</h3>
            <p className="text-sm text-slate-500 mb-5">Tự động chuyển về trang Đăng nhập sau</p>
            {/* Countdown circle */}
            <div className="mx-auto w-14 h-14 relative">
              <svg className="w-14 h-14 -rotate-90" viewBox="0 0 56 56">
                <circle cx="28" cy="28" r="24" fill="none" stroke="#e2e8f0" strokeWidth="4" />
                <circle
                  cx="28" cy="28" r="24" fill="none"
                  stroke="#10b981" strokeWidth="4"
                  strokeLinecap="round"
                  strokeDasharray={2 * Math.PI * 24}
                  strokeDashoffset={2 * Math.PI * 24 * (1 - countdown / 3)}
                  style={{ transition: 'stroke-dashoffset 1s linear' }}
                />
              </svg>
              <span className="absolute inset-0 flex items-center justify-center text-lg font-bold text-emerald-600">{countdown}</span>
            </div>
          </div>
        </div>
      )}

      {/* Inline keyframe animations for the popup */}
      <style>{`
        @keyframes fadeIn { from { opacity: 0 } to { opacity: 1 } }
        @keyframes popIn { from { opacity: 0; transform: scale(0.85) } to { opacity: 1; transform: scale(1) } }
        @keyframes scaleIn { from { transform: scale(0) } 60% { transform: scale(1.15) } to { transform: scale(1) } }
      `}</style>
      {/* Simulation Device Frame / Card Wrapper */}
      <div className="w-full max-w-md bg-slate-50 min-h-screen sm:min-h-[850px] sm:rounded-[40px] sm:shadow-2xl overflow-hidden flex flex-col justify-between border-0 sm:border-8 border-slate-950 relative">

        {/* Device Top Bar Mockup (only visible on sm screens and up) */}
        <div className="hidden sm:flex justify-between items-center px-6 py-3 bg-white border-b border-slate-100 text-xs font-semibold text-slate-500">
          <span>10:09 AM</span>
          <div className="flex items-center gap-1.5">
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 3c-4.97 0-9 4.03-9 9 0 2.12.74 4.07 1.97 5.61L4.35 19.4c-.39.39-.39 1.02 0 1.41.39.39 1.02.39 1.41 0l1.9-1.9C9.07 19.58 10.48 20 12 20c4.97 0 9-4.03 9-9s-4.03-9-9-9zm0 15c-3.31 0-6-2.69-6-6s2.69-6 6-6 6 2.69 6 6-2.69 6-6 6z" />
            </svg>
            <span>88%</span>
            <div className="w-5 h-2.5 border border-slate-400 rounded-sm p-0.5 flex">
              <div className="bg-slate-500 w-full h-full rounded-2xs"></div>
            </div>
          </div>
        </div>

        {/* Scrollable Container */}
        <div className="flex-1 flex flex-col justify-between">

          {/* Header & Logo */}
          <div className="px-6 pt-8 pb-4 text-center bg-white">
            <div className="flex items-center justify-center gap-2 mb-4">
              {/* UrbanCart Logo SVG — matching reference design */}
              <svg className="w-11 h-11 flex-shrink-0" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
                {/* Speed lines (orange) */}
                <line x1="2" y1="20" x2="12" y2="20" stroke="#e47937" strokeWidth="3" strokeLinecap="round" />
                <line x1="0" y1="27" x2="14" y2="27" stroke="#e47937" strokeWidth="3" strokeLinecap="round" />
                <line x1="3" y1="34" x2="11" y2="34" stroke="#e47937" strokeWidth="3" strokeLinecap="round" />

                {/* Cart body (dark navy frame) */}
                <path
                  d="M18 16 L16 42 C15.5 45 17.5 47 20.5 47 L44.5 47 C47.5 47 49.5 45 50 42 L54 16"
                  stroke="#1a3150"
                  strokeWidth="5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  fill="none"
                />

                {/* Cart handle (dark navy, extending up-right) */}
                <path
                  d="M54 16 L58 10"
                  stroke="#1a3150"
                  strokeWidth="5"
                  strokeLinecap="round"
                />

                {/* Orange bag/item inside cart */}
                <path
                  d="M22 22 L20.5 40 C20.3 41.5 21.5 42.5 23 42.5 L43 42.5 C44.5 42.5 45.7 41.5 45.5 40 L44 22 Z"
                  fill="#e47937"
                />

                {/* Bag handle detail */}
                <path
                  d="M29 22 C29 17 37 17 37 22"
                  stroke="#e47937"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  fill="none"
                />

                {/* Wheels */}
                <circle cx="23" cy="53" r="4" fill="#1a3150" />
                <circle cx="43" cy="53" r="4" fill="#1a3150" />
              </svg>
              <span className="text-[28px] font-extrabold tracking-tight select-none">
                <span className="text-[#1a3150]">Urban</span>
                <span className="text-[#e47937]">Cart</span>
              </span>
            </div>

            {/* Shopper Street Illustration */}
            <div className="w-full h-44 overflow-hidden rounded-2xl bg-orange-50 flex items-center justify-center border border-orange-100 shadow-inner">
              <img
                src={shoppersImg}
                alt="Shoppers on street"
                className="w-full h-full object-cover transform hover:scale-105 transition duration-500"
              />
            </div>
          </div>

          {/* White Register Form Card Overlay */}
          <div className="bg-white px-6 pb-8 pt-4 rounded-t-[36px] shadow-[0_-12px_24px_rgba(0,0,0,0.03)] flex-1 flex flex-col justify-between border-t border-slate-100">
            <div>
              {/* Title Header */}
              <div className="text-center mb-6">
                <h2 className="text-2xl font-bold text-slate-800">Tham gia UrbanCart</h2>
                <p className="text-sm text-slate-500 mt-1">Đăng ký tài khoản mua sắm mới</p>
              </div>

              {/* Error and Success alerts */}
              {errorMsg && (
                <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-xl text-xs font-semibold flex items-center gap-2 border border-red-100 animate-pulse">
                  <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <circle cx="12" cy="12" r="10" />
                    <line x1="12" y1="8" x2="12" y2="12" />
                    <line x1="12" y1="16" x2="12.01" y2="16" />
                  </svg>
                  <span>{errorMsg}</span>
                </div>
              )}
              {successMsg && (
                <div className="mb-4 p-3 bg-emerald-50 text-emerald-700 rounded-xl text-xs font-semibold flex items-center gap-2 border border-emerald-100">
                  <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  <span>{successMsg}</span>
                </div>
              )}

              {/* Register Form */}
              <form onSubmit={handleSubmit} className="space-y-4">

                {/* Full Name Input */}
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
                    <User className="w-5 h-5" />
                  </div>
                  <input
                    type="text"
                    placeholder="Họ tên (Full Name)"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    disabled={loading}
                    className="w-full pl-11 pr-4 py-3.5 bg-slate-50 text-slate-800 placeholder-slate-400 rounded-full border border-slate-200 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-[#e47937] transition-all text-sm font-medium"
                  />
                </div>

                {/* Email / Phone Input */}
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
                    {emailOrPhone.includes('@') || /[a-zA-Z]/.test(emailOrPhone) ? (
                      <Mail className="w-5 h-5" />
                    ) : (
                      <Phone className="w-5 h-5" />
                    )}
                  </div>
                  <input
                    type="text"
                    placeholder="Email hoặc Số điện thoại"
                    value={emailOrPhone}
                    onChange={(e) => setEmailOrPhone(e.target.value)}
                    disabled={loading}
                    className="w-full pl-11 pr-4 py-3.5 bg-slate-50 text-slate-800 placeholder-slate-400 rounded-full border border-slate-200 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-[#e47937] transition-all text-sm font-medium"
                  />
                </div>

                {/* Password Input */}
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
                    <Lock className="w-5 h-5" />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Mật khẩu"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={loading}
                    className="w-full pl-11 pr-12 py-3.5 bg-slate-50 text-slate-800 placeholder-slate-400 rounded-full border border-slate-200 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-[#e47937] transition-all text-sm font-medium"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    tabIndex="-1"
                    className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-slate-600 focus:outline-none"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>

                {/* Submit Button - Orange Color */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3.5 bg-[#e47937] text-white font-bold rounded-full shadow-lg shadow-[#e47937]/20 hover:bg-[#d0672a] active:scale-[0.99] transition-all duration-150 flex items-center justify-center gap-2 text-sm tracking-wide mt-4"
                >
                  {loading ? (
                    <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                  ) : (
                    'ĐĂNG KÝ'
                  )}
                </button>
              </form>

              {/* Separator */}
              <div className="flex items-center my-6">
                <div className="flex-grow border-t border-slate-200"></div>
                <span className="px-3 text-[10px] font-bold text-slate-400 tracking-wider">HOẶC ĐĂNG KÝ VỚI</span>
                <div className="flex-grow border-t border-slate-200"></div>
              </div>

              {/* Google Register Button */}
              {/* Google Register Button */}
              {googleClientId ? (
                <div id="google-signup-btn" className="w-full flex justify-center mt-2"></div>
              ) : (
                <button
                  type="button"
                  onClick={handleGoogleSignupPlaceholder}
                  className="w-full py-3 bg-white text-slate-700 font-semibold border border-slate-200 rounded-full hover:bg-slate-50 transition-all flex items-center justify-center gap-3 text-sm shadow-sm"
                >
                  {/* Official Google G Logo SVG */}
                  <svg className="w-5 h-5 flex-shrink-0" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22c-.87-2.6-2.86-4.53-6.16-4.53z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                    />
                  </svg>
                  <span>Đăng ký với Google</span>
                </button>
              )}
            </div>

            {/* Bottom Login Prompt */}
            <div className="text-center text-xs font-semibold text-slate-500 mt-6">
              Đã có tài khoản?{' '}
              <Link to="/login" className="text-sky-900 hover:underline">
                Đăng nhập ngay
              </Link>
            </div>

          </div>

        </div>

      </div>
    </div>
  );
};

export default Register;
