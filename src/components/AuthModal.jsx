import React, { useState, useEffect } from 'react';
import { GOOGLE_CLIENT_ID, FACEBOOK_APP_ID } from '../config/oauth';

const TRAVEL_IMAGES = [
  'https://images.unsplash.com/photo-1528127269322-539801943592?q=80&w=800',
  'https://images.unsplash.com/photo-1559592413-7cec4d0cae2b?q=80&w=800',
  'https://images.unsplash.com/photo-1499793983690-e29da59ef1c2?q=80&w=800',
];
const heroImage = TRAVEL_IMAGES[Math.floor(Math.random() * TRAVEL_IMAGES.length)];

const IS_GOOGLE_CONFIGURED = GOOGLE_CLIENT_ID && !GOOGLE_CLIENT_ID.startsWith('YOUR_');
const IS_FB_CONFIGURED = FACEBOOK_APP_ID && !FACEBOOK_APP_ID.startsWith('YOUR_');

// Load Facebook SDK dynamically
function loadFacebookSDK() {
  if (window.FB || !IS_FB_CONFIGURED) return;
  window.fbAsyncInit = () => {
    window.FB.init({ appId: FACEBOOK_APP_ID, cookie: true, xfbml: false, version: 'v19.0' });
  };
  const s = document.createElement('script');
  s.src = 'https://connect.facebook.net/vi_VN/sdk.js';
  s.async = true;
  s.defer = true;
  document.head.appendChild(s);
}

