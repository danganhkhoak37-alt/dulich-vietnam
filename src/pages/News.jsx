import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// ============================================================
// MOCK DATA
// ============================================================
const HERO_NEWS = {
  id: 0, category: 'Sự Kiện & Lễ Hội',
  title: 'Đà Nẵng Chính Thức Khai Mạc Lễ Hội Pháo Hoa Quốc Tế 2026',
  excerpt: 'Lễ hội pháo hoa lớn nhất Đông Nam Á năm 2026 với sự tham gia của 8 quốc gia, kéo dài suốt tháng 6 trên bầu trời sông Hàn rực rỡ.',
  read_time: '3 phút', time_ago: 'Vừa xong',
  image_url: 'https://luxurytravel.vn/wp-content/uploads/2023/05/Da-Nang-1.jpg',
};

const QUICK_NEWS = [
  { id: 'q1', icon: '⚠️', label: 'Thời tiết', text: 'Bão số 3 có khả năng ảnh hưởng đến các tỉnh ven biển miền Trung từ ngày 10/5.', time: '15 phút trước' },
  { id: 'q2', icon: '✈️', label: 'Hàng không', text: 'VietJet mở thêm 4 đường bay quốc tế mới từ Hà Nội và TP.HCM từ tháng 6/2026.', time: '1 giờ trước' },
  { id: 'q3', icon: '📋', label: 'Visa', text: 'Hàn Quốc chính thức miễn visa cho công dân Việt Nam từ ngày 15/5/2026.', time: '2 giờ trước' },
  { id: 'q4', icon: '💱', label: 'Tỷ giá', text: '1 USD = 25.400 VND · 1 EUR = 27.200 VND · 1 THB = 700 VND.', time: 'Cập nhật 6:00' },
  { id: 'q5', icon: '🎪', label: 'Sự kiện', text: 'Festival Huế 2026 khai mạc ngày 12/5 với hơn 200 chương trình nghệ thuật.', time: '3 giờ trước' },
];

const NEWS_LIST = [
  {
    id: 1, category: 'Hàng Không & Giao Thông',
    title: 'Vietnam Airlines Mở Đường Bay Thẳng Đà Nẵng – Tokyo Từ Tháng 7',
    excerpt: 'Chuyến bay thẳng đầu tiên kết nối Đà Nẵng với thủ đô Nhật Bản, tần suất 4 chuyến/tuần với giá vé khởi điểm từ 4.5 triệu đồng.',
    read_time: '2 phút', time_ago: '30 phút trước',
    image_url: 'https://images.unsplash.com/photo-1524661135-423995f22d0b?q=80&w=400',
    tags: ['hangkhong'],
  },
  {
    id: 2, category: 'Chính Sách & Visa',
    title: 'Cập Nhật Mới Nhất: Quy Định Visa Điện Tử Cho 13 Quốc Gia Vào Việt Nam',
    excerpt: 'Bộ Ngoại giao vừa ban hành danh sách mới các quốc gia được cấp visa điện tử 90 ngày, hiệu lực từ 1/6/2026.',
    read_time: '4 phút', time_ago: '1 giờ trước',
    image_url: 'https://images.unsplash.com/photo-1528127269322-539801943592?q=80&w=400',
    tags: ['visa'],
  },
  {
    id: 3, category: 'Điểm Đến',
    title: 'Khu Du Lịch Sinh Thái Phong Nha 5 Sao Đầu Tiên Chính Thức Mở Cửa',
    excerpt: 'Resort nghỉ dưỡng cao cấp nằm ngay cạnh di sản UNESCO Phong Nha – Kẻ Bàng với 200 biệt thự rừng và hệ thống hang động riêng tư.',
    read_time: '3 phút', time_ago: '3 giờ trước',
    image_url: 'https://images.unsplash.com/photo-1503023345310-bd7c1de61c7d?q=80&w=400',
    tags: ['diem-den'],
  },
  {
    id: 4, category: 'Sự Kiện & Lễ Hội',
    title: 'Lịch Trình Chi Tiết Festival Hội An 2026: 15 Đêm Văn Hoá Đặc Sắc',
    excerpt: 'Ban tổ chức vừa công bố chương trình đầy đủ với màn trình diễn nghệ thuật ánh sáng và lễ rước đèn lớn nhất lịch sử phố cổ.',
    read_time: '5 phút', time_ago: '5 giờ trước',
    image_url: 'https://images.unsplash.com/photo-1559592413-7cec4d0cae2b?q=80&w=400',
    tags: ['sukien'],
  },
  {
    id: 5, category: 'Hàng Không & Giao Thông',
    title: 'Bamboo Airways Giảm 40% Vé Máy Bay Nội Địa Dịp Hè 2026',
    excerpt: 'Chương trình khuyến mãi hè lớn nhất năm với 500.000 vé giá rẻ trên toàn bộ các đường bay nội địa, áp dụng đặt trước đến 31/5.',
    read_time: '2 phút', time_ago: '6 giờ trước',
    image_url: 'https://images.unsplash.com/photo-1499793983690-e29da59ef1c2?q=80&w=400',
    tags: ['hangkhong'],
  },
  {
    id: 6, category: 'Chính Sách & Visa',
    title: 'Hàn Quốc Miễn Visa 30 Ngày Cho Du Khách Việt Nam — Hiệu Lực Ngay',
    excerpt: 'Đây là bước ngoặt lớn sau nhiều năm đàm phán, mở ra cơ hội du lịch tự túc Hàn Quốc dễ dàng và tiết kiệm hơn bao giờ hết.',
    read_time: '3 phút', time_ago: '8 giờ trước',
    image_url: 'https://bizweb.dktcdn.net/thumb/1024x1024/100/093/257/products/thung-lung-ngan-hoa.jpg?v=1731570795333',
    tags: ['visa'],
  },
];

