import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Navbar from '../components/Navbar';
import API_URL from '../config/api';

import newsBg from '../assets/news-bg.png';

const CATEGORIES = [
  { id: 'all', label: 'Tất Cả', icon: '📰' },
  { id: 'diem-den', label: 'Điểm Đến & Lễ Hội', icon: '🗺️' },
  { id: 'am-thuc', label: 'Ẩm Thực Du Lịch', icon: '🍲' },
  { id: 'tu-van', label: 'Thời Tiết & Tư Vấn', icon: '📋' },
  { id: 'giai-tri', label: 'Giải Trí & Sự Kiện', icon: '🎪' },
];

const fadeUp = { hidden: { opacity: 0, y: 30 }, visible: { opacity: 1, y: 0, transition: { duration: 0.6 } } };

function News() {
  const [activeCategory, setActiveCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [news, setNews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [heroIndex, setHeroIndex] = useState(0);

  // Fetch news from Backend
  useEffect(() => {
    const fetchNews = async () => {
      setLoading(true);
      try {
        const res = await fetch(`${API_URL}/api/news/vnexpress?category=${activeCategory}`);
        const data = await res.json();
        setNews(data);
      } catch (err) {
        console.error('Lỗi fetch news:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchNews();
  }, [activeCategory]);

  // Auto Slider logic
  useEffect(() => {
    if (news.length > 0) {
      const timer = setInterval(() => {
        setHeroIndex((prev) => (prev + 1) % Math.min(news.length, 5));
      }, 5000);
      return () => clearInterval(timer);
    }
  }, [news]);

  const featuredNews = useMemo(() => news.slice(0, 5), [news]);
  const otherNews = useMemo(() => {
    return news.slice(5).filter(n => 
      n.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      n.excerpt.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [news, searchQuery]);

  return (
    <div className="min-h-screen bg-[#0A241A] text-[#F5F2EB]">
      <Navbar />

      {/* ===== HEADER WITH BACKGROUND ===== */}
      <div className="relative overflow-hidden pt-40 pb-12 mb-8">
        {/* Background Image Overlay */}
        <div className="absolute inset-0 z-0">
          <motion.img 
            initial={{ scale: 1.1, opacity: 0 }}
            animate={{ scale: 1, opacity: 0.4 }}
            transition={{ duration: 1.5 }}
            src={newsBg} 
            alt="background" 
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0A241A] via-[#0A241A]/50 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-b from-[#0A241A]/80 via-transparent to-transparent" />
        </div>

        <div className="relative z-10 px-5 max-w-[1400px] mx-auto">
          <motion.div initial="hidden" animate="visible" variants={fadeUp} className="mb-10">
            <p className="text-[#D4AF37] font-bold uppercase tracking-[0.4em] text-[10px] md:text-xs mb-3">WanderlyVietNam · Tin Tức Du Lịch</p>
            <h1 className="text-5xl md:text-7xl font-heading font-bold text-white leading-tight">
              Khám Phá <span className="text-[#D4AF37] italic font-light">Việt Nam</span>
            </h1>
            <p className="text-white/60 mt-4 max-w-xl text-sm md:text-base">Cập nhật những xu hướng, điểm đến và câu chuyện du lịch mới nhất từ dải đất hình chữ S.</p>
          </motion.div>

          {/* Categories & Search */}
          <div className="flex flex-wrap items-center justify-between gap-6 pt-6 border-t border-white/10">
            <div className="flex flex-wrap gap-2">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setActiveCategory(cat.id)}
                  className={`px-5 py-2.5 rounded-full text-xs font-bold transition-all duration-300 border ${
                    activeCategory === cat.id
                      ? 'bg-[#D4AF37] text-black border-[#D4AF37] shadow-[0_0_20px_rgba(212,175,55,0.3)]'
                      : 'bg-white/5 text-white/50 border-white/5 hover:border-[#D4AF37]/50 hover:text-[#D4AF37]'
                  }`}
                >
                  {cat.icon} {cat.label}
                </button>
              ))}
            </div>
            <div className="relative w-full md:w-80">
              <input
                type="text"
                placeholder="Tìm kiếm tin tức..."
                className="w-full bg-white/5 border border-white/10 rounded-full px-6 py-3 text-sm outline-none focus:border-[#D4AF37] focus:bg-white/10 transition-all text-white"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <span className="absolute right-6 top-1/2 -translate-y-1/2 text-white/30">🔍</span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-[1400px] mx-auto px-5 pb-20">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-32 gap-4">
            <div className="w-12 h-12 border-4 border-[#D4AF37] border-t-transparent rounded-full animate-spin" />
            <p className="text-white/40 animate-pulse uppercase tracking-widest text-xs font-bold">Đang cập nhật tin tức mới nhất...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* MAIN: SLIDER + LIST */}
            <div className="lg:col-span-2 space-y-10">
              {/* FEATURED SLIDER */}
              {featuredNews.length > 0 && (
                <div className="relative h-[450px] rounded-[2.5rem] overflow-hidden group border border-white/5">
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={heroIndex}
                      initial={{ opacity: 0, scale: 1.1 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 1 }}
                      className="absolute inset-0 cursor-pointer"
                      onClick={() => window.open(featuredNews[heroIndex].link, '_blank')}
                    >
                      <img
                        src={featuredNews[heroIndex].image_url}
                        alt="featured"
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/30 to-transparent" />
                      <div className="absolute bottom-0 left-0 p-10 w-full">
                        <div className="flex items-center gap-3 mb-4">
                          <span className="bg-[#D4AF37] text-black text-[10px] font-black px-3 py-1 rounded-full">TIÊU ĐIỂM</span>
                          <span className="text-white/70 text-xs font-bold">{featuredNews[heroIndex].category}</span>
                        </div>
                        <h2 className="text-3xl md:text-4xl font-heading font-bold mb-3 group-hover:text-[#D4AF37] transition-colors">
                          {featuredNews[heroIndex].title}
                        </h2>
                        <p className="text-white/60 line-clamp-2 max-w-2xl">{featuredNews[heroIndex].excerpt}</p>
                      </div>
                    </motion.div>
                  </AnimatePresence>
                  {/* Slider dots */}
                  <div className="absolute top-1/2 right-6 -translate-y-1/2 flex flex-col gap-3 z-30">
                    {featuredNews.map((_, i) => (
                      <button
                        key={i}
                        onClick={() => setHeroIndex(i)}
                        className={`w-1.5 transition-all duration-500 rounded-full ${i === heroIndex ? 'h-8 bg-[#D4AF37]' : 'h-1.5 bg-white/30'}`}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* OTHER NEWS LIST */}
              <div className="space-y-6">
                <div className="flex items-center gap-4">
                  <h3 className="text-sm font-black uppercase tracking-widest text-[#D4AF37]">Tin Mới Cập Nhật</h3>
                  <div className="flex-1 h-px bg-white/10" />
                </div>
                <div className="grid gap-6">
                  {otherNews.map((n, i) => (
                    <motion.div
                      key={n.id}
                      initial={{ opacity: 0, x: -20 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.05 }}
                      onClick={() => window.open(n.link, '_blank')}
                      className="group flex gap-5 bg-white/5 p-4 rounded-[1.5rem] border border-white/5 hover:border-[#D4AF37]/30 transition-all cursor-pointer"
                    >
                      <div className="w-32 md:w-48 h-32 flex-shrink-0 overflow-hidden rounded-xl">
                        <img src={n.image_url} alt="news" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                      </div>
                      <div className="flex-1 flex flex-col justify-center">
                        <div className="flex items-center gap-3 mb-2">
                          <span className="text-[#D4AF37] text-[10px] font-bold uppercase">{n.category}</span>
                          <span className="text-white/30 text-[10px]">· {n.read_time}</span>
                        </div>
                        <h4 className="text-lg font-bold group-hover:text-[#D4AF37] transition-colors mb-2 line-clamp-2">{n.title}</h4>
                        <p className="text-white/40 text-xs line-clamp-2">{n.excerpt}</p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            </div>

            {/* SIDEBAR */}
            <div className="space-y-8">
              <div className="bg-[#0D2D1F] p-8 rounded-[2rem] border border-white/5">
                <h3 className="text-xl font-heading font-bold mb-6 flex items-center gap-2">
                  <span className="text-[#D4AF37]">🔥</span> Xu Hướng
                </h3>
                <div className="space-y-6">
                  {news.slice(10, 15).map((n, i) => (
                    <div key={n.id} className="flex gap-4 group cursor-pointer" onClick={() => window.open(n.link, '_blank')}>
                      <span className="text-2xl font-black text-white/10 group-hover:text-[#D4AF37]/20 transition-colors">0{i+1}</span>
                      <h5 className="text-sm font-bold leading-snug group-hover:text-[#D4AF37] transition-colors line-clamp-2">{n.title}</h5>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-gradient-to-br from-[#D4AF37] to-[#C27A5B] p-8 rounded-[2rem] text-black">
                <h3 className="text-2xl font-heading font-black mb-2">Đăng Ký Bản Tin</h3>
                <p className="text-black/70 text-sm mb-6">Nhận thông báo về các ưu đãi vé máy bay và cẩm nang du lịch mới nhất hàng tuần.</p>
                <input
                  type="email"
                  placeholder="Email của bạn..."
                  className="w-full bg-black/10 border border-black/10 rounded-xl px-5 py-3 text-sm placeholder-black/40 outline-none mb-3"
                />
                <button className="w-full bg-black text-white font-bold py-3 rounded-xl hover:bg-white hover:text-black transition-all">Đăng Ký Ngay</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default News;