function AuthModal({ isOpen, onClose, onAuthSuccess, defaultTab }) {
  const [isLogin, setIsLogin] = useState(defaultTab !== 'register');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [formData, setFormData] = useState({ username: '', password: '', full_name: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [oauthLoading, setOauthLoading] = useState(''); // 'google' | 'facebook' | ''

  useEffect(() => {
    setIsLogin(defaultTab !== 'register');
    setError('');
    setFormData({ username: '', password: '', full_name: '' });
  }, [defaultTab, isOpen]);

  // Load Facebook SDK when modal opens
  useEffect(() => {
    if (isOpen) loadFacebookSDK();
  }, [isOpen]);

  if (!isOpen) return null;

  // ─── OAuth helpers ───────────────────────────────────────────
  const callBackend = async (endpoint, body) => {
    const res = await fetch(`http://localhost:5000${endpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    return res.json();
  };

  const handleOAuthSuccess = (data) => {
    if (data.status === 'success') {
      localStorage.setItem('user', JSON.stringify(data.user));
      localStorage.setItem('token', data.token);
      onAuthSuccess(data.user);
      onClose();
    } else {
      setError(data.message || 'Đăng nhập thất bại!');
    }
  };

  // ─── Google ──────────────────────────────────────────────────
  const handleGoogleLogin = () => {
    if (!IS_GOOGLE_CONFIGURED) {
      setError('⚙️ Chưa cấu hình Google Client ID. Xem file src/config/oauth.js');
      return;
    }
    if (!window.google) {
      setError('Google SDK chưa tải xong, thử lại sau vài giây!');
      return;
    }
    setOauthLoading('google');
    setError('');
    try {
      const tokenClient = window.google.accounts.oauth2.initTokenClient({
        client_id: GOOGLE_CLIENT_ID,
        scope: 'openid email profile',
        callback: async (tokenResponse) => {
          if (tokenResponse.error) {
            setError('Đăng nhập Google bị hủy hoặc thất bại!');
            setOauthLoading('');
            return;
          }
          try {
            const data = await callBackend('/api/auth/google', { access_token: tokenResponse.access_token });
            handleOAuthSuccess(data);
          } catch {
            setError('Lỗi kết nối server!');
          }
          setOauthLoading('');
        },
      });
      tokenClient.requestAccessToken({ prompt: 'select_account' });
    } catch (err) {
      setError('Lỗi khởi động Google OAuth: ' + err.message);
      setOauthLoading('');
    }
  };

  // ─── Facebook ────────────────────────────────────────────────
  const handleFacebookLogin = () => {
    if (!IS_FB_CONFIGURED) {
      setError('⚙️ Chưa cấu hình Facebook App ID. Xem file src/config/oauth.js');
      return;
    }
    if (!window.FB) {
      setError('Facebook SDK chưa tải xong, thử lại sau vài giây!');
      return;
    }
    setOauthLoading('facebook');
    setError('');
    window.FB.login(async (response) => {
      if (response.authResponse) {
        const { accessToken, userID } = response.authResponse;
        try {
          const data = await callBackend('/api/auth/facebook', { accessToken, userID });
          handleOAuthSuccess(data);
        } catch {
          setError('Lỗi kết nối server!');
        }
      } else {
        setError('Đăng nhập Facebook bị hủy!');
      }
      setOauthLoading('');
    }, { scope: 'public_profile,email' });
  };

  // ─── Form submit ─────────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    const endpoint = isLogin ? '/api/login' : '/api/register';
    try {
      const data = await callBackend(endpoint, formData);
      if (data.status === 'success') {
        localStorage.setItem('user', JSON.stringify(data.user));
        localStorage.setItem('token', data.token);
        onAuthSuccess(data.user);
        onClose();
      } else {
        setError(data.message || 'Thông tin không chính xác.');
      }
    } catch {
      setError('Mất kết nối server. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  const isAnyLoading = loading || oauthLoading !== '';

  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center p-4 font-sans">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative w-full max-w-[820px] bg-white rounded-[2rem] overflow-hidden shadow-[0_40px_100px_rgba(0,0,0,0.5)] flex animate-in zoom-in-95 duration-300 border border-white/10">

        {/* LEFT: Travel Image */}
        <div className="hidden md:flex w-[40%] flex-shrink-0 relative flex-col justify-end overflow-hidden">
          <img src={heroImage} alt="Vietnam Travel" className="absolute inset-0 w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0A241A]/95 via-[#0A241A]/40 to-transparent" />
          <div className="relative z-10 p-8 pb-10">
            <div className="flex items-center gap-2 mb-6">
              <span className="text-2xl">🌍</span>
              <span className="text-white font-heading font-black text-xl">
                Wanderly<span className="text-[#D4AF37]">VietNam</span>
              </span>
            </div>
            <p className="text-[#D4AF37] text-[10px] font-black uppercase tracking-[0.4em] mb-2">Chào mừng bạn</p>
            <h2 className="text-white font-heading font-bold text-2xl leading-snug mb-3">
              Hành Trình Của Bạn<br />
              <span className="text-[#D4AF37] italic font-light">Bắt Đầu Từ Đây</span>
            </h2>
            <p className="text-white/50 text-xs leading-relaxed">
              Khám phá hàng nghìn điểm đến tuyệt vời trên khắp đất nước Việt Nam.
            </p>
          </div>
        </div>

        {/* RIGHT: Form */}
        <div className="flex-1 flex flex-col p-8 lg:p-10 relative bg-white overflow-y-auto max-h-[90vh]">
          {/* Close */}
          <button
            onClick={onClose}
            className="absolute top-5 right-6 w-8 h-8 flex items-center justify-center rounded-full text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-all text-lg font-bold"
          >✕</button>

          {/* Tab switcher */}
          <div className="flex bg-gray-100 rounded-xl p-1 mb-7">
            {['login', 'register'].map((tab) => (
              <button
                key={tab}
                onClick={() => { setIsLogin(tab === 'login'); setError(''); }}
                className={`flex-1 py-2.5 rounded-lg text-xs font-black uppercase tracking-widest transition-all duration-300 ${
                  (tab === 'login') === isLogin ? 'bg-white text-[#0A241A] shadow-sm' : 'text-gray-400 hover:text-gray-600'
                }`}
              >
                {tab === 'login' ? 'Đăng Nhập' : 'Đăng Ký'}
              </button>
            ))}
          </div>

          {/* Header */}
          <div className="mb-5">
            <h2 className="text-3xl font-heading font-bold text-[#0A241A] leading-tight">
              {isLogin ? 'Chào mừng trở lại!' : 'Tạo tài khoản mới'}
            </h2>
            <p className="text-gray-400 text-xs mt-1 tracking-[0.15em] uppercase font-medium">
              WanderlyVietNam · {isLogin ? 'Đăng nhập để tiếp tục' : 'Miễn phí · Mãi mãi'}
            </p>
          </div>

          {/* Social Login — TRÊN FORM */}
          <div className="flex gap-3 mb-5">
            {/* Google */}
            <button
              id="btn-google-login"
              onClick={handleGoogleLogin}
              disabled={isAnyLoading}
              className="flex-1 flex items-center justify-center gap-2.5 py-3 border-2 border-gray-200 rounded-xl hover:border-[#4285F4]/40 hover:bg-[#4285F4]/5 transition-all group disabled:opacity-60 disabled:cursor-not-allowed relative overflow-hidden"
            >
              {oauthLoading === 'google' ? (
                <svg className="w-4 h-4 animate-spin text-[#4285F4]" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                </svg>
              ) : (
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
              )}
              <span className="text-xs font-bold text-gray-600 group-hover:text-[#4285F4] transition-colors">
                {oauthLoading === 'google' ? 'Đang xử lý...' : 'Google'}
              </span>
            </button>

            {/* Facebook */}
            <button
              id="btn-facebook-login"
              onClick={handleFacebookLogin}
              disabled={isAnyLoading}
              className="flex-1 flex items-center justify-center gap-2.5 py-3 border-2 border-gray-200 rounded-xl hover:border-[#1877F2]/40 hover:bg-[#1877F2]/5 transition-all group disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {oauthLoading === 'facebook' ? (
                <svg className="w-4 h-4 animate-spin text-[#1877F2]" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                </svg>
              ) : (
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="#1877F2">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                </svg>
              )}
              <span className="text-xs font-bold text-gray-600 group-hover:text-[#1877F2] transition-colors">
                {oauthLoading === 'facebook' ? 'Đang xử lý...' : 'Facebook'}
              </span>
            </button>
          </div>

          {/* Divider */}
          <div className="flex items-center gap-3 mb-5">
            <div className="h-px flex-1 bg-gray-100" />
            <span className="text-[10px] font-bold text-gray-300 uppercase tracking-[0.2em]">Hoặc dùng email</span>
            <div className="h-px flex-1 bg-gray-100" />
          </div>

          {/* Error */}
          {error && (
            <div className="bg-red-50 text-red-600 text-xs font-bold p-3.5 rounded-xl mb-4 border border-red-100 flex items-center gap-2">
              <span>⚠️</span> {error}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>
                  </svg>
                </span>
                <input
                  type="text"
                  placeholder="Họ và tên đầy đủ"
                  className="w-full pl-11 pr-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl outline-none text-sm font-medium text-[#0A241A] placeholder-gray-400 focus:border-[#0A241A] focus:bg-white focus:ring-2 focus:ring-[#0A241A]/10 transition-all"
                  onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                  required
                />
              </div>
            )}

            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>
                </svg>
              </span>
              <input
                type="text"
                placeholder="Tên đăng nhập"
                value={formData.username}
                className="w-full pl-11 pr-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl outline-none text-sm font-medium text-[#0A241A] placeholder-gray-400 focus:border-[#0A241A] focus:bg-white focus:ring-2 focus:ring-[#0A241A]/10 transition-all"
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                required
              />
            </div>

            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/>
                </svg>
              </span>
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="Mật khẩu"
                value={formData.password}
                className="w-full pl-11 pr-12 py-3.5 bg-gray-50 border border-gray-200 rounded-xl outline-none text-sm font-medium text-[#0A241A] placeholder-gray-400 focus:border-[#0A241A] focus:bg-white focus:ring-2 focus:ring-[#0A241A]/10 transition-all"
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
              >
                {showPassword ? '🙈' : '👁️'}
              </button>
            </div>

            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer group">
                <input type="checkbox" className="hidden" checked={rememberMe} onChange={() => setRememberMe(!rememberMe)} />
                <div className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-all flex-shrink-0 ${rememberMe ? 'bg-[#0A241A] border-[#0A241A]' : 'border-gray-300'}`}>
                  {rememberMe && <span className="text-white text-[9px] font-black">✓</span>}
                </div>
                <span className="text-xs text-gray-500 group-hover:text-[#0A241A] transition-colors select-none">Ghi nhớ đăng nhập</span>
              </label>
              {isLogin && (
                <button type="button" className="text-xs font-bold text-[#0A241A]/60 hover:text-[#D4AF37] hover:underline underline-offset-2 transition-colors">
                  Quên mật khẩu?
                </button>
              )}
            </div>

            <button
              type="submit"
              disabled={isAnyLoading}
              className="w-full bg-[#0A241A] text-[#D4AF37] py-4 rounded-xl font-black uppercase tracking-[0.15em] text-sm hover:bg-[#D4AF37] hover:text-black transition-all duration-300 disabled:opacity-50 shadow-lg hover:shadow-[0_8px_25px_rgba(212,175,55,0.3)]"
            >
              {loading ? '⏳ Đang xử lý...' : (isLogin ? '→ Đăng Nhập' : '✦ Tạo Tài Khoản')}
            </button>
          </form>

          <p className="text-center text-xs text-gray-400 mt-5">
            {isLogin ? 'Chưa có tài khoản? ' : 'Đã có tài khoản? '}
            <button
              onClick={() => { setIsLogin(!isLogin); setError(''); }}
              className="font-black text-[#0A241A] hover:text-[#D4AF37] transition-colors underline underline-offset-2"
            >
              {isLogin ? 'Đăng ký ngay' : 'Đăng nhập'}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}

export default AuthModal;