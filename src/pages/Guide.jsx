import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// ============================================================
// MOCK DATA
// ============================================================
const PINNED_ARTICLES = [
  {
    id: 'p1', title: 'Checklist 10 Vật Dụng Không Thể Thiếu Khi Đi Biển',
    excerpt: 'Kem chống nắng, áo chống tia UV, dép đi biển... Đừng để quên thứ gì quan trọng trước chuyến đi.',
    read_time: '3 phút', icons: ['🏖️', '🧴', '👟'],
    filter: 'hangtrang', destination: null,
    image_url: 'https://images.unsplash.com/photo-1499793983690-e29da59ef1c2?q=80&w=800',
  },
  {
    id: 'p2', title: 'Lịch Trình 3N2Đ Sapa Dành Cho Người Lần Đầu',
    excerpt: 'Từ check-in khách sạn, leo núi Fansipan đến thăm bản làng H\'Mông — tất cả trong 3 ngày 2 đêm.',
    read_time: '7 phút', icons: ['🗺️', '⛰️', '🏡'],
    filter: 'lichtrinh', destination: 'Sapa',
    image_url: 'https://media.vietravel.com/images/Content/dia-diem-du-lich-sapa-1.png',
  },
  {
    id: 'p3', title: 'Mẹo Đi Đà Lạt Tiết Kiệm Dưới 1 Triệu/Ngày',
    excerpt: 'Thuê xe máy, ăn chợ đêm, ở homestay — những bí kíp giúp bạn tận hưởng Đà Lạt mà không cháy túi.',
    read_time: '5 phút', icons: ['💰', '🛵', '🏠'],
    filter: 'tietkiem', destination: 'Đà Lạt',
    image_url: 'https://bizweb.dktcdn.net/thumb/1024x1024/100/093/257/products/thung-lung-ngan-hoa.jpg?v=1731570795333',
  },
];

const DESTINATIONS = [
  {
    id: 'd1', name: 'Hội An', province: 'Quảng Nam',
    image_url: 'https://cdn3.ivivu.com/2023/10/du-lich-hoi-an-ivivu-img1.jpg',
    articles: [
      { id: 'a1', title: 'Trọn bộ kinh nghiệm vi vu Hội An mùa mưa', read_time: '6 phút', icons: ['☔', '🍜', '🛵'], filter: 'lichtrinh' },
      { id: 'a2', title: 'Ăn gì ở Hội An? 10 món không thể bỏ qua', read_time: '4 phút', icons: ['🍜', '🥗', '🧃'], filter: 'tietkiem' },
      { id: 'a3', title: 'Checklist hành trang cho 2 ngày ở phố cổ', read_time: '3 phút', icons: ['🎒', '🏮', '👒'], filter: 'hangtrang' },
    ],
  },
  {
    id: 'd2', name: 'Đà Nẵng', province: 'Đà Nẵng',
    image_url: 'https://luxurytravel.vn/wp-content/uploads/2023/05/Da-Nang-1.jpg',
    articles: [
      { id: 'a4', title: 'Lịch trình 2N1Đ Đà Nẵng – Bà Nà Hills', read_time: '5 phút', icons: ['🗺️', '🚡', '🌉'], filter: 'lichtrinh' },
      { id: 'a5', title: 'Lưu ý an toàn khi tắm biển Mỹ Khê', read_time: '3 phút', icons: ['⚠️', '🏊', '🌊'], filter: 'antoàn' },
    ],
  },
  {
    id: 'd3', name: 'Phú Quốc', province: 'Kiên Giang',
    image_url: 'https://images.unsplash.com/photo-1499793983690-e29da59ef1c2?q=80&w=800',
    articles: [
      { id: 'a6', title: 'Phú Quốc tự túc: Chi phí trọn gói 4 ngày', read_time: '8 phút', icons: ['💰', '✈️', '🏝️'], filter: 'tietkiem' },
      { id: 'a7', title: 'Hành trang đi Phú Quốc mùa khô', read_time: '4 phút', icons: ['🎒', '🧴', '🤿'], filter: 'hangtrang' },
    ],
  },
  {
    id: 'd4', name: 'Hà Giang', province: 'Hà Giang',
    image_url: 'https://datviettour.com.vn/uploads/images/mien-bac/ha-giang/hinh-danh-thang/cot-co-lung-cu.jpg',
    articles: [
      { id: 'a8', title: 'Phượt Hà Giang: Cung đường Mã Pí Lèng', read_time: '10 phút', icons: ['🛵', '⛰️', '📸'], filter: 'lichtrinh' },
      { id: 'a9', title: 'Lưu ý an toàn trên đèo Hà Giang', read_time: '4 phút', icons: ['⚠️', '🛵', '🌧️'], filter: 'antoàn' },
    ],
  },
];

