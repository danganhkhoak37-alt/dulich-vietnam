import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import AuthModal from './AuthModal';

function Navbar() {
  const [user, setUser] = useState(JSON.parse(localStorage.getItem('user')));
  const [scrolled, setScrolled] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [authTab, setAuthTab] = useState('login');
  const [mobileOpen, setMobileOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  // --- HÀM CUỘN LÊN ĐẦU TRANG ---
  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth' // Cuộn mượt mà
    });
  };

  useEffect(() => {
    const handleStorage = () => setUser(JSON.parse(localStorage.getItem('user')));
    window.addEventListener('storage', handleStorage);
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    return () => {
      window.removeEventListener('storage', handleStorage);
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  useEffect(() => setMobileOpen(false), [location.pathname]);

  const handleLogout = () => {
    localStorage.removeItem('user');
    setUser(null);
    window.dispatchEvent(new Event('storage'));
    navigate('/');
    scrollToTop(); // Cuộn lên đầu khi đăng xuất
  };

  const openLogin = () => { setAuthTab('login'); setIsAuthOpen(true); setMobileOpen(false); };
  const openRegister = () => { setAuthTab('register'); setIsAuthOpen(true); setMobileOpen(false); };

  const navLinks = [
    { name: 'Trang chủ', path: '/' },
    { name: 'Gợi ý', path: '/suggestions' },
    { name: 'Cẩm nang', path: '/guide' },
    { name: 'Cộng đồng', path: '/community' },
    { name: 'Tin tức', path: '/news' },
  ];

  return (
    <>
      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        defaultTab={authTab}
        onAuthSuccess={(userData) => {
          setUser(userData);
          setIsAuthOpen(false);
        }}
      />

      <nav className={`fixed w-full top-0 z-50 transition-all duration-500 ${scrolled
          ? 'bg-[#0A241A]/95 backdrop-blur-xl py-3 shadow-[0_4px_20px_rgba(0,0,0,0.4)] border-b border-white/10'
          : 'bg-transparent py-5'
        }`}>
        <div className="max-w-[1200px] mx-auto px-6 flex justify-between items-center">

          {/* LOGO - Đã thêm scrollToTop */}
          <Link
            to="/"
            onClick={scrollToTop}
            className="flex items-center gap-2 hover:scale-105 transition-transform"
          >
            <img
              src="/logo.png"
              alt="ExploreVN Logo"
              className="h-14 md:h-18 w-auto object-contain"
              onError={(e) => {
                e.target.style.display = 'none';
                e.target.nextSibling.style.display = 'flex';
              }}
            />
            <span className="hidden font-heading font-black text-white text-2xl tracking-tight">
              Explore<span className="text-[#D4AF37]">VN</span>
            </span>
          </Link>

          {/* DESKTOP LINKS - Đã thêm scrollToTop */}
          <ul className="hidden md:flex items-center gap-8 font-sans text-xs uppercase tracking-[0.2em] text-white">
            {navLinks.map((link) => (
              <li key={link.name}>
                <Link
                  to={link.path}
                  onClick={scrollToTop}
                  className={`relative pb-1.5 transition-colors hover:text-[#D4AF37] ${location.pathname === link.path
                      ? 'text-[#D4AF37] after:content-[""] after:absolute after:bottom-0 after:left-0 after:w-full after:h-[2px] after:bg-[#D4AF37] after:rounded-full'
                      : 'after:content-[""] after:absolute after:bottom-0 after:left-0 after:w-0 after:h-[2px] after:bg-[#D4AF37] after:rounded-full hover:after:w-full after:transition-all after:duration-300'
                    }`}
                >
                  {link.name}
                </Link>
              </li>
            ))}

            <li>
              {user ? (
                <div className="flex items-center gap-3">
                  <Link
                    to="/profile"
                    onClick={scrollToTop}
                    className="flex items-center gap-2 bg-white/10 backdrop-blur-md px-4 py-2 rounded-full border border-white/20 hover:bg-white/20 transition-all"
                  >
                    <img src={user.avatar_url} className="w-7 h-7 rounded-full border border-[#D4AF37] object-cover" alt="ava"
                      onError={(e) => { e.target.src = 'https://i.pravatar.cc/150'; }} />
                    <span className="font-semibold text-white text-xs">{user.full_name || user.username}</span>
                  </Link>
                  <button onClick={handleLogout} className="text-[10px] font-bold text-white/60 px-3 py-2 rounded-full hover:bg-red-500/20 hover:text-red-400 transition-all border border-white/10 uppercase tracking-widest">
                    Thoát
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <button
                    onClick={openLogin}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-full border border-white/30 text-white text-[11px] font-bold uppercase tracking-wider hover:border-[#D4AF37] hover:text-[#D4AF37] transition-all duration-300"
                  >
                    Đăng Nhập
                  </button>
                  <button
                    onClick={openRegister}
                    className="bg-[#D4AF37] text-black px-6 py-2.5 rounded-full hover:bg-white transition-all duration-300 font-black tracking-wider text-[11px] uppercase shadow-lg"
                  >
                    Đăng Ký
                  </button>
                </div>
              )}
            </li>
          </ul>

          {/* MOBILE BUTTONS */}
          <div className="flex md:hidden items-center gap-3">
            {!user && (
              <button onClick={openLogin} className="text-white/70 hover:text-[#D4AF37] transition-colors">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </button>
            )}
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="flex flex-col justify-center items-center gap-[5px] w-9 h-9 group"
            >
              <span className={`block h-0.5 bg-white rounded-full transition-all duration-300 ${mobileOpen ? 'w-5 rotate-45 translate-y-1.5' : 'w-5'}`} />
              <span className={`block h-0.5 bg-white rounded-full transition-all duration-300 ${mobileOpen ? 'opacity-0 w-0' : 'w-4'}`} />
              <span className={`block h-0.5 bg-white rounded-full transition-all duration-300 ${mobileOpen ? 'w-5 -rotate-45 -translate-y-1.5' : 'w-5'}`} />
            </button>
          </div>
        </div>

        {/* MOBILE MENU DROPDOWN - Đã thêm scrollToTop */}
        <div className={`md:hidden overflow-hidden transition-all duration-300 ${mobileOpen ? 'max-h-[400px] opacity-100' : 'max-h-0 opacity-0'}`}>
          <div className="bg-[#0A241A]/98 backdrop-blur-xl border-t border-white/10 px-6 py-4 space-y-1">
            {navLinks.map((link) => (
              <Link
                key={link.name}
                to={link.path}
                onClick={scrollToTop}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold uppercase tracking-wider transition-all ${location.pathname === link.path
                    ? 'bg-[#D4AF37]/15 text-[#D4AF37]'
                    : 'text-white/70 hover:bg-white/5 hover:text-white'
                  }`}
              >
                {link.name}
              </Link>
            ))}
          </div>
        </div>
      </nav>
    </>
  );
}

export default Navbar;