import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import API_URL from '../config/api';

// ============================================================
// 4 thử thách tuần xoay vòng
// ============================================================
const WEEKLY_CHALLENGES = [
  {
    id: 'sunset',
    icon: '🌅',
    title: 'Hoàng Hôn',
    subtitle: 'Golden Hour Challenge',
    description: 'Chia sẻ bức ảnh hoàng hôn đẹp nhất của bạn để nhận huy hiệu độc quyền!',
    longDesc: 'Hoàng hôn Việt Nam luôn mang vẻ đẹp mê hồn — từ biển Phú Quốc, đèo Hải Vân đến Hồ Tây Hà Nội. Hãy chia sẻ khoảnh khắc vàng rực rỡ nhất mà bạn từng bắt gặp!',
    tag: '#HoangHonVietNam',
    reward: 'Thợ Săn Hoàng Hôn',
    rewardIcon: '🏅',
    bgImage: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?q=80&w=800',
    gradient: 'linear-gradient(135deg, #b44d12 0%, #c2570a 40%, #8b2252 100%)',
    accentColor: '#ff8c42',
    mockLeaderboard: [
      { name: 'Minh Phượt', avatar: 'https://i.pravatar.cc/150?img=11', points: 128 },
      { name: 'Hạnh Travel', avatar: 'https://i.pravatar.cc/150?img=5', points: 95 },
      { name: 'An Nhiên', avatar: 'https://i.pravatar.cc/150?img=23', points: 67 },
    ],
  },
  {
    id: 'beach',
    icon: '🏖️',
    title: 'Bãi Biển',
    subtitle: 'Ocean Vibes Challenge',
    description: 'Khoe bức ảnh bãi biển tuyệt đẹp nhất mà bạn từng đặt chân đến!',
    longDesc: 'Việt Nam sở hữu hơn 3.260 km bờ biển trải dài tuyệt đẹp. Từ Cô Tô, Cát Bà đến Nha Trang, Mũi Né — hãy cho mọi người thấy bãi biển nào khiến bạn nhớ nhất!',
    tag: '#BaiBienVietNam',
    reward: 'Người Con Của Biển',
    rewardIcon: '🏅',
    bgImage: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=80&w=800',
    gradient: 'linear-gradient(135deg, #065a82 0%, #0a7ea4 40%, #14919b 100%)',
    accentColor: '#14b8a6',
    mockLeaderboard: [
      { name: 'Sóng Biển', avatar: 'https://i.pravatar.cc/150?img=12', points: 142 },
      { name: 'Cát Trắng', avatar: 'https://i.pravatar.cc/150?img=9', points: 88 },
      { name: 'Nắng Biển', avatar: 'https://i.pravatar.cc/150?img=20', points: 53 },
    ],
  },
  {
    id: 'mountain',
    icon: '🏔️',
    title: 'Núi Rừng',
    subtitle: 'Mountain Explorer Challenge',
    description: 'Chia sẻ khoảnh khắc hùng vĩ giữa núi rừng Việt Nam!',
    longDesc: 'Fansipan, Tà Xùa, Y Tý, Bạch Mộc Lương Tử... Núi rừng Việt Nam ẩn chứa vẻ đẹp nguyên sơ và hùng vĩ. Hãy chia sẻ bức ảnh giữa mây trời núi rừng đẹp nhất của bạn!',
    tag: '#NuiRungVietNam',
    reward: 'Chinh Phục Đỉnh Cao',
    rewardIcon: '🏅',
    bgImage: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?q=80&w=800',
    gradient: 'linear-gradient(135deg, #0A4D2E 0%, #1a6b40 40%, #0A3D28 100%)',
    accentColor: '#22c55e',
    mockLeaderboard: [
      { name: 'Phượt Thủ 9x', avatar: 'https://i.pravatar.cc/150?img=33', points: 156 },
      { name: 'Đỉnh Mây', avatar: 'https://i.pravatar.cc/150?img=15', points: 102 },
      { name: 'Rừng Xanh', avatar: 'https://i.pravatar.cc/150?img=7', points: 74 },
    ],
  },
  {
    id: 'river',
    icon: '🏞️',
    title: 'Sông Suối',
    subtitle: 'Waterfall & River Challenge',
    description: 'Ghi lại vẻ đẹp mê hồn của sông suối, thác nước Việt Nam!',
    longDesc: 'Thác Bản Giốc, suối Yến Chùa Hương, sông Hương xứ Huế, kênh rạch miền Tây... Dòng nước Việt Nam chảy qua bao cảnh đẹp. Hãy chia sẻ khoảnh khắc bên sông suối tuyệt nhất!',
    tag: '#SongSuoiVietNam',
    reward: 'Dòng Chảy Bất Tận',
    rewardIcon: '🏅',
    bgImage: 'https://images.unsplash.com/photo-1432405972618-c6b0cfba8b04?q=80&w=800',
    gradient: 'linear-gradient(135deg, #065a60 0%, #0a7b73 40%, #2ec4b6 100%)',
    accentColor: '#2dd4bf',
    mockLeaderboard: [
      { name: 'Thác Nước', avatar: 'https://i.pravatar.cc/150?img=14', points: 113 },
      { name: 'Dòng Sông', avatar: 'https://i.pravatar.cc/150?img=3', points: 79 },
      { name: 'Miền Tây', avatar: 'https://i.pravatar.cc/150?img=25', points: 61 },
    ],
  },
];