const QUICK_FILTERS = [
  { id: 'all', label: 'Tất Cả', icon: '📖' },
  { id: 'hangtrang', label: 'Hành Trang', icon: '🎒' },
  { id: 'lichtrinh', label: 'Lịch Trình', icon: '🗺️' },
  { id: 'tietkiem', label: 'Tiết Kiệm', icon: '💰' },
  { id: 'antoàn', label: 'An Toàn', icon: '⚠️' },
];

// INTERACTIVE CHECKLIST DEMO
const CHECKLIST_ITEMS = [
  'Kem chống nắng SPF 50+', 'Áo chống tia UV', 'Nón rộng vành', 'Dép đi biển',
  'Túi chống nước', 'Thuốc say tàu xe', 'Giấy tờ tùy thân', 'Sạc dự phòng',
];

const fadeUp = { hidden: { opacity: 0, y: 30 }, visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: 'easeOut' } } };

// ============================================================
function Guide() {
  const [activeFilter, setActiveFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchFocused, setSearchFocused] = useState(false);
  const [openDestination, setOpenDestination] = useState('d1');
  const [checked, setChecked] = useState([]);

  const toggleCheck = (item) =>
    setChecked((prev) => prev.includes(item) ? prev.filter((i) => i !== item) : [...prev, item]);

  const filteredPinned = PINNED_ARTICLES.filter((a) => {
    const matchFilter = activeFilter === 'all' || a.filter === activeFilter;
    const matchSearch = a.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.excerpt.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (a.destination && a.destination.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchFilter && matchSearch;
  });

  return (
    <div className="min-h-screen bg-[#0A241A]">

      {/* ===== HEADER ===== */}
      <div className="pt-32 pb-0 px-5 max-w-[1200px] mx-auto">
        <motion.div initial="hidden" animate="visible" variants={fadeUp} className="text-center mb-8">
          <p className="text-[#D4AF37] font-bold uppercase tracking-[0.4em] text-xs mb-3">WanderlyVietNam · Sổ Tay Du Lịch</p>
          <h1 className="text-6xl md:text-7xl font-heading font-bold text-[#F5F2EB] leading-none mb-3">
            Cẩm <span className="text-[#D4AF37] italic font-light">Nang</span>
          </h1>
          <p className="text-white/50 text-sm max-w-lg mx-auto">
            Kinh nghiệm thực chiến · Hành trang đầy đủ · Lịch trình tối ưu
          </p>
        </motion.div>

        {/* SEARCH BAR */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
          className="max-w-2xl mx-auto mt-8 mb-6"
        >
          <div className={`flex items-center gap-3 bg-[#112418] rounded-2xl px-5 py-4 border-2 transition-all duration-300 ${searchFocused ? 'border-[#D4AF37] shadow-[0_0_20px_rgba(212,175,55,0.2)]' : 'border-white/5'}`}>
            <svg className={`w-5 h-5 flex-shrink-0 transition-colors duration-300 ${searchFocused ? 'text-[#D4AF37]' : 'text-white/30'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-4.35-4.35m0 0A7.5 7.5 0 104.5 4.5a7.5 7.5 0 0012.15 12.15z" />
            </svg>
            <input
              type="text"
              placeholder="Nhập điểm đến để xem kinh nghiệm..."
              className="flex-1 bg-transparent text-white placeholder-white/30 outline-none text-sm font-medium"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => setSearchFocused(true)}
              onBlur={() => setSearchFocused(false)}
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery('')} className="text-white/30 hover:text-white text-xl">&times;</button>
            )}
          </div>
        </motion.div>

        {/* QUICK FILTERS */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
          className="flex flex-wrap justify-center gap-3 mb-16"
        >
          {QUICK_FILTERS.map((f) => (
            <button key={f.id} onClick={() => setActiveFilter(f.id)}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-xs font-bold uppercase tracking-wider border transition-all duration-300 ${
                activeFilter === f.id
                  ? 'bg-[#D4AF37] text-black border-[#D4AF37] shadow-[0_0_15px_rgba(212,175,55,0.4)]'
                  : 'bg-transparent text-white/60 border-white/15 hover:border-[#D4AF37]/50 hover:text-[#D4AF37]'
              }`}
            >
              <span>{f.icon}</span> {f.label}
            </button>
          ))}
        </motion.div>
      </div>

      {/* ===== SECTION 1: HÀNH TRANG TIÊU CHUẨN (PINNED) ===== */}
      <section className="max-w-[1200px] mx-auto px-5 mb-20">
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} className="flex items-center gap-3 mb-8">
          <span className="text-[#D4AF37] text-xl">📌</span>
          <div>
            <p className="text-[#D4AF37] font-bold uppercase tracking-[0.3em] text-[10px]">Ghim lên đầu</p>
            <h2 className="text-2xl font-heading font-bold text-[#F5F2EB]">Hành Trang Tiêu Chuẩn</h2>
          </div>
        </motion.div>

        <AnimatePresence mode="wait">
          <motion.div key={activeFilter + searchQuery}
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="grid grid-cols-1 md:grid-cols-3 gap-6"
          >
            {filteredPinned.length === 0 ? (
              <p className="col-span-3 text-center text-white/30 py-10">Không tìm thấy bài viết phù hợp.</p>
            ) : filteredPinned.map((a, i) => (
              <motion.div key={a.id}
                initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }} transition={{ delay: i * 0.1, duration: 0.5 }}
                className="group rounded-[1.5rem] overflow-hidden bg-[#0D2D1F] border border-white/5 hover:border-[#D4AF37]/40 hover:shadow-[0_10px_30px_rgba(212,175,55,0.15)] transition-all duration-500 cursor-pointer"
              >
                <div className="relative h-44 overflow-hidden">
                  <img src={a.image_url} alt={a.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0D2D1F] to-transparent" />
                  {a.destination && (
                    <span className="absolute top-3 left-3 bg-[#D4AF37]/90 text-black text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded-full">
                      📍 {a.destination}
                    </span>
                  )}
                </div>
                <div className="p-6">
                  <h3 className="text-[#F5F2EB] font-bold text-base leading-snug mb-2 group-hover:text-[#D4AF37] transition-colors">{a.title}</h3>
                  <p className="text-white/40 text-xs leading-relaxed mb-4 line-clamp-2">{a.excerpt}</p>
                  <div className="flex items-center justify-between">
                    <div className="flex gap-1.5">
                      {a.icons.map((icon, idx) => (
                        <span key={idx} className="text-base bg-white/5 rounded-lg w-8 h-8 flex items-center justify-center border border-white/5">{icon}</span>
                      ))}
                    </div>
                    <span className="text-white/30 text-xs font-medium">🕐 {a.read_time}</span>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </AnimatePresence>
      </section>

      {/* ===== SECTION 2: THEO ĐIỂM ĐẾN ===== */}
      <section className="max-w-[1200px] mx-auto px-5 mb-20">
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} className="flex items-center gap-3 mb-8">
          <span className="text-[#C27A5B] text-xl">🗺️</span>
          <div>
            <p className="text-[#C27A5B] font-bold uppercase tracking-[0.3em] text-[10px]">Theo vùng miền</p>
            <h2 className="text-2xl font-heading font-bold text-[#F5F2EB]">Kinh Nghiệm Theo Điểm Đến</h2>
          </div>
        </motion.div>

        <div className="flex flex-wrap gap-3 mb-8">
          {DESTINATIONS.map((dest) => (
            <button key={dest.id} onClick={() => setOpenDestination(dest.id)}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-bold border transition-all duration-300 ${
                openDestination === dest.id
                  ? 'bg-[#C27A5B] text-white border-[#C27A5B] shadow-[0_0_15px_rgba(194,122,91,0.4)]'
                  : 'bg-transparent text-white/60 border-white/15 hover:border-[#C27A5B]/50 hover:text-[#C27A5B]'
              }`}
            >
              📍 {dest.name}
            </button>
          ))}
        </div>

        <AnimatePresence mode="wait">
          {DESTINATIONS.filter((d) => d.id === openDestination).map((dest) => (
            <motion.div key={dest.id}
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.4 }}
              className="rounded-[2rem] overflow-hidden border border-white/10 bg-[#0D2D1F]"
            >
              {/* Destination hero */}
              <div className="relative h-48 overflow-hidden">
                <img src={dest.image_url} alt={dest.name} className="w-full h-full object-cover opacity-70" />
                <div className="absolute inset-0 bg-gradient-to-r from-[#0D2D1F]/90 to-transparent" />
                <div className="absolute bottom-6 left-8">
                  <p className="text-[#D4AF37] text-xs font-bold uppercase tracking-widest mb-1">{dest.province}</p>
                  <h3 className="text-3xl font-heading font-bold text-white">{dest.name}</h3>
                </div>
              </div>

              {/* Articles list */}
              <div className="p-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {dest.articles
                  .filter((a) => activeFilter === 'all' || a.filter === activeFilter)
                  .map((a) => (
                    <div key={a.id}
                      className="group flex flex-col gap-3 p-5 rounded-xl bg-white/5 border border-white/5 hover:border-[#D4AF37]/40 hover:bg-[#D4AF37]/5 transition-all duration-300 cursor-pointer"
                    >
                      <p className="text-[#F5F2EB] font-bold text-sm leading-snug group-hover:text-[#D4AF37] transition-colors">{a.title}</p>
                      <div className="flex items-center justify-between mt-auto">
                        <div className="flex gap-1">
                          {a.icons.map((icon, idx) => <span key={idx} className="text-sm">{icon}</span>)}
                        </div>
                        <span className="text-white/30 text-xs">🕐 {a.read_time}</span>
                      </div>
                    </div>
                  ))}
                {dest.articles.filter((a) => activeFilter === 'all' || a.filter === activeFilter).length === 0 && (
                  <p className="col-span-3 text-white/30 text-sm text-center py-4">Không có bài viết theo bộ lọc này.</p>
                )}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </section>

      {/* ===== SECTION 3: CHECKLIST TƯƠNG TÁC ===== */}
      <section className="max-w-[1200px] mx-auto px-5 pb-24">
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp}
          className="grid grid-cols-1 lg:grid-cols-2 gap-8 rounded-[2rem] overflow-hidden border border-white/10 bg-[#0D2D1F] p-10"
        >
          {/* Checklist */}
          <div>
            <p className="text-[#D4AF37] font-bold uppercase tracking-[0.3em] text-[10px] mb-2">Công cụ tương tác</p>
            <h2 className="text-2xl font-heading font-bold text-[#F5F2EB] mb-2">Checklist Hành Trang</h2>
            <p className="text-white/40 text-xs mb-6">Bấm tick vào những gì bạn đã chuẩn bị</p>
            <div className="space-y-3">
              {CHECKLIST_ITEMS.map((item) => (
                <button key={item} onClick={() => toggleCheck(item)}
                  className={`w-full flex items-center gap-4 p-4 rounded-xl border text-left transition-all duration-300 ${
                    checked.includes(item)
                      ? 'bg-[#D4AF37]/10 border-[#D4AF37]/40 text-[#D4AF37]'
                      : 'bg-white/5 border-white/5 text-white/70 hover:border-white/20'
                  }`}
                >
                  <span className={`w-5 h-5 rounded flex items-center justify-center border-2 flex-shrink-0 transition-all ${
                    checked.includes(item) ? 'bg-[#D4AF37] border-[#D4AF37]' : 'border-white/20'
                  }`}>
                    {checked.includes(item) && <span className="text-black text-xs font-black">✓</span>}
                  </span>
                  <span className={`text-sm font-medium ${checked.includes(item) ? 'line-through opacity-60' : ''}`}>{item}</span>
                </button>
              ))}
            </div>
            <p className="text-white/30 text-xs mt-4 text-center">
              {checked.length}/{CHECKLIST_ITEMS.length} mục đã chuẩn bị
              {checked.length === CHECKLIST_ITEMS.length && ' 🎉 Sẵn sàng lên đường!'}
            </p>
          </div>

          {/* Timeline lịch trình mẫu */}
          <div>
            <p className="text-[#C27A5B] font-bold uppercase tracking-[0.3em] text-[10px] mb-2">Ví dụ lịch trình</p>
            <h2 className="text-2xl font-heading font-bold text-[#F5F2EB] mb-6">Timeline: 2N1Đ Hội An</h2>
            <div className="relative pl-6 border-l-2 border-white/10 space-y-6">
              {[
                { day: 'Ngày 1', time: 'Sáng', icon: '☀️', title: 'Check-in & Phố Cổ', desc: 'Đến nơi, nhận phòng, dạo bộ phố cổ và ăn Cao Lầu.' },
                { day: 'Ngày 1', time: 'Chiều', icon: '🌅', title: 'Làng Rau Trà Quế', desc: 'Đạp xe ra làng rau, trải nghiệm trồng rau với người dân.' },
                { day: 'Ngày 1', time: 'Tối', icon: '🏮', title: 'Phóng Đèn Hoa Đăng', desc: 'Ra bờ sông Hoài thả đèn hoa đăng, khám phá chợ đêm.' },
                { day: 'Ngày 2', time: 'Sáng', icon: '🏖️', title: 'Biển Cửa Đại', desc: 'Ra biển buổi sáng sớm, tắm biển và ăn hải sản tươi.' },
                { day: 'Ngày 2', time: 'Trưa', icon: '🏠', title: 'Check-out & Về', desc: 'Mua đặc sản, check-out và về nhà mang theo kỷ niệm.' },
              ].map((item, i) => (
                <div key={i} className="relative">
                  <div className="absolute -left-[2.1rem] w-4 h-4 rounded-full bg-[#0D2D1F] border-2 border-[#D4AF37] flex items-center justify-center">
                    <div className="w-1.5 h-1.5 rounded-full bg-[#D4AF37]" />
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="text-xl mt-0.5">{item.icon}</span>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[#D4AF37] text-[10px] font-black uppercase tracking-widest">{item.day} · {item.time}</span>
                      </div>
                      <p className="text-[#F5F2EB] font-bold text-sm">{item.title}</p>
                      <p className="text-white/40 text-xs mt-1">{item.desc}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      </section>
    </div>
  );
}

export default Guide;