const CATEGORIES = [
  { id: 'all', label: 'Tất Cả', icon: '📰' },
  { id: 'visa', label: 'Chính sách & Visa', icon: '📋' },
  { id: 'hangkhong', label: 'Hàng Không', icon: '✈️' },
  { id: 'sukien', label: 'Sự Kiện & Lễ Hội', icon: '🎪' },
  { id: 'diem-den', label: 'Điểm Đến Mới', icon: '🗺️' },
];

const PROVINCES = ['Tất cả tỉnh thành', 'Hà Nội', 'TP. Hồ Chí Minh', 'Đà Nẵng', 'Hội An', 'Sapa', 'Phú Quốc', 'Huế', 'Nha Trang'];

const STATS_INFOGRAPHIC = [
  { label: 'Khách quốc tế T5/2026', value: '1.8M', icon: '🌍', change: '+22%' },
  { label: 'Đường bay nội địa', value: '78', icon: '✈️', change: '+5 mới' },
  { label: 'Resort 5★ khai trương', value: '12', icon: '🏨', change: 'năm 2026' },
  { label: 'Lễ hội diễn ra T5', value: '34', icon: '🎪', change: 'sự kiện' },
];

function timeAgoColor(t) {
  if (t.includes('Vừa') || t.includes('phút')) return 'text-green-400';
  if (t.includes('1 giờ') || t.includes('2 giờ')) return 'text-[#D4AF37]';
  return 'text-white/40';
}

const fadeUp = { hidden: { opacity: 0, y: 30 }, visible: { opacity: 1, y: 0, transition: { duration: 0.6 } } };