// ============================================================
// Helpers
// ============================================================
function getISOWeekNumber() {
  const now = new Date();
  const d = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil(((d - yearStart) / 86400000 + 1) / 7);
}

function getTimeLeftInWeek() {
  const now = new Date();
  const dayOfWeek = now.getDay(); // 0=Sun
  const daysUntilMonday = dayOfWeek === 0 ? 1 : 8 - dayOfWeek;
  const nextMonday = new Date(now);
  nextMonday.setDate(now.getDate() + daysUntilMonday);
  nextMonday.setHours(0, 0, 0, 0);

  const diff = Math.max(0, nextMonday - now);
  return {
    days: Math.floor(diff / (1000 * 60 * 60 * 24)),
    hours: Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
    minutes: Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)),
    seconds: Math.floor((diff % (1000 * 60)) / 1000),
  };
}

// ============================================================
// Component
// ============================================================
export default function WeeklyChallenge({ onPostCreated }) {
  const weekNum = getISOWeekNumber();
  const challengeIndex = weekNum % 4;
  const challenge = WEEKLY_CHALLENGES[challengeIndex];

  const [showModal, setShowModal] = useState(false);
  const [content, setContent] = useState('');
  const [location, setLocation] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [timeLeft, setTimeLeft] = useState(getTimeLeftInWeek());
  const [submitted, setSubmitted] = useState(false);
  const [activeTab, setActiveTab] = useState('join'); // 'join' | 'leaderboard'
  const fileInputRef = useRef(null);

  let loggedInUser = null;
  try {
    const userData = localStorage.getItem('user');
    if (userData) loggedInUser = JSON.parse(userData);
  } catch (err) { /* ignore */ }

  // Countdown timer - tick every second
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(getTimeLeftInWeek());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Lock body scroll when modal open
  useEffect(() => {
    if (showModal) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [showModal]);

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const resetForm = () => {
    setContent('');
    setLocation('');
    setSelectedFile(null);
    setPreviewUrl('');
    setSubmitted(false);
    setActiveTab('join');
  };

  const handleOpenModal = () => {
    resetForm();
    setShowModal(true);
  };

  const handleSubmit = async () => {
    if (!loggedInUser) return alert('Vui lòng đăng nhập để tham gia thử thách!');
    if (!content.trim() && !selectedFile) return;

    setLoading(true);
    let finalImageUrl = '';

    try {
      // Upload image if selected
      if (selectedFile) {
        const formData = new FormData();
        formData.append('post_image', selectedFile);
        const uploadRes = await fetch(`${API_URL}/api/upload/post`, {
          method: 'POST',
          body: formData,
        });
        const uploadData = await uploadRes.json();
        if (uploadData.status === 'success') {
          finalImageUrl = uploadData.image_url;
        }
      }

      // Append challenge hashtag to content
      const fullContent = `${content.trim()}\n\n${challenge.tag} #ThuThachTuan`;

      const res = await fetch(`${API_URL}/api/posts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: loggedInUser.id,
          content: fullContent,
          location,
          image_url: finalImageUrl,
        }),
      });
      const data = await res.json();
      if (data.status === 'success') {
        setSubmitted(true);
        if (onPostCreated) onPostCreated();
        // Auto close after showing success
        setTimeout(() => {
          setShowModal(false);
          resetForm();
        }, 2500);
      } else {
        alert('Lỗi: ' + (data.message || 'Không xác định'));
      }
    } catch (err) {
      console.error(err);
      alert('Không thể kết nối đến server.');
    } finally {
      setLoading(false);
    }
  };

  // ============================================================
  // Render: Sidebar Card
  // ============================================================
  const SidebarCard = (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.2 }}
      className="relative p-6 rounded-[1.5rem] text-white text-center overflow-hidden cursor-pointer group"
      style={{ background: challenge.gradient }}
      onClick={handleOpenModal}
    >
      {/* Background image overlay */}
      <div
        className="absolute inset-0 opacity-15 bg-cover bg-center transition-opacity duration-500 group-hover:opacity-25"
        style={{ backgroundImage: `url('${challenge.bgImage}')` }}
      />
      {/* Shimmer effect */}
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700"
        style={{
          background: 'linear-gradient(105deg, transparent 40%, rgba(255,255,255,0.08) 45%, rgba(255,255,255,0.15) 50%, rgba(255,255,255,0.08) 55%, transparent 60%)',
          backgroundSize: '200% 100%',
          animation: 'shimmer 2s linear infinite',
        }}
      />

      <div className="relative z-10">
        {/* Icon with pulse */}
        <div className="relative inline-block mb-2">
          <span className="text-4xl block animate-bounce" style={{ animationDuration: '2s' }}>
            {challenge.icon}
          </span>
        </div>

        {/* Week badge */}
        <div className="inline-flex items-center gap-1.5 bg-white/15 backdrop-blur-sm px-3 py-1 rounded-full mb-3">
          <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
          <span className="text-[10px] font-bold uppercase tracking-widest text-white/90">
            Tuần {weekNum}
          </span>
        </div>

        <h4 className="font-heading text-xl font-bold mb-1">Thử Thách Tuần</h4>
        <p className="text-white/60 text-[10px] uppercase tracking-widest font-bold mb-3">
          {challenge.subtitle}
        </p>
        <p className="text-white/80 text-xs leading-relaxed mb-4">
          {challenge.description}
        </p>

        {/* Countdown mini */}
        <div className="flex justify-center gap-2 mb-4">
          {[
            { val: timeLeft.days, label: 'Ngày' },
            { val: timeLeft.hours, label: 'Giờ' },
            { val: timeLeft.minutes, label: 'Phút' },
          ].map((item, i) => (
            <div key={i} className="bg-black/30 backdrop-blur-sm rounded-lg px-2 py-1.5 min-w-[40px]">
              <span className="text-sm font-black text-white block leading-none">
                {String(item.val).padStart(2, '0')}
              </span>
              <span className="text-[8px] text-white/50 uppercase tracking-wider">{item.label}</span>
            </div>
          ))}
        </div>

        {/* CTA Button */}
        <button className="bg-[#D4AF37] text-black w-full py-2.5 rounded-full font-black text-xs uppercase tracking-widest hover:bg-white transition-all duration-300 hover:shadow-lg hover:shadow-[#D4AF37]/20">
          Tham Gia Ngay
        </button>

        {/* Points hint */}
        <p className="text-white/40 text-[10px] mt-2 flex items-center justify-center gap-1">
          ❤️ 1 lượt thích = 1 điểm
        </p>
      </div>
    </motion.div>
  );

  // ============================================================
  // Render: Modal
  // ============================================================
  const ChallengeModal = (
    <AnimatePresence>
      {showModal && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
          onClick={() => { setShowModal(false); resetForm(); }}
        >
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/70 backdrop-blur-md" />

          {/* Modal Content */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 30 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="relative w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-[2rem] border border-white/10 shadow-2xl custom-scrollbar"
            style={{ background: '#0A241A' }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Hero Header */}
            <div
              className="relative h-48 overflow-hidden"
              style={{ background: challenge.gradient }}
            >
              <img
                src={challenge.bgImage}
                alt={challenge.title}
                className="absolute inset-0 w-full h-full object-cover opacity-30 mix-blend-overlay"
              />
              {/* Gradient fade */}
              <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-[#0A241A]" />

              {/* Close button */}
              <button
                onClick={() => { setShowModal(false); resetForm(); }}
                className="absolute top-4 right-4 w-9 h-9 rounded-full bg-black/40 backdrop-blur-sm text-white/70 hover:text-white hover:bg-black/60 flex items-center justify-center transition-all z-10"
              >
                ✕
              </button>

              {/* Header content */}
              <div className="absolute bottom-0 left-0 right-0 p-6 z-10">
                <div className="flex items-center gap-3">
                  <span className="text-4xl">{challenge.icon}</span>
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-white font-heading text-2xl font-bold">
                        Thử Thách: {challenge.title}
                      </h2>
                    </div>
                    <p className="text-white/60 text-xs uppercase tracking-widest font-bold mt-0.5">
                      {challenge.subtitle} · Tuần {weekNum}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Body */}
            <div className="p-6 space-y-5">
              {/* Success state */}
              {submitted ? (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="text-center py-10"
                >
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', damping: 10, stiffness: 200, delay: 0.1 }}
                    className="text-6xl mb-4"
                  >
                    🎉
                  </motion.div>
                  <h3 className="text-white font-heading text-xl font-bold mb-2">
                    Tham Gia Thành Công!
                  </h3>
                  <p className="text-white/50 text-sm">
                    Bài viết của bạn đã được đăng với hashtag <span className="text-[#D4AF37] font-bold">{challenge.tag}</span>
                  </p>
                  <div className="mt-4 inline-flex items-center gap-2 bg-[#D4AF37]/10 text-[#D4AF37] px-4 py-2 rounded-full text-xs font-bold">
                    ❤️ Mỗi lượt thích = +1 điểm thử thách
                  </div>
                </motion.div>
              ) : (
                <>
                  {/* Challenge description */}
                  <div className="bg-[#0D2D1F] rounded-2xl p-4 border border-white/5">
                    <p className="text-white/75 text-sm leading-relaxed">
                      {challenge.longDesc}
                    </p>
                  </div>

                  {/* Rules & Rewards */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-[#0D2D1F] rounded-2xl p-4 border border-white/5">
                      <div className="text-lg mb-2">{challenge.rewardIcon}</div>
                      <h5 className="text-white/90 text-xs font-bold mb-1">Phần Thưởng</h5>
                      <p className="text-[#D4AF37] text-[11px] font-bold">{challenge.reward}</p>
                    </div>
                    <div className="bg-[#0D2D1F] rounded-2xl p-4 border border-white/5">
                      <div className="text-lg mb-2">💯</div>
                      <h5 className="text-white/90 text-xs font-bold mb-1">Tích Điểm</h5>
                      <p className="text-white/50 text-[11px]">
                        <span className="text-red-400 font-bold">1 ❤️</span> = <span className="text-[#D4AF37] font-bold">1 điểm</span>
                      </p>
                    </div>
                  </div>

                  {/* Countdown */}
                  <div className="bg-[#0D2D1F] rounded-2xl p-4 border border-white/5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-base">⏱️</span>
                        <span className="text-white/60 text-xs font-bold">Thời gian còn lại</span>
                      </div>
                      <div className="flex gap-1.5">
                        {[
                          { val: timeLeft.days, label: 'N' },
                          { val: timeLeft.hours, label: 'G' },
                          { val: timeLeft.minutes, label: 'P' },
                          { val: timeLeft.seconds, label: 'S' },
                        ].map((t, i) => (
                          <div key={i} className="bg-black/40 rounded-lg px-2 py-1 min-w-[36px] text-center">
                            <span className="text-sm font-black block leading-tight"
                              style={{ color: challenge.accentColor }}
                            >
                              {String(t.val).padStart(2, '0')}
                            </span>
                            <span className="text-[8px] text-white/30 uppercase">{t.label}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Tabs: Join / Leaderboard */}
                  <div className="flex gap-1 bg-[#0D2D1F] p-1 rounded-xl border border-white/5">
                    <button
                      onClick={() => setActiveTab('join')}
                      className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all uppercase tracking-widest ${
                        activeTab === 'join'
                          ? 'bg-[#D4AF37] text-black shadow-lg'
                          : 'text-white/40 hover:bg-white/5 hover:text-white/70'
                      }`}
                    >
                      ✍️ Tham Gia
                    </button>
                    <button
                      onClick={() => setActiveTab('leaderboard')}
                      className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all uppercase tracking-widest ${
                        activeTab === 'leaderboard'
                          ? 'bg-[#D4AF37] text-black shadow-lg'
                          : 'text-white/40 hover:bg-white/5 hover:text-white/70'
                      }`}
                    >
                      🏆 Bảng Xếp Hạng
                    </button>
                  </div>

                  <AnimatePresence mode="wait">
                    {activeTab === 'join' ? (
                      <motion.div
                        key="join"
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20 }}
                        transition={{ duration: 0.2 }}
                        className="space-y-4"
                      >
                        {/* Post Form */}
                        {!loggedInUser ? (
                          <div className="text-center py-8">
                            <div className="text-4xl mb-3">🔒</div>
                            <p className="text-white/50 text-sm">Vui lòng đăng nhập để tham gia thử thách</p>
                          </div>
                        ) : (
                          <>
                            {/* Avatar + Text */}
                            <div className="flex gap-3">
                              <img
                                src={loggedInUser.avatar_url || 'https://i.pravatar.cc/150'}
                                alt="avatar"
                                className="w-10 h-10 rounded-full object-cover border-2 flex-shrink-0"
                                style={{ borderColor: `${challenge.accentColor}40` }}
                                onError={(e) => { e.target.src = 'https://i.pravatar.cc/150'; }}
                              />
                              <textarea
                                placeholder={`Mô tả bức ảnh ${challenge.title.toLowerCase()} của bạn...`}
                                className="w-full bg-[#112418] text-white placeholder-white/20 p-4 rounded-xl resize-none h-28 outline-none text-sm border border-white/5 transition-all focus:ring-2"
                                style={{ '--tw-ring-color': `${challenge.accentColor}40` }}
                                value={content}
                                onChange={(e) => setContent(e.target.value)}
                              />
                            </div>

                            {/* Image Preview */}
                            {previewUrl && (
                              <div className="relative w-full h-48 rounded-xl overflow-hidden border border-white/10">
                                <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
                                <button
                                  onClick={() => { setSelectedFile(null); setPreviewUrl(''); }}
                                  className="absolute top-2 right-2 bg-black/60 backdrop-blur-sm text-white rounded-full w-8 h-8 flex items-center justify-center text-sm hover:bg-black transition-all"
                                >
                                  ✕
                                </button>
                              </div>
                            )}

                            {/* Action bar */}
                            <div className="flex items-center gap-3">
                              <input
                                type="file"
                                accept="image/*"
                                ref={fileInputRef}
                                onChange={handleFileChange}
                                className="hidden"
                              />
                              <button
                                onClick={() => fileInputRef.current?.click()}
                                className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold text-white/40 hover:bg-white/5 hover:text-white/70 transition-all border border-white/5"
                              >
                                <span className="text-base">🖼️</span> Thêm Ảnh
                              </button>
                              <div className="flex items-center gap-1.5 flex-1">
                                <span className="text-sm">📍</span>
                                <input
                                  type="text"
                                  placeholder="Thêm vị trí..."
                                  className="flex-1 bg-transparent text-white/60 placeholder-white/20 text-xs outline-none border-b border-white/10 pb-1"
                                  value={location}
                                  onChange={(e) => setLocation(e.target.value)}
                                />
                              </div>
                            </div>

                            {/* Hashtag preview */}
                            <div className="flex items-center gap-2 text-xs">
                              <span className="text-white/30">Hashtag:</span>
                              <span
                                className="px-2.5 py-1 rounded-full text-[11px] font-bold"
                                style={{ background: `${challenge.accentColor}15`, color: challenge.accentColor }}
                              >
                                {challenge.tag}
                              </span>
                              <span className="px-2.5 py-1 rounded-full bg-[#D4AF37]/10 text-[#D4AF37] text-[11px] font-bold">
                                #ThuThachTuan
                              </span>
                            </div>

                            {/* Submit */}
                            <button
                              onClick={handleSubmit}
                              disabled={loading || (!content.trim() && !selectedFile)}
                              className="w-full py-3 rounded-xl font-black text-sm uppercase tracking-widest transition-all duration-300 disabled:opacity-30 hover:shadow-lg"
                              style={{
                                background: challenge.accentColor,
                                color: '#000',
                              }}
                            >
                              {loading ? (
                                <span className="flex items-center justify-center gap-2">
                                  <span className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                                  Đang đăng...
                                </span>
                              ) : (
                                `🚀 Gửi Bài Thử Thách ${challenge.title}`
                              )}
                            </button>
                          </>
                        )}
                      </motion.div>
                    ) : (
                      <motion.div
                        key="leaderboard"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        transition={{ duration: 0.2 }}
                        className="space-y-3"
                      >
                        {/* Leaderboard header */}
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <span className="text-base">🏆</span>
                            <span className="text-white/70 text-xs font-bold uppercase tracking-widest">
                              Top Người Chơi
                            </span>
                          </div>
                          <span className="text-[10px] text-white/30 font-bold">
                            Theo điểm ❤️
                          </span>
                        </div>

                        {/* Leaderboard list */}
                        {challenge.mockLeaderboard.map((user, i) => (
                          <motion.div
                            key={i}
                            initial={{ opacity: 0, y: 15 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.1 }}
                            className="flex items-center gap-3 bg-[#0D2D1F] p-3 rounded-2xl border border-white/5 hover:border-white/10 transition-all"
                          >
                            {/* Rank */}
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-black text-sm ${
                              i === 0
                                ? 'bg-[#D4AF37]/20 text-[#D4AF37]'
                                : i === 1
                                  ? 'bg-gray-400/20 text-gray-300'
                                  : 'bg-amber-700/20 text-amber-600'
                            }`}>
                              {i === 0 ? '👑' : i + 1}
                            </div>

                            {/* Avatar */}
                            <img
                              src={user.avatar}
                              alt={user.name}
                              className="w-9 h-9 rounded-full object-cover"
                              style={{ border: `2px solid ${i === 0 ? '#D4AF37' : 'rgba(255,255,255,0.1)'}` }}
                            />

                            {/* Info */}
                            <div className="flex-1 min-w-0">
                              <span className="text-white/90 text-sm font-bold block truncate">
                                {user.name}
                              </span>
                              <span className="text-white/30 text-[10px]">
                                {challenge.tag}
                              </span>
                            </div>

                            {/* Points */}
                            <div className="text-right">
                              <span className="font-black text-sm block leading-tight"
                                style={{ color: challenge.accentColor }}
                              >
                                {user.points}
                              </span>
                              <span className="text-[10px] text-white/30">điểm ❤️</span>
                            </div>
                          </motion.div>
                        ))}

                        {/* Your score */}
                        {loggedInUser && (
                          <div
                            className="mt-2 p-3 rounded-2xl border-2 border-dashed text-center"
                            style={{ borderColor: `${challenge.accentColor}30` }}
                          >
                            <p className="text-white/40 text-xs mb-1">Điểm của bạn</p>
                            <p className="font-black text-2xl" style={{ color: challenge.accentColor }}>
                              0
                            </p>
                            <p className="text-white/30 text-[10px] mt-1">
                              Tham gia thử thách để tích điểm!
                            </p>
                          </div>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  return (
    <>
      {SidebarCard}
      {ChallengeModal}
    </>
  );
}
