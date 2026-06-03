import React, { useState, useMemo, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLocation } from 'react-router-dom';
import superGuideData from '../data/superGuideContent.json';
import vnexpressGuides from '../data/vnexpressGuides.json';
import API_URL from '../config/api';

// ============================================================
// CONSTANTS & UTILS
// ============================================================
const fadeUp = { hidden: { opacity: 0, y: 30 }, visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: 'easeOut' } } };

// ============================================================
function Guide() {
  const locationState = useLocation();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchFocused, setSearchFocused] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState(superGuideData[0]);
  const [checked, setChecked] = useState([]);
  const [aiQuestion, setAiQuestion] = useState('');
  const [aiAnswer, setAiAnswer] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [aiSources, setAiSources] = useState([]);
  const aiAnswerRef = useRef(null);
  
  const vnGuides = vnexpressGuides;
  const loadingGuides = false;

  // Tự động chọn địa điểm nếu được chuyển hướng từ trang khác
  useEffect(() => {
    if (locationState.state?.locationName) {
      const normalize = (str) => (str || '').replace(/\s+/g, '').toLowerCase();
      const normalizedNameToFind = normalize(locationState.state.locationName);
      const normalizedProvinceToFind = normalize(locationState.state.province);
      
      // Ưu tiên tìm theo tên trước
      let found = superGuideData.find(loc =>
        normalize(loc.name).includes(normalizedNameToFind) ||
        normalizedNameToFind.includes(normalize(loc.name))
      );

      // Nếu không thấy theo tên, thử tìm theo tỉnh/thành được truyền
      if (!found && normalizedProvinceToFind) {
        found = superGuideData.find(loc => 
          normalize(loc.province).includes(normalizedProvinceToFind) ||
          normalizedProvinceToFind.includes(normalize(loc.province))
        );
      }

      // Nếu vẫn không thấy, thử tìm province dựa trên tên location (người dùng có thể gõ nhầm tỉnh vào tên)
      if (!found) {
        found = superGuideData.find(loc => 
          normalize(loc.province).includes(normalizedNameToFind) ||
          normalizedNameToFind.includes(normalize(loc.province))
        );
      }

      if (found) {
        setSelectedLocation(found);
        // Scroll xuống phần chi tiết sau khi render
        setTimeout(() => {
          const element = document.getElementById('itinerary-section');
          if (element) element.scrollIntoView({ behavior: 'smooth' });
        }, 300);
      }
    }
  }, [locationState]);

  // Filter logic: If search matches a province, show all locations in that province.
  // Otherwise, match by location name.
  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return [];

    const query = searchQuery.toLowerCase().trim();

    // Check if query is a province
    const provinceMatches = superGuideData.filter(loc =>
      loc.province.toLowerCase().includes(query)
    );

    // Check if query is a location name
    const nameMatches = superGuideData.filter(loc =>
      loc.name.toLowerCase().includes(query)
    );

    // Combine and unique
    const combined = [...new Set([...provinceMatches, ...nameMatches])];
    return combined;
  }, [searchQuery]);

  const checklistItems = useMemo(() => {
    const specific = selectedLocation.hangTrang ? selectedLocation.hangTrang.split(',').map(s => s.trim()) : [];
    const essentials = ['Giấy tờ tùy thân', 'Tiền mặt & Thẻ', 'Sạc dự phòng'];
    // Merge and remove duplicates (simple case-insensitive check)
    const combined = [...specific];
    essentials.forEach(e => {
      if (!combined.some(c => c.toLowerCase() === e.toLowerCase())) {
        combined.push(e);
      }
    });
    return combined;
  }, [selectedLocation]);

  const toggleCheck = (item) =>
    setChecked((prev) => prev.includes(item) ? prev.filter((i) => i !== item) : [...prev, item]);

  const handleSelectLocation = (loc) => {
    setSelectedLocation(loc);
    setSearchQuery('');
    setAiAnswer('');
    setAiQuestion('');
    setAiSources([]);
    // Scroll to details
    const element = document.getElementById('itinerary-section');
    if (element) element.scrollIntoView({ behavior: 'smooth' });
  };

  // AI Ask Handler
  const askAI = async (questionText) => {
    const q = questionText || aiQuestion;
    if (!q.trim() || aiLoading) return;
    setAiLoading(true);
    setAiAnswer('');
    setAiSources([]);

    try {
      const res = await fetch(`${API_URL}/api/ai/guide-ask`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          locationName: selectedLocation.name,
          question: q.trim()
        })
      });

      if (res.status === 503) {
        setAiAnswer('⚠️ AI đang offline. Vui lòng cấu hình biến môi trường GROQ_API_KEY trong file .env hoặc trên Render.');
        return;
      }

      const data = await res.json();
      if (data.status === 'success') {
        setAiAnswer(data.answer);
        setAiSources(data.sources || []);
      } else {
        setAiAnswer('Xin lỗi, mình gặp lỗi khi xử lý câu hỏi. Thử lại nhé!');
      }
    } catch (err) {
      setAiAnswer('❌ Không thể kết nối AI. Vui lòng kiểm tra file .env hoặc cấu hình key Groq.');
    } finally {
      setAiLoading(false);
      setTimeout(() => {
        aiAnswerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }, 200);
    }
  };

  return (
    <div className="min-h-screen bg-[#0A241A]">

      {/* ===== HERO HEADER ===== */}
      <div className="relative h-[60vh] flex items-center justify-center">
        <div className="absolute inset-0 z-0">
          <img
            src="/guide_bg.png"
            alt="Vietnam Background"
            className="w-full h-full object-cover opacity-40 scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-[#0A241A]/60 via-transparent to-[#0A241A]" />
        </div>

        <div className="relative z-10 px-5 max-w-[1200px] mx-auto text-center">
          <motion.div initial="hidden" animate="visible" variants={fadeUp}>
            <p className="text-[#D4AF37] font-bold uppercase tracking-[0.4em] text-xs mb-3">WanderlyVietNam · Siêu Cẩm Nang Toàn Tập</p>
            <h1 className="text-5xl md:text-7xl font-heading font-bold text-[#F5F2EB] leading-tight mb-6">
              Tìm Kiếm <span className="text-[#D4AF37] italic font-light">Cẩm Nang</span>
            </h1>
          </motion.div>

          {/* SEARCH BAR */}
          <div className="max-w-2xl mx-auto relative">
            <div className={`flex items-center gap-3 bg-white/5 backdrop-blur-md rounded-2xl px-6 py-5 border-2 transition-all duration-500 ${searchFocused ? 'border-[#D4AF37] bg-white/10 shadow-[0_0_30px_rgba(212,175,55,0.2)]' : 'border-white/10'}`}>
              <svg className={`w-6 h-6 flex-shrink-0 transition-colors duration-300 ${searchFocused ? 'text-[#D4AF37]' : 'text-white/30'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-4.35-4.35m0 0A7.5 7.5 0 104.5 4.5a7.5 7.5 0 0012.15 12.15z" />
              </svg>
              <input
                type="text"
                placeholder="Nhập Tỉnh/Thành phố hoặc Địa danh..."
                className="flex-1 bg-transparent text-white placeholder-white/30 outline-none text-lg font-medium"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => setSearchFocused(true)}
                onBlur={() => setTimeout(() => setSearchFocused(false), 200)}
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery('')} className="text-white/30 hover:text-white text-2xl">&times;</button>
              )}
            </div>

            {/* SEARCH RESULTS DROPDOWN */}
            <AnimatePresence>
              {searchQuery && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }}
                  className="absolute top-full left-0 right-0 mt-3 bg-[#112418] border border-white/10 rounded-2xl overflow-hidden z-50 shadow-2xl max-h-[450px] overflow-y-auto custom-scrollbar"
                >
                  {searchResults.length > 0 ? (
                    searchResults.map((loc, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleSelectLocation(loc)}
                        className="w-full text-left px-6 py-4 hover:bg-[#D4AF37]/10 border-b border-white/5 last:border-0 transition-colors group"
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-[#F5F2EB] font-bold group-hover:text-[#D4AF37] transition-colors">{loc.name}</p>
                            <p className="text-white/30 text-xs uppercase tracking-widest">{loc.province}</p>
                          </div>
                          <span className="text-[#D4AF37] opacity-0 group-hover:opacity-100 transition-opacity">Xem ngay ➜</span>
                        </div>
                      </button>
                    ))
                  ) : (
                    <div className="px-6 py-8 text-center text-white/30">
                      Không tìm thấy kết quả. Thử nhập tên Tỉnh hoặc Thành phố.
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* ===== SECTION: CHI TIẾT ĐỊA DANH ===== */}
      <section id="itinerary-section" className="max-w-[1200px] mx-auto px-5 py-20">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">

          {/* Left Column: Essential Info */}
          <div className="lg:col-span-5 space-y-8">
            <motion.div key={selectedLocation.name} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5 }}>
              <p className="text-[#D4AF37] font-bold uppercase tracking-[0.3em] text-[10px] mb-2">{selectedLocation.province}</p>
              <h2 className="text-4xl md:text-5xl font-heading font-bold text-[#F5F2EB] mb-8">{selectedLocation.name}</h2>

              <div className="space-y-6">
                {/* Info Cards */}
                {[
                  { icon: '🎒', label: 'Hành trang', text: selectedLocation.hangTrang, color: 'border-blue-500/20 text-blue-400' },
                  { icon: '💰', label: 'Tiết kiệm', text: selectedLocation.tietKiem, color: 'border-yellow-500/20 text-yellow-400' },
                  { icon: '🛡️', label: 'An toàn', text: selectedLocation.anToan, color: 'border-red-500/20 text-red-400' },
                ].map((item, i) => (
                  <div key={i} className={`p-6 rounded-2xl bg-white/5 border ${item.color.split(' ')[0]} backdrop-blur-sm group hover:bg-white/[0.08] transition-all`}>
                    <div className="flex items-start gap-4">
                      <span className="text-2xl">{item.icon}</span>
                      <div>
                        <p className="text-xs font-black uppercase tracking-widest mb-1 opacity-60">{item.label}</p>
                        <p className="text-[#F5F2EB] text-sm leading-relaxed">{item.text || 'Đang cập nhật thông tin...'}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>

            <div className="p-8 rounded-3xl bg-[#0D2D1F] border border-white/10">
              <h3 className="text-[#F5F2EB] font-bold text-lg mb-4 flex items-center gap-2">
                <span className="text-[#D4AF37]">✓</span> Checklist Chuẩn Bị
              </h3>
              <div className="space-y-3">
                {checklistItems.map(item => (
                  <button key={item} onClick={() => toggleCheck(item)}
                    className={`w-full flex items-center gap-3 p-3 rounded-xl border text-left transition-all ${checked.includes(item) ? 'bg-[#D4AF37]/10 border-[#D4AF37]/40 text-[#D4AF37]' : 'bg-white/5 border-white/5 text-white/50'
                      }`}
                  >
                    <div className={`w-4 h-4 rounded border flex items-center justify-center ${checked.includes(item) ? 'bg-[#D4AF37] border-[#D4AF37]' : 'border-white/20'}`}>
                      {checked.includes(item) && <span className="text-black text-[10px] font-black">✓</span>}
                    </div>
                    <span className="text-xs font-medium">{item}</span>
                  </button>
                ))}
              </div>
              <p className="text-white/20 text-[10px] text-center mt-4 italic">
                {checked.filter(i => checklistItems.includes(i)).length}/{checklistItems.length} mục đã chuẩn bị
              </p>
            </div>
          </div>

          {/* Right Column: Detailed Itineraries */}
          <div className="lg:col-span-7">
            <div className="p-8 md:p-12 rounded-[2.5rem] bg-[#0D2D1F] border border-white/10 shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-[#D4AF37]/5 rounded-full blur-3xl -mr-32 -mt-32"></div>

              <div className="relative z-10">
                <div className="flex items-center justify-between mb-12">
                  <div>
                    <p className="text-[#C27A5B] font-bold uppercase tracking-[0.3em] text-[10px] mb-1">Gợi ý lộ trình</p>
                    <h3 className="text-2xl font-heading font-bold text-[#F5F2EB]">Lịch Trình Chi Tiết</h3>
                  </div>
                  <span className="text-4xl grayscale opacity-20">🗺️</span>
                </div>

                <div className="space-y-12 relative before:absolute before:left-6 before:top-4 before:bottom-4 before:w-px before:bg-gradient-to-b before:from-[#D4AF37] before:via-white/10 before:to-transparent">
                  {selectedLocation.itinerary.map((iti, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
                      className="relative pl-16"
                    >
                      <div className="absolute left-0 top-0 w-12 h-12 rounded-2xl bg-[#112418] border border-[#D4AF37]/30 flex items-center justify-center z-10 shadow-xl group-hover:scale-110 transition-transform">
                        <span className="text-[#D4AF37] text-sm font-black italic">{i + 1}</span>
                      </div>
                      <div>
                        <span className="inline-block px-3 py-1 rounded-md bg-[#D4AF37]/10 text-[#D4AF37] text-[10px] font-black uppercase tracking-widest mb-3 border border-[#D4AF37]/20">
                          {iti.duration}
                        </span>
                        <p className="text-[#F5F2EB] text-lg font-medium leading-relaxed">
                          {iti.content}
                        </p>
                      </div>
                    </motion.div>
                  ))}

                  {selectedLocation.itinerary.length === 0 && (
                    <p className="text-white/30 italic text-center py-10">Thông tin lịch trình đang được cập nhật...</p>
                  )}
                </div>

                {/* ===== AI ASK SECTION ===== */}
                <div className="mt-12 p-6 rounded-2xl border border-[#D4AF37]/20 relative overflow-hidden" style={{ background: 'linear-gradient(135deg, rgba(212,175,55,0.05) 0%, rgba(194,122,91,0.05) 100%)' }}>
                  <div className="absolute top-0 right-0 w-32 h-32 bg-[#D4AF37]/5 rounded-full blur-3xl -mr-16 -mt-16" />
                  
                  <div className="relative z-10">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #D4AF37 0%, #C27A5B 100%)' }}>
                        <svg className="w-4.5 h-4.5 text-[#0A241A]" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/>
                        </svg>
                      </div>
                      <div>
                        <p className="text-[#F5F2EB] font-bold text-sm">Hỏi AI về {selectedLocation.name}</p>
                        <p className="text-white/30 text-[10px]">Powered by WanderlyAI</p>
                      </div>
                    </div>

                    {/* Quick suggestions for this location */}
                    <div className="flex flex-wrap gap-2 mb-4">
                      {[
                        `Ăn gì ở ${selectedLocation.name}?`,
                        `Mẹo du lịch ${selectedLocation.name}`,
                        `${selectedLocation.name} có gì vui?`,
                      ].map((q, i) => (
                        <button
                          key={i}
                          onClick={() => { setAiQuestion(q); askAI(q); }}
                          disabled={aiLoading}
                          className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-white/50 text-[10px] hover:bg-[#D4AF37]/10 hover:border-[#D4AF37]/30 hover:text-[#D4AF37] transition-all disabled:opacity-40"
                        >
                          {q}
                        </button>
                      ))}
                    </div>

                    {/* Input */}
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={aiQuestion}
                        onChange={e => setAiQuestion(e.target.value)}
                        onKeyDown={e => { if (e.key === 'Enter') askAI(); }}
                        placeholder={`Hỏi bất cứ điều gì về ${selectedLocation.name}...`}
                        disabled={aiLoading}
                        className="flex-1 bg-white/[0.06] border border-white/10 rounded-xl px-4 py-3 text-[#F5F2EB] text-sm placeholder-white/25 outline-none focus:border-[#D4AF37]/50 transition-all disabled:opacity-40"
                      />
                      <button
                        onClick={() => askAI()}
                        disabled={!aiQuestion.trim() || aiLoading}
                        className="px-5 py-3 rounded-xl text-xs font-bold uppercase tracking-wider transition-all disabled:opacity-30"
                        style={{
                          background: aiQuestion.trim() && !aiLoading
                            ? 'linear-gradient(135deg, #D4AF37 0%, #C27A5B 100%)'
                            : 'rgba(255,255,255,0.06)',
                          color: aiQuestion.trim() && !aiLoading ? '#0A241A' : 'rgba(255,255,255,0.3)'
                        }}
                      >
                        {aiLoading ? (
                          <div className="flex gap-1">
                            <div className="ai-typing-dot w-1.5 h-1.5 rounded-full bg-current" style={{ animationDelay: '0ms' }} />
                            <div className="ai-typing-dot w-1.5 h-1.5 rounded-full bg-current" style={{ animationDelay: '150ms' }} />
                            <div className="ai-typing-dot w-1.5 h-1.5 rounded-full bg-current" style={{ animationDelay: '300ms' }} />
                          </div>
                        ) : 'Hỏi'}
                      </button>
                    </div>

                    {/* AI Answer */}
                    <AnimatePresence>
                      {aiAnswer && (
                        <motion.div
                          ref={aiAnswerRef}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0 }}
                          className="mt-4 p-4 rounded-xl bg-white/[0.04] border border-white/[0.08]"
                        >
                          <p className="text-[#F5F2EB]/90 text-sm leading-relaxed whitespace-pre-wrap">{aiAnswer}</p>
                          {aiSources.length > 0 && (
                            <div className="mt-3 pt-3 border-t border-white/5 flex flex-wrap gap-1">
                              {aiSources.map((s, i) => (
                                <span key={i} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-[#D4AF37]/10 text-[9px] text-[#D4AF37]">
                                  📍 {s.name}
                                </span>
                              ))}
                            </div>
                          )}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>

                <div className="mt-16 pt-8 border-t border-white/5 flex flex-col md:flex-row items-center justify-between gap-6">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-xl">📄</div>
                    <div>
                      <p className="text-white/70 text-xs font-bold">Lưu cẩm nang này</p>
                      <p className="text-white/30 text-[10px]">Tải về bản PDF để xem ngoại tuyến</p>
                    </div>
                  </div>
                  <button className="px-8 py-3 rounded-xl bg-[#D4AF37] text-black text-xs font-black uppercase tracking-widest hover:bg-[#f1c40f] transition-all shadow-lg shadow-[#D4AF37]/20">
                    Tải PDF Miễn Phí
                  </button>
                </div>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* ===== SECTION: CẨM NANG NỔI BẬT (VNEXPRESS) ===== */}
      <section className="max-w-[1200px] mx-auto px-5 pb-24 border-t border-white/5 pt-20">
        <div className="flex flex-col md:flex-row justify-between items-end mb-10">
          <div>
            <p className="text-[#D4AF37] font-bold uppercase tracking-[0.3em] text-xs mb-3">WarderlyVietNam</p>
            <h2 className="text-4xl font-heading font-bold text-[#F5F2EB]">Cẩm Nang <span className="text-[#D4AF37] italic font-light">Nổi Bật</span></h2>
          </div>
        </div>

        {loadingGuides ? (
          <div className="text-center py-16">
            <div className="text-4xl mb-3 animate-pulse">⏳</div>
            <p className="text-white/30 text-xs uppercase tracking-widest">Đang tải cẩm nang...</p>
          </div>
        ) : (
          <div className="relative overflow-hidden w-full py-4 -mx-5 px-5">
            <div className="flex gap-6 w-max animate-marquee">
              {[...vnGuides, ...vnGuides].map((guide, i) => (
                <div
                  key={`${guide.id}-${i}`}
                  onClick={() => window.open(guide.link, '_blank')}
                  className="w-[280px] sm:w-[320px] flex-shrink-0 group relative h-[400px] rounded-[1.5rem] overflow-hidden cursor-pointer border border-white/5 bg-[#112418] hover:border-[#D4AF37]/40 hover:shadow-[0_10px_30px_rgba(212,175,55,0.2)] transition-all duration-500 flex flex-col"
                >
                  <div className="h-[200px] relative overflow-hidden shrink-0">
                    <img src={guide.image_url} alt={guide.title} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 opacity-90 group-hover:opacity-100" />
                    <div className="absolute top-4 left-4 bg-black/60 backdrop-blur-md text-white text-[10px] font-black px-3 py-1.5 rounded-full border border-white/10 uppercase tracking-wider">
                      {guide.category}
                    </div>
                  </div>
                  <div className="p-5 flex flex-col flex-1">
                    <h3 className="text-lg font-heading font-bold text-white mb-2 line-clamp-2 group-hover:text-[#D4AF37] transition-colors">{guide.title}</h3>
                    <p className="text-white/60 text-[11px] leading-relaxed mb-4 line-clamp-3 flex-1">
                      {guide.excerpt}
                    </p>
                    <div className="mt-auto pt-4 border-t border-white/10 flex justify-between items-center text-white/40 text-[10px] uppercase tracking-widest">
                      <span className="text-[#D4AF37] group-hover:text-white transition-colors">Đọc tiếp ➜</span>
                      <span>⏱ {guide.read_time}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </section>

    </div>
  );
}

export default Guide;