// ============================================================
function News() {
  const [activeCategory, setActiveCategory] = useState('all');
  const [activeProvince, setActiveProvince] = useState('Tất cả tỉnh thành');
  const [searchQuery, setSearchQuery] = useState('');

  const filtered = NEWS_LIST.filter((n) => {
    const matchCat = activeCategory === 'all' || n.tags.includes(activeCategory);
    const matchSearch = n.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      n.excerpt.toLowerCase().includes(searchQuery.toLowerCase());
    return matchCat && matchSearch;
  });

  return (
    <div className="min-h-screen bg-[#0A241A]">

      {/* ===== PAGE HEADER ===== */}
      <div className="pt-28 pb-6 px-5 max-w-[1400px] mx-auto">
        <motion.div initial="hidden" animate="visible" variants={fadeUp} className="flex flex-col md:flex-row items-start md:items-end justify-between gap-4 mb-6">
          <div>
            <p className="text-[#D4AF37] font-bold uppercase tracking-[0.4em] text-xs mb-2">WanderlyVietNam · Thời Sự Du Lịch</p>
            <h1 className="text-5xl md:text-6xl font-heading font-bold text-[#F5F2EB] leading-none">
              Tin <span className="text-[#D4AF37] italic font-light">Tức</span>
            </h1>
          </div>
          {/* Province filter */}
          <div className="flex items-center gap-2 bg-[#0D2D1F] rounded-xl px-4 py-2.5 border border-white/10">
            <span className="text-[#D4AF37] text-sm">📍</span>
            <select
              className="bg-transparent text-white/70 text-xs font-bold outline-none cursor-pointer"
              value={activeProvince}
              onChange={(e) => setActiveProvince(e.target.value)}
            >
              {PROVINCES.map((p) => <option key={p} value={p} className="bg-[#0A241A]">{p}</option>)}
            </select>
          </div>
        </motion.div>

        {/* Category tabs */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
          className="flex flex-wrap gap-2 mb-2"
        >
          {CATEGORIES.map((cat) => (
            <button key={cat.id} onClick={() => setActiveCategory(cat.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold border transition-all duration-300 ${
                activeCategory === cat.id
                  ? 'bg-[#D4AF37] text-black border-[#D4AF37] shadow-[0_0_12px_rgba(212,175,55,0.4)]'
                  : 'bg-transparent text-white/50 border-white/10 hover:border-[#D4AF37]/40 hover:text-[#D4AF37]'
              }`}
            >
              {cat.icon} {cat.label}
            </button>
          ))}
          {/* Search */}
          <div className="ml-auto flex items-center gap-2 bg-[#0D2D1F] border border-white/10 rounded-full px-4 py-2">
            <svg className="w-3.5 h-3.5 text-white/30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-4.35-4.35m0 0A7.5 7.5 0 104.5 4.5a7.5 7.5 0 0012.15 12.15z"/>
            </svg>
            <input
              type="text" placeholder="Tìm tin tức..."
              className="bg-transparent text-white/70 text-xs outline-none w-32 placeholder-white/25"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </motion.div>
      </div>

      {/* ===== MAIN CONTENT GRID ===== */}
      <div className="max-w-[1400px] mx-auto px-5 pb-20">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* ===== LEFT: HERO + NEWS LIST ===== */}
          <div className="lg:col-span-2 space-y-6">

            {/* HERO NEWS */}
            <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp}
              className="group relative rounded-[2rem] overflow-hidden h-[420px] cursor-pointer border border-white/5 hover:border-[#D4AF37]/30 transition-all duration-500"
            >
              <img src={HERO_NEWS.image_url} alt={HERO_NEWS.title}
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                onError={(e) => { e.target.src = 'https://images.unsplash.com/photo-1524661135-423995f22d0b?q=80&w=800'; }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/40 to-transparent" />
              <div className="absolute bottom-0 left-0 p-8 w-full">
                <div className="flex items-center gap-3 mb-3">
                  <span className="bg-[#D4AF37] text-black text-[9px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full animate-pulse">
                    🔴 TIÊU ĐIỂM
                  </span>
                  <span className={`text-xs font-bold ${timeAgoColor(HERO_NEWS.time_ago)}`}>{HERO_NEWS.time_ago}</span>
                  <span className="text-white/30 text-xs">· 🕐 {HERO_NEWS.read_time}</span>
                </div>
                <h2 className="text-2xl md:text-3xl font-heading font-bold text-white leading-tight mb-2 group-hover:text-[#D4AF37] transition-colors">
                  {HERO_NEWS.title}
                </h2>
                <p className="text-white/60 text-sm leading-relaxed line-clamp-2 max-w-xl">{HERO_NEWS.excerpt}</p>
              </div>
            </motion.div>

            {/* INFOGRAPHIC STATS */}
            <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp}
              className="bg-[#0D2D1F] rounded-[1.5rem] border border-white/5 p-6"
            >
              <p className="text-[#D4AF37] text-xs font-black uppercase tracking-widest mb-4 flex items-center gap-2">
                📊 Số Liệu Du Lịch Tháng 5/2026
              </p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {STATS_INFOGRAPHIC.map((stat, i) => (
                  <div key={i} className="text-center p-4 bg-white/5 rounded-xl border border-white/5 hover:border-[#D4AF37]/30 transition-all">
                    <div className="text-2xl mb-1">{stat.icon}</div>
                    <div className="text-[#D4AF37] text-2xl font-black">{stat.value}</div>
                    <div className="text-white/40 text-[10px] mt-1 leading-tight">{stat.label}</div>
                    <div className="text-green-400 text-[10px] font-bold mt-1">{stat.change}</div>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* NEWS LIST */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <p className="text-[#F5F2EB] font-bold text-sm uppercase tracking-widest">Tin Mới Nhất</p>
                <div className="flex-1 h-px bg-white/5" />
                <span className="text-white/30 text-xs">{filtered.length} bài</span>
              </div>

              <AnimatePresence mode="wait">
                <motion.div key={activeCategory + searchQuery}
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  className="space-y-4"
                >
                  {filtered.length === 0 ? (
                    <p className="text-center text-white/30 py-10">Không có tin tức phù hợp.</p>
                  ) : filtered.map((news, i) => (
                    <motion.div key={news.id}
                      initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }} transition={{ delay: i * 0.07, duration: 0.5 }}
                      className="group flex gap-4 bg-[#0D2D1F] rounded-[1.25rem] overflow-hidden border border-white/5 hover:border-[#D4AF37]/30 hover:shadow-[0_8px_25px_rgba(212,175,55,0.1)] transition-all duration-400 cursor-pointer"
                    >
                      {/* Thumbnail */}
                      <div className="w-32 md:w-44 h-28 flex-shrink-0 overflow-hidden">
                        <img src={news.image_url} alt={news.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-600"
                          onError={(e) => { e.target.src = 'https://images.unsplash.com/photo-1524661135-423995f22d0b?q=80&w=400'; }}
                        />
                      </div>
                      {/* Content */}
                      <div className="flex-1 py-4 pr-5 flex flex-col justify-between min-w-0">
                        <div>
                          <div className="flex items-center gap-2 mb-2 flex-wrap">
                            <span className="text-[#D4AF37] text-[9px] font-black uppercase tracking-widest">{news.category}</span>
                            <span className="text-white/20 text-xs">·</span>
                            <span className={`text-xs font-bold ${timeAgoColor(news.time_ago)}`}>{news.time_ago}</span>
                            <span className="text-white/25 text-xs ml-auto hidden md:block">🕐 {news.read_time}</span>
                          </div>
                          <h3 className="text-[#F5F2EB] font-bold text-sm leading-snug mb-1 group-hover:text-[#D4AF37] transition-colors line-clamp-2">
                            {news.title}
                          </h3>
                          <p className="text-white/40 text-xs leading-relaxed line-clamp-2 hidden md:block">{news.excerpt}</p>
                        </div>
                        <div className="flex items-center gap-3 mt-2">
                          <span className="text-[#D4AF37] text-[10px] font-black uppercase tracking-widest group-hover:gap-2 flex items-center gap-1 transition-all">
                            Đọc tiếp <span className="group-hover:translate-x-1 transition-transform">→</span>
                          </span>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </motion.div>
              </AnimatePresence>
            </div>
          </div>

          {/* ===== RIGHT SIDEBAR ===== */}
          <div className="lg:col-span-1 space-y-5 lg:sticky lg:top-24 lg:h-fit">

            {/* Quick News / Sidebar ticker */}
            <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp}
              className="bg-[#0D2D1F] rounded-[1.5rem] border border-white/5 overflow-hidden"
            >
              <div className="p-5 border-b border-white/5 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                <h3 className="text-[#F5F2EB] font-black text-xs uppercase tracking-widest">Cập Nhật Nhanh</h3>
              </div>
              <div className="divide-y divide-white/5">
                {QUICK_NEWS.map((item) => (
                  <div key={item.id} className="p-4 hover:bg-white/5 cursor-pointer transition-colors group">
                    <div className="flex items-start gap-3">
                      <span className="text-lg flex-shrink-0 mt-0.5">{item.icon}</span>
                      <div>
                        <span className="text-[#D4AF37] text-[9px] font-black uppercase tracking-widest block mb-1">{item.label}</span>
                        <p className="text-white/70 text-xs leading-relaxed group-hover:text-white/90 transition-colors">{item.text}</p>
                        <span className={`text-[10px] font-bold mt-1.5 block ${timeAgoColor(item.time)}`}>{item.time}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Video shorts section */}
            <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp}
              className="bg-[#0D2D1F] rounded-[1.5rem] border border-white/5 p-5"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-[#F5F2EB] font-black text-xs uppercase tracking-widest flex items-center gap-2">
                  🎬 Video Tin Tức
                </h3>
                <span className="text-[#D4AF37] text-[10px] font-bold cursor-pointer hover:underline">Xem thêm →</span>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { title: 'Khai mạc Festival Huế 2026', duration: '1:24', thumb: 'https://images.unsplash.com/photo-1528127269322-539801943592?q=80&w=300' },
                  { title: 'Phú Quốc: Điểm Hot Hè 2026', duration: '2:07', thumb: 'https://images.unsplash.com/photo-1499793983690-e29da59ef1c2?q=80&w=300' },
                ].map((v, i) => (
                  <div key={i} className="group cursor-pointer">
                    <div className="relative rounded-xl overflow-hidden aspect-[9/16] max-h-36">
                      <img src={v.thumb} alt={v.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        onError={(e) => { e.target.src = 'https://images.unsplash.com/photo-1524661135-423995f22d0b?q=80&w=300'; }}
                      />
                      <div className="absolute inset-0 bg-black/40 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                        <div className="w-8 h-8 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center border border-white/30">
                          <span className="text-white text-xs ml-0.5">▶</span>
                        </div>
                      </div>
                      <span className="absolute bottom-2 right-2 bg-black/70 text-white text-[9px] font-bold px-1.5 py-0.5 rounded">
                        {v.duration}
                      </span>
                    </div>
                    <p className="text-white/60 text-[10px] leading-tight mt-2 group-hover:text-white/90 transition-colors">{v.title}</p>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Newsletter CTA */}
            <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp}
              className="bg-gradient-to-br from-[#1a4d30] to-[#0A241A] rounded-[1.5rem] border border-[#D4AF37]/20 p-6 text-center"
            >
              <div className="text-3xl mb-3">📬</div>
              <h4 className="text-[#F5F2EB] font-bold text-sm mb-2">Nhận Tin Tức Hàng Ngày</h4>
              <p className="text-white/40 text-xs mb-4 leading-relaxed">
                Tóm tắt tin du lịch nóng nhất mỗi sáng, gửi thẳng vào hộp thư của bạn.
              </p>
              <input
                type="email" placeholder="Email của bạn..."
                className="w-full bg-[#112418] text-white text-xs px-4 py-3 rounded-xl outline-none border border-white/10 focus:border-[#D4AF37]/40 mb-3 placeholder-white/20"
              />
              <button className="w-full bg-[#D4AF37] text-black font-black text-xs py-3 rounded-xl uppercase tracking-widest hover:bg-white transition-all">
                Đăng Ký Miễn Phí
              </button>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default News;