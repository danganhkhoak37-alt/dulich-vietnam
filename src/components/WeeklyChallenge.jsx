import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
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
    bgImage: 'https://images.unsplash.com/photo-1508873696983-2df5293cb39f?q=80&w=800',
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
        <div className="fixed inset-0 z-[99999] flex items-center justify-center p-3 sm:p-5 overflow-hidden">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/85 backdrop-blur-md"
            onClick={() => { setShowModal(false); resetForm(); }}
          />

          {/* Modal Content Card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: 25 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 25 }}
            transition={{ type: 'spring', damping: 26, stiffness: 320 }}
            className="relative w-full max-w-lg max-h-[90vh] flex flex-col rounded-[2rem] border border-white/15 shadow-[0_25px_60px_rgba(0,0,0,0.8)] overflow-hidden z-10"
            style={{ background: '#0A241A' }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Hero Header (Sticky at top of modal) */}
            <div
              className="relative h-44 sm:h-48 overflow-hidden flex-shrink-0 select-none"
              style={{ background: challenge.gradient }}
            >
              <img
                src={challenge.bgImage}
                alt={challenge.title}
                className="absolute inset-0 w-full h-full object-cover opacity-35 mix-blend-overlay"
                onError={(e) => { e.target.style.display = 'none'; }}
              />
              {/* Gradient fade to body */}
              <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-[#0A241A]" />

              {/* Close button */}
              <button
                type="button"
                onClick={() => { setShowModal(false); resetForm(); }}
                className="absolute top-4 right-4 w-9 h-9 rounded-full bg-black/60 hover:bg-black/80 backdrop-blur-md text-white/80 hover:text-white flex items-center justify-center transition-all z-30 shadow-lg cursor-pointer hover:scale-105 active:scale-95 border border-white/10"
                aria-label="Đóng"
              >
                ✕
              </button>

              {/* Header content */}
              <div className="absolute bottom-0 left-0 right-0 p-5 sm:p-6 z-10">
                <div className="flex items-center gap-3.5">
                  <div className="w-13 h-13 sm:w-14 sm:h-14 rounded-2xl bg-black/30 backdrop-blur-md flex items-center justify-center text-3xl sm:text-4xl shadow-lg border border-white/10 flex-shrink-0">
                    {challenge.icon}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="bg-white/20 backdrop-blur-md text-white text-[10px] font-black uppercase tracking-widest px-2.5 py-0.5 rounded-full">
                        Tuần {weekNum}
                      </span>
                    </div>
                    <h2 className="text-white font-heading text-xl sm:text-2xl font-bold mt-1 leading-tight">
                      Thử Thách: {challenge.title}
                    </h2>
                    <p className="text-white/70 text-[11px] font-semibold uppercase tracking-wider mt-0.5">
                      {challenge.subtitle}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Scrollable Body */}
            <div className="p-5 sm:p-6 space-y-5 overflow-y-auto flex-1 custom-scrollbar">
              {/* Success state */}
              {submitted ? (
                <motion.div
                  initial={{ opacity: 0, scale: 0.85 }}
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
                  <p className="text-white/60 text-sm">
                    Bài viết của bạn đã được đăng lên cộng đồng cùng hashtag{' '}
                    <span className="text-[#D4AF37] font-bold">{challenge.tag}</span>
                  </p>
                  <div className="mt-4 inline-flex items-center gap-2 bg-[#D4AF37]/15 text-[#D4AF37] border border-[#D4AF37]/30 px-4 py-2 rounded-full text-xs font-bold shadow-sm">
                    ❤️ Mỗi lượt thích bài viết = +1 điểm thử thách
                  </div>
                </motion.div>
              ) : (
                <>
                  {/* Challenge description */}
                  <div className="bg-[#0D2D1F] rounded-2xl p-4 border border-white/5 shadow-inner">
                    <p className="text-white/85 text-xs sm:text-sm leading-relaxed">
                      {challenge.longDesc}
                    </p>
                  </div>

                  {/* Rules & Rewards */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-[#0D2D1F] rounded-2xl p-3.5 sm:p-4 border border-white/5 flex flex-col justify-between">
                      <div className="text-2xl mb-1.5">{challenge.rewardIcon}</div>
                      <div>
                        <h5 className="text-white/60 text-[10px] uppercase font-bold tracking-wider mb-0.5">Huy Hiệu</h5>
                        <p className="text-[#D4AF37] text-xs sm:text-sm font-black">{challenge.reward}</p>
                      </div>
                    </div>
                    <div className="bg-[#0D2D1F] rounded-2xl p-3.5 sm:p-4 border border-white/5 flex flex-col justify-between">
                      <div className="text-2xl mb-1.5">🎯</div>
                      <div>
                        <h5 className="text-white/60 text-[10px] uppercase font-bold tracking-wider mb-0.5">Tích Điểm</h5>
                        <p className="text-white/90 text-xs sm:text-sm font-black">
                          <span className="text-red-400">1 ❤️</span> = <span className="text-[#D4AF37]">1 điểm</span>
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Countdown */}
                  <div className="bg-[#0D2D1F] rounded-2xl p-3.5 sm:p-4 border border-white/5">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">⏱️</span>
                        <span className="text-white/70 text-xs font-bold">Thời gian còn lại</span>
                      </div>
                      <div className="flex gap-1 sm:gap-1.5">
                        {[
                          { val: timeLeft.days, label: 'Ngày' },
                          { val: timeLeft.hours, label: 'Giờ' },
                          { val: timeLeft.minutes, label: 'Phút' },
                          { val: timeLeft.seconds, label: 'Giây' },
                        ].map((t, i) => (
                          <div key={i} className="bg-black/50 rounded-xl px-2 py-1 min-w-[38px] text-center border border-white/5">
                            <span
                              className="text-sm font-black block leading-tight"
                              style={{ color: challenge.accentColor }}
                            >
                              {String(t.val).padStart(2, '0')}
                            </span>
                            <span className="text-[8px] text-white/40 uppercase font-semibold">{t.label}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Tabs: Join / Leaderboard */}
                  <div className="flex gap-1.5 bg-[#0D2D1F] p-1.5 rounded-2xl border border-white/5">
                    <button
                      type="button"
                      onClick={() => setActiveTab('join')}
                      className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all uppercase tracking-wider flex items-center justify-center gap-1.5 cursor-pointer ${
                        activeTab === 'join'
                          ? 'bg-[#D4AF37] text-black shadow-lg font-black'
                          : 'text-white/50 hover:bg-white/5 hover:text-white'
                      }`}
                    >
                      <span>✍️</span> Tham Gia
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveTab('leaderboard')}
                      className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all uppercase tracking-wider flex items-center justify-center gap-1.5 cursor-pointer ${
                        activeTab === 'leaderboard'
                          ? 'bg-[#D4AF37] text-black shadow-lg font-black'
                          : 'text-white/50 hover:bg-white/5 hover:text-white'
                      }`}
                    >
                      <span>🏆</span> Bảng Xếp Hạng
                    </button>
                  </div>

                  <AnimatePresence mode="wait">
                    {activeTab === 'join' ? (
                      <motion.div
                        key="join"
                        initial={{ opacity: 0, x: -15 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 15 }}
                        transition={{ duration: 0.2 }}
                        className="space-y-4"
                      >
                        {/* Post Form */}
                        {!loggedInUser ? (
                          <div className="text-center py-6 px-4 bg-[#0D2D1F] rounded-2xl border border-white/5">
                            <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center text-2xl mx-auto mb-3">
                              🔒
                            </div>
                            <h4 className="text-white font-bold text-sm mb-1">Chưa Đăng Nhập</h4>
                            <p className="text-white/50 text-xs mb-4">
                              Bạn cần đăng nhập tài khoản để gửi bài tham gia thử thách tuần và nhận huy hiệu!
                            </p>
                            <p className="text-[#D4AF37] text-xs font-bold">
                              👉 Vui lòng nhấn nút "ĐĂNG NHẬP" ở góc trên màn hình để tiếp tục.
                            </p>
                          </div>
                        ) : (
                          <>
                            {/* Avatar + Text */}
                            <div className="flex gap-3">
                              <img
                                src={loggedInUser.avatar_url?.startsWith('/') ? `${API_URL}${loggedInUser.avatar_url}` : (loggedInUser.avatar_url || 'https://i.pravatar.cc/150')}
                                alt="avatar"
                                className="w-10 h-10 rounded-full object-cover border-2 flex-shrink-0"
                                style={{ borderColor: `${challenge.accentColor}60` }}
                                onError={(e) => { e.target.src = 'https://i.pravatar.cc/150'; }}
                              />
                              <textarea
                                placeholder={`Mô tả khoảnh khắc ${challenge.title.toLowerCase()} ấn tượng của bạn...`}
                                className="w-full bg-[#112418] text-white placeholder-white/25 p-3.5 rounded-2xl resize-none h-24 outline-none text-xs sm:text-sm border border-white/10 transition-all focus:border-[#D4AF37]/60 focus:ring-2 focus:ring-[#D4AF37]/20"
                                value={content}
                                onChange={(e) => setContent(e.target.value)}
                              />
                            </div>

                            {/* Image Preview */}
                            {previewUrl && (
                              <div className="relative w-full h-44 rounded-2xl overflow-hidden border border-white/10 bg-black/40">
                                <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
                                <button
                                  type="button"
                                  onClick={() => { setSelectedFile(null); setPreviewUrl(''); }}
                                  className="absolute top-2.5 right-2.5 bg-black/70 backdrop-blur-md text-white rounded-full w-8 h-8 flex items-center justify-center text-sm hover:bg-black transition-all border border-white/15 cursor-pointer"
                                >
                                  ✕
                                </button>
                              </div>
                            )}

                            {/* Action bar */}
                            <div className="flex flex-wrap items-center gap-3">
                              <input
                                type="file"
                                accept="image/*"
                                ref={fileInputRef}
                                onChange={handleFileChange}
                                className="hidden"
                              />
                              <button
                                type="button"
                                onClick={() => fileInputRef.current?.click()}
                                className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold text-white/70 hover:bg-white/10 hover:text-white transition-all border border-white/10 bg-white/5 cursor-pointer"
                              >
                                <span className="text-base">🖼️</span> {selectedFile ? 'Đổi Ảnh' : 'Thêm Ảnh'}
                              </button>
                              <div className="flex items-center gap-1.5 flex-1 min-w-[140px] bg-white/5 border border-white/10 rounded-xl px-3 py-1.5">
                                <span className="text-sm">📍</span>
                                <input
                                  type="text"
                                  placeholder="Địa điểm..."
                                  className="w-full bg-transparent text-white/80 placeholder-white/30 text-xs outline-none"
                                  value={location}
                                  onChange={(e) => setLocation(e.target.value)}
                                />
                              </div>
                            </div>

                            {/* Hashtag preview */}
                            <div className="flex flex-wrap items-center gap-2 text-xs pt-1">
                              <span className="text-white/40 text-[11px]">Tự động gắn thẻ:</span>
                              <span
                                className="px-2.5 py-0.5 rounded-full text-[11px] font-bold border"
                                style={{
                                  background: `${challenge.accentColor}15`,
                                  color: challenge.accentColor,
                                  borderColor: `${challenge.accentColor}30`,
                                }}
                              >
                                {challenge.tag}
                              </span>
                              <span className="px-2.5 py-0.5 rounded-full bg-[#D4AF37]/15 text-[#D4AF37] border border-[#D4AF37]/30 text-[11px] font-bold">
                                #ThuThachTuan
                              </span>
                            </div>

                            {/* Submit Button */}
                            <button
                              type="button"
                              onClick={handleSubmit}
                              disabled={loading || (!content.trim() && !selectedFile)}
                              className="w-full py-3 rounded-xl font-black text-xs sm:text-sm uppercase tracking-widest transition-all duration-300 disabled:opacity-30 disabled:cursor-not-allowed hover:shadow-xl hover:scale-[1.01] active:scale-[0.99] cursor-pointer mt-2"
                              style={{
                                background: challenge.accentColor,
                                color: '#000',
                              }}
                            >
                              {loading ? (
                                <span className="flex items-center justify-center gap-2">
                                  <span className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                                  Đang gửi bài...
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
                        initial={{ opacity: 0, x: 15 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -15 }}
                        transition={{ duration: 0.2 }}
                        className="space-y-3"
                      >
                        {/* Leaderboard header */}
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center gap-2">
                            <span className="text-base">🏆</span>
                            <span className="text-white/80 text-xs font-black uppercase tracking-wider">
                              Top Người Chơi Xuất Sắc
                            </span>
                          </div>
                          <span className="text-[10px] text-white/40 font-semibold">
                            Cập nhật theo tuần
                          </span>
                        </div>

                        {/* Leaderboard list */}
                        {challenge.mockLeaderboard.map((user, i) => (
                          <motion.div
                            key={i}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.08 }}
                            className="flex items-center gap-3 bg-[#0D2D1F] p-3 rounded-2xl border border-white/5 hover:border-white/15 transition-all"
                          >
                            {/* Rank */}
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-black text-xs flex-shrink-0 ${
                              i === 0
                                ? 'bg-[#D4AF37]/25 text-[#D4AF37] border border-[#D4AF37]/40'
                                : i === 1
                                  ? 'bg-gray-400/20 text-gray-200 border border-gray-400/30'
                                  : 'bg-amber-700/20 text-amber-500 border border-amber-700/30'
                            }`}>
                              {i === 0 ? '👑' : `#${i + 1}`}
                            </div>

                            {/* Avatar */}
                            <img
                              src={user.avatar}
                              alt={user.name}
                              className="w-9 h-9 rounded-full object-cover flex-shrink-0"
                              style={{ border: `2px solid ${i === 0 ? '#D4AF37' : 'rgba(255,255,255,0.1)'}` }}
                              onError={(e) => { e.target.src = 'https://i.pravatar.cc/150'; }}
                            />

                            {/* Info */}
                            <div className="flex-1 min-w-0">
                              <span className="text-white/90 text-xs font-bold block truncate">
                                {user.name}
                              </span>
                              <span className="text-white/40 text-[10px]">
                                {challenge.tag}
                              </span>
                            </div>

                            {/* Points */}
                            <div className="text-right flex-shrink-0">
                              <span
                                className="font-black text-sm block leading-tight"
                                style={{ color: challenge.accentColor }}
                              >
                                {user.points}
                              </span>
                              <span className="text-[9px] text-white/40">điểm ❤️</span>
                            </div>
                          </motion.div>
                        ))}

                        {/* Your score */}
                        {loggedInUser && (
                          <div
                            className="mt-3 p-3.5 rounded-2xl border border-dashed text-center bg-white/[0.02]"
                            style={{ borderColor: `${challenge.accentColor}40` }}
                          >
                            <p className="text-white/50 text-xs mb-0.5">Điểm thử thách của bạn</p>
                            <p className="font-black text-2xl" style={{ color: challenge.accentColor }}>
                              0
                            </p>
                            <p className="text-white/40 text-[10px] mt-0.5">
                              Đăng bài với hashtag {challenge.tag} để nhận điểm tương tác!
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
        </div>
      )}
    </AnimatePresence>
  );

  return (
    <>
      {SidebarCard}
      {typeof document !== 'undefined' ? createPortal(ChallengeModal, document.body) : null}
    </>
  );
}

