import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, useSearchParams } from 'react-router-dom';
import API_URL from '../config/api';
import ChatDrawer from '../components/ChatDrawer';

const RANK_SYSTEM = [
  { name: 'Tân Binh',      icon: '🌱', min: 0,  max: 5,   color: 'text-gray-400' },
  { name: 'Lữ Khách',    icon: '🎒', min: 5,  max: 15,  color: 'text-blue-400' },
  { name: 'Thợ Săn Ảnh', icon: '📸', min: 15, max: 30,  color: 'text-purple-400' },
  { name: 'Thổ Địa',     icon: '🌟', min: 30, max: 60,  color: 'text-[#D4AF37]' },
  { name: 'Huyền Thoại',  icon: '🏆', min: 60, max: 999, color: 'text-red-400' },
];

function getRank(postCount) {
  return RANK_SYSTEM.find(r => postCount >= r.min && postCount < r.max) || RANK_SYSTEM[0];
}

function getRankProgress(postCount) {
  const rank = getRank(postCount);
  const range = rank.max - rank.min;
  const progress = postCount - rank.min;
  return Math.min(Math.round((progress / range) * 100), 100);
}

const DEFAULT_COVER = 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?q=80&w=1200';
const TABS = ['Bài Viết', 'Đã Lưu', 'Lời Mời', 'Bạn Bè', 'Thống Kê'];

function Profile() {
  const [user, setUser] = useState(null);
  const [posts, setPosts] = useState([]);
  const [savedPosts, setSavedPosts] = useState([]);
  const [activeTab, setActiveTab] = useState('Bài Viết');
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({});
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);
  const [toast, setToast] = useState('');
  const [pendingRequests, setPendingRequests] = useState([]);
  const [friends, setFriends] = useState([]);
  const [pendingCount, setPendingCount] = useState(0);
  const [respondingId, setRespondingId] = useState(null);
  const [chatOpen, setChatOpen] = useState(false);
  const [chatFriendId, setChatFriendId] = useState(null);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const loggedInUser = JSON.parse(localStorage.getItem('user'));

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3000);
  };

  const handleAvatarUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    // validate size
    if (file.size > 5 * 1024 * 1024) { showToast('⚠️ Ảnh phải nhỏ hơn 5MB'); return; }
    setUploadingAvatar(true);
    const fd = new FormData();
    fd.append('avatar', file);
    try {
      const res = await fetch(`${API_URL}/api/upload/avatar/${loggedInUser.id}`, {
        method: 'POST', body: fd,
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      if (data.status === 'success') {
        setUser(u => ({ ...u, avatar_url: data.avatar_url }));
        setFormData(f => ({ ...f, avatar_url: data.avatar_url }));
        const stored = JSON.parse(localStorage.getItem('user'));
        localStorage.setItem('user', JSON.stringify({ ...stored, avatar_url: data.avatar_url }));
        window.dispatchEvent(new Event('storage'));
        showToast('✅ Đã cập nhật ảnh đại diện!');
      } else {
        showToast('❌ ' + (data.message || 'Upload thất bại'));
      }
    } catch (err) {
      console.error('Avatar upload error:', err);
      showToast('❌ Không thể kết nối server. Hãy kiểm tra backend!');
    } finally { setUploadingAvatar(false); e.target.value = ''; }
  };

  const handleCoverUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { showToast('⚠️ Ảnh phải nhỏ hơn 5MB'); return; }
    setUploadingCover(true);
    const fd = new FormData();
    fd.append('cover', file);
    try {
      const res = await fetch(`${API_URL}/api/upload/cover/${loggedInUser.id}`, {
        method: 'POST', body: fd,
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      if (data.status === 'success') {
        setUser(u => ({ ...u, cover_url: data.cover_url }));
        setFormData(f => ({ ...f, cover_url: data.cover_url }));
        const stored = JSON.parse(localStorage.getItem('user'));
        localStorage.setItem('user', JSON.stringify({ ...stored, cover_url: data.cover_url }));
        showToast('✅ Đã cập nhật ảnh bìa!');
      }
    } catch (err) {
      console.error('Cover upload error:', err);
      showToast('❌ Không thể kết nối server!');
    } finally { setUploadingCover(false); e.target.value = ''; }
  };

  useEffect(() => {
    if (!loggedInUser) { navigate('/'); return; }
    // Check URL param for tab
    const tabParam = searchParams.get('tab');
    if (tabParam && TABS.includes(tabParam)) setActiveTab(tabParam);

    fetch(`${API_URL}/api/profile/${loggedInUser.id}`)
      .then(r => r.json()).then(data => { 
        if (!data.error && data.id) {
          setUser(data); setFormData(data); 
        } else {
          showToast('❌ Lỗi tải hồ sơ: ' + (data.message || data.error));
        }
      }).catch(() => showToast('❌ Lỗi kết nối mạng'));
    fetch(`${API_URL}/api/users/${loggedInUser.id}/posts`)
      .then(r => r.json()).then(data => {
        if (Array.isArray(data)) setPosts(data);
      }).catch(() => {});
    fetch(`${API_URL}/api/users/${loggedInUser.id}/saved-posts`)
      .then(r => r.json()).then(data => {
        if (Array.isArray(data)) setSavedPosts(data);
      }).catch(() => {});
    // Fetch connections data
    fetchPendingRequests();
    fetchFriends();
  }, []);

  const fetchPendingRequests = async () => {
    try {
      const res = await fetch(`${API_URL}/api/connections/pending`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token') || ''}` }
      });
      const data = await res.json();
      if (data.status === 'success') {
        setPendingRequests(data.data);
        setPendingCount(data.data.length);
      }
    } catch (e) { console.error(e); }
  };

  const fetchFriends = async () => {
    try {
      const res = await fetch(`${API_URL}/api/connections/friends`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token') || ''}` }
      });
      const data = await res.json();
      if (data.status === 'success') setFriends(data.data);
    } catch (e) { console.error(e); }
  };

  const handleRespondConnection = async (connectionId, action) => {
    setRespondingId(connectionId);
    try {
      const res = await fetch(`${API_URL}/api/connections/respond`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token') || ''}`
        },
        body: JSON.stringify({ connection_id: connectionId, action })
      });
      const data = await res.json();
      if (data.status === 'success') {
        showToast(action === 'accept' ? '✅ Đã chấp nhận kết nối!' : '❌ Đã từ chối lời mời.');
        fetchPendingRequests();
        if (action === 'accept') fetchFriends();
      } else {
        showToast('❌ ' + (data.message || 'Lỗi'));
      }
    } catch (e) {
      console.error(e);
      showToast('❌ Lỗi kết nối máy chủ');
    } finally {
      setRespondingId(null);
    }
  };

  function timeAgo(dateStr) {
    if (!dateStr) return '';
    const utcDateStr = dateStr.endsWith('Z') ? dateStr : dateStr.replace(' ', 'T') + 'Z';
    const diff = Math.floor((Date.now() - new Date(utcDateStr)) / 1000);
    if (diff < 0) return 'Vừa xong';
    if (diff < 60) return `${diff} giây trước`;
    if (diff < 3600) return `${Math.floor(diff / 60)} phút trước`;
    if (diff < 86400) return `${Math.floor(diff / 3600)} giờ trước`;
    return `${Math.floor(diff / 86400)} ngày trước`;
  }

  const handleUpdate = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch(`${API_URL}/api/profile/${user.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      if (data.status === 'success') {
        setUser({ ...user, ...data.user });
        setIsEditing(false);
        localStorage.setItem('user', JSON.stringify(data.user));
        window.dispatchEvent(new Event('storage'));
      }
    } catch (err) { console.error(err); }
    finally { setSaving(false); }
  };

  if (!user) return (
    <div className="min-h-screen bg-[#0A241A] flex items-center justify-center">
      <div className="text-[#D4AF37] font-black text-lg animate-pulse">Đang tải hồ sơ...</div>
    </div>
  );

  const rank = getRank(user.post_count || 0);
  const nextRank = RANK_SYSTEM[RANK_SYSTEM.indexOf(rank) + 1];
  const progress = getRankProgress(user.post_count || 0);
  const totalLikes = Array.isArray(posts) ? posts.reduce((s, p) => s + (p.likes || 0), 0) : 0;

  return (
    <>
    <div className="min-h-screen bg-[#0A241A] pb-20">
      {/* Toast notification */}
      {toast && (
        <div className="fixed top-24 left-1/2 -translate-x-1/2 z-[9999] bg-[#0D2D1F] border border-[#D4AF37]/40 text-white text-sm font-bold px-6 py-3 rounded-full shadow-2xl animate-in fade-in slide-in-from-top-2 duration-300">
          {toast}
        </div>
      )}

      {/* ===== COVER + AVATAR HEADER ===== */}
      <div className="relative">
        {/* Cover Photo */}
        <div className="h-56 md:h-72 overflow-hidden relative group">
          <img
            src={user.cover_url?.startsWith('/') ? `${API_URL}${user.cover_url}` : (user.cover_url || DEFAULT_COVER)}
            alt="cover"
            className="w-full h-full object-cover"
            onError={(e) => { e.target.src = DEFAULT_COVER; }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0A241A] via-[#0A241A]/30 to-transparent" />
          {/* Change cover button — always visible */}
          <label className={`absolute bottom-4 right-4 backdrop-blur-md text-white text-xs font-bold px-4 py-2 rounded-full cursor-pointer border border-white/20 hover:bg-black/80 transition-all flex items-center gap-2 ${
            uploadingCover ? 'bg-black/80' : 'bg-black/50'
          }`}>
            {uploadingCover ? '⏳ Đang tải...' : '🖼️ Đổi ảnh bìa'}
            <input type="file" accept="image/*" className="hidden" onChange={handleCoverUpload} disabled={uploadingCover} />
          </label>
        </div>

        {/* Avatar + Info */}
        <div className="max-w-4xl mx-auto px-5 relative">
          <div className="flex flex-col md:flex-row items-start md:items-end gap-5 -mt-16 relative z-10">
        {/* Avatar với nút upload */}
            <div className="relative flex-shrink-0 group">
              <img
                src={user.avatar_url?.startsWith('/') ? `${API_URL}${user.avatar_url}` : (user.avatar_url || 'https://i.pravatar.cc/150')}
                alt="avatar"
                className="w-28 h-28 md:w-36 md:h-36 rounded-full border-4 border-[#0A241A] object-cover shadow-2xl"
                onError={(e) => { e.target.src = 'https://i.pravatar.cc/150'; }}
              />
              {/* Upload overlay */}
              <label className={`absolute inset-0 rounded-full flex items-center justify-center cursor-pointer transition-all duration-300 ${
                uploadingAvatar ? 'bg-black/70' : 'bg-black/0 group-hover:bg-black/50'
              }`}>
                {uploadingAvatar ? (
                  <span className="text-white text-xs font-bold animate-pulse">⏳</span>
                ) : (
                  <span className="text-white text-xs font-bold opacity-0 group-hover:opacity-100 transition-opacity text-center leading-tight">
                    📷<br/>Đổi ảnh
                  </span>
                )}
                <input type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} disabled={uploadingAvatar} />
              </label>
              <div className="absolute -bottom-1 -right-1 w-8 h-8 bg-green-500 rounded-full border-2 border-[#0A241A] flex items-center justify-center text-xs">
                ✓
              </div>
            </div>

            {/* Info */}
            <div className="flex-1 pb-2">
              <div className="flex flex-col md:flex-row md:items-end justify-between gap-3">
                <div>
                  <h1 className="text-3xl font-heading font-bold text-white leading-tight">{user.full_name}</h1>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={`text-xs font-black uppercase tracking-widest ${rank.color}`}>{rank.icon} {rank.name}</span>
                    {nextRank && (
                      <span className="text-white/25 text-[10px]">→ {nextRank.icon} {nextRank.name}</span>
                    )}
                  </div>
                  {/* Rank Progress Bar */}
                  <div className="flex items-center gap-3 mt-2">
                    <div className="w-36 h-1.5 bg-white/10 rounded-full overflow-hidden">
                      <div className={`h-full rounded-full transition-all duration-700 ${
                        rank.name === 'Tân Binh' ? 'bg-gray-400' :
                        rank.name === 'Lữ Khách' ? 'bg-blue-400' :
                        rank.name === 'Thợ Săn Ảnh' ? 'bg-purple-400' :
                        rank.name === 'Thổ Địa' ? 'bg-[#D4AF37]' : 'bg-red-400'
                      }`} style={{ width: `${progress}%` }} />
                    </div>
                    <span className="text-white/30 text-[10px]">
                      {nextRank
                        ? `Cần ${nextRank.min - (user.post_count || 0)} bài → ${nextRank.name}`
                        : '🏆 Đạt cấp tối thượng!'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 mt-2 text-white/50 text-xs">
                    <span>📍 {user.location}</span>
                    <span>·</span>
                    <span>Tham gia {new Date(user.created_at).getFullYear()}</span>
                  </div>
                </div>

                {/* Edit button */}
                <button
                  onClick={() => setIsEditing(!isEditing)}
                  className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-xs font-bold uppercase tracking-wider border transition-all ${
                    isEditing
                      ? 'border-red-400/50 text-red-400 hover:bg-red-400/10'
                      : 'border-white/20 text-white/70 hover:border-[#D4AF37] hover:text-[#D4AF37]'
                  }`}
                >
                  {isEditing ? '✕ Hủy' : '✏️ Chỉnh sửa'}
                </button>
              </div>
            </div>
          </div>

          {/* Stats Row */}
          <div className="grid grid-cols-3 gap-4 mt-6 mb-6">
            {[
              { label: 'Bài viết', value: user.post_count || posts.length, icon: '📝' },
              { label: 'Đã lưu', value: savedPosts.length, icon: '🔖' },
              { label: 'Lượt thích', value: totalLikes >= 1000 ? `${(totalLikes/1000).toFixed(1)}k` : totalLikes, icon: '❤️' },
            ].map((stat, i) => (
              <div key={i} className="bg-[#0D2D1F] rounded-2xl p-4 text-center border border-white/5">
                <div className="text-xl mb-1">{stat.icon}</div>
                <div className="text-[#D4AF37] text-2xl font-black">{stat.value}</div>
                <div className="text-white/40 text-xs mt-0.5">{stat.label}</div>
              </div>
            ))}
          </div>

          {/* Bio Card */}
          {!isEditing && (
            <div className="bg-[#0D2D1F] rounded-2xl p-6 border border-white/5 mb-6 relative overflow-hidden">
              <span className="absolute top-3 left-3 text-6xl text-white/5 font-serif leading-none select-none">"</span>
              <h3 className="text-[#D4AF37] text-[10px] font-black uppercase tracking-widest mb-3 flex items-center gap-2">
                <span className="w-4 h-[2px] bg-[#D4AF37] rounded" /> Giới Thiệu Bản Thân
              </h3>
              <p className="text-white/70 text-sm leading-relaxed italic pl-4">{user.bio}</p>
            </div>
          )}

          {/* Edit Form */}
          <AnimatePresence>
            {isEditing && (
              <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                className="bg-[#0D2D1F] rounded-2xl p-7 border border-[#D4AF37]/20 mb-6"
              >
                <h3 className="text-[#D4AF37] text-xs font-black uppercase tracking-widest mb-6">✏️ Cập Nhật Hồ Sơ</h3>
                <form onSubmit={handleUpdate} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {[
                      { label: 'Họ và tên', key: 'full_name', type: 'text' },
                      { label: 'Vị trí / thành phố', key: 'location', type: 'text' },
                      { label: 'URL Ảnh đại diện', key: 'avatar_url', type: 'text' },
                      { label: 'URL Ảnh bìa', key: 'cover_url', type: 'text' },
                    ].map(field => (
                      <div key={field.key} className={field.key === 'avatar_url' || field.key === 'cover_url' ? 'md:col-span-2' : ''}>
                        <label className="text-white/40 text-[10px] font-bold uppercase tracking-widest block mb-1.5">{field.label}</label>
                        <input
                          type={field.type}
                          value={formData[field.key] || ''}
                          onChange={e => setFormData({ ...formData, [field.key]: e.target.value })}
                          className="w-full bg-[#112418] text-white px-4 py-3 rounded-xl outline-none border border-white/10 focus:border-[#D4AF37]/50 text-sm transition-all"
                        />
                      </div>
                    ))}
                    <div className="md:col-span-2">
                      <label className="text-white/40 text-[10px] font-bold uppercase tracking-widest block mb-1.5">Giới thiệu bản thân</label>
                      <textarea
                        rows={3}
                        value={formData.bio || ''}
                        onChange={e => setFormData({ ...formData, bio: e.target.value })}
                        className="w-full bg-[#112418] text-white px-4 py-3 rounded-xl outline-none border border-white/10 focus:border-[#D4AF37]/50 text-sm resize-none transition-all"
                      />
                    </div>
                  </div>
                  <button type="submit" disabled={saving}
                    className="w-full bg-[#D4AF37] text-black font-black py-3.5 rounded-xl uppercase tracking-widest text-sm hover:bg-white transition-all disabled:opacity-50"
                  >
                    {saving ? '⏳ Đang lưu...' : '✓ Lưu Thay Đổi'}
                  </button>
                </form>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Tabs */}
          <div className="flex gap-1 bg-[#0D2D1F] p-1 rounded-xl border border-white/5 mb-6 overflow-x-auto">
            {TABS.map(tab => (
              <button key={tab} onClick={() => setActiveTab(tab)}
                className={`relative flex-1 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all whitespace-nowrap px-3 ${
                  activeTab === tab ? 'bg-[#D4AF37] text-black' : 'text-white/40 hover:text-white'
                }`}
              >
                {tab}
                {tab === 'Lời Mời' && pendingCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-[10px] font-black rounded-full flex items-center justify-center shadow-lg animate-pulse">
                    {pendingCount}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          <AnimatePresence mode="wait">
            <motion.div key={activeTab} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }}>

              {/* BÀI VIẾT */}
              {activeTab === 'Bài Viết' && (
                <div className="space-y-4">
                  {posts.length === 0 ? (
                    <div className="text-center py-16 text-white/30">
                      <div className="text-4xl mb-3">📝</div>
                      <p>Chưa có bài viết nào. Hãy chia sẻ chuyến đi đầu tiên!</p>
                    </div>
                  ) : posts.map(post => (
                    <div key={post.id} className="bg-[#0D2D1F] rounded-2xl p-5 border border-white/5 hover:border-white/10 transition-all">
                      {post.image_url && (
                        <div className="h-48 rounded-xl overflow-hidden mb-4">
                          <img src={post.image_url?.startsWith('/') ? `${API_URL}${post.image_url}` : post.image_url} alt="post" className="w-full h-full object-cover" onError={(e) => { e.target.style.display='none'; }} />
                        </div>
                      )}
                      <p className="text-white/80 text-sm leading-relaxed">{post.content}</p>
                      <div className="flex items-center gap-4 mt-3 pt-3 border-t border-white/5 text-xs text-white/30">
                        {post.location && <span>📍 {post.location}</span>}
                        <span>❤️ {post.likes || 0}</span>
                        <span className="ml-auto">{new Date(post.created_at).toLocaleDateString('vi-VN')}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* ĐÃ LƯU */}
              {activeTab === 'Đã Lưu' && (
                <div className="space-y-4">
                  {savedPosts.length === 0 ? (
                    <div className="text-center py-16 text-white/30">
                      <div className="text-4xl mb-3">🔖</div>
                      <p>Chưa có bài viết nào được lưu.</p>
                    </div>
                  ) : savedPosts.map(post => (
                    <div key={post.id} className="bg-[#0D2D1F] rounded-2xl p-5 border border-white/5 flex gap-4">
                      {post.image_url && (
                        <div className="w-20 h-20 rounded-xl overflow-hidden flex-shrink-0">
                          <img src={post.image_url?.startsWith('/') ? `${API_URL}${post.image_url}` : post.image_url} alt="post" className="w-full h-full object-cover" onError={(e) => { e.target.style.display='none'; }} />
                        </div>
                      )}
                      <div>
                        <p className="text-[#D4AF37] text-xs font-bold mb-1">✍️ {post.user_name}</p>
                        <p className="text-white/70 text-sm line-clamp-2">{post.content}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* THỐNG KÊ */}
              {activeTab === 'Thống Kê' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    {[
                      { label: 'Tổng bài viết', value: user.post_count || posts.length, icon: '📝', color: 'text-blue-400' },
                      { label: 'Tổng lượt thích', value: totalLikes, icon: '❤️', color: 'text-red-400' },
                      { label: 'Bài đã lưu', value: savedPosts.length, icon: '🔖', color: 'text-[#D4AF37]' },
                      { label: 'Bạn bè', value: friends.length, icon: '🤝', color: 'text-green-400' },
                    ].map((s, i) => (
                      <div key={i} className="bg-[#0D2D1F] rounded-2xl p-6 border border-white/5">
                        <div className="text-2xl mb-2">{s.icon}</div>
                        <div className={`text-2xl font-black ${s.color}`}>{s.value}</div>
                        <div className="text-white/40 text-xs mt-1">{s.label}</div>
                      </div>
                    ))}
                  </div>
                  {/* Rank road map */}
                  <div className="bg-[#0D2D1F] rounded-2xl p-6 border border-white/5">
                    <h4 className="text-white/60 text-xs font-black uppercase tracking-widest mb-4">Lộ trình thăng hạng</h4>
                    <div className="space-y-3">
                      {RANK_SYSTEM.map((r, i) => {
                        const isActive = r.name === rank.name;
                        const isDone = RANK_SYSTEM.indexOf(rank) > i;
                        return (
                          <div key={i} className={`flex items-center gap-3 p-3 rounded-xl transition-all ${isActive ? 'bg-[#D4AF37]/10 border border-[#D4AF37]/30' : 'opacity-50'}`}>
                            <span className="text-lg">{r.icon}</span>
                            <div className="flex-1">
                              <p className={`text-xs font-bold ${isActive ? 'text-[#D4AF37]' : 'text-white/50'}`}>{r.name}</p>
                              <p className="text-white/30 text-[10px]">{r.min}–{r.max === 999 ? '∞' : r.max} bài viết</p>
                            </div>
                            {isDone && <span className="text-green-400 text-xs font-black">✓ Đạt</span>}
                            {isActive && <span className="text-[#D4AF37] text-xs font-black">● Hiện tại</span>}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              {/* LỜI MỜI KẾT NỐI */}
              {activeTab === 'Lời Mời' && (
                <div className="space-y-4">
                  {pendingRequests.length === 0 ? (
                    <div className="text-center py-16 text-white/30">
                      <div className="text-4xl mb-3">🔔</div>
                      <p>Không có lời mời kết nối nào.</p>
                      <p className="text-xs mt-1">Khi ai đó gửi lời mời từ bản đồ, bạn sẽ thấy ở đây!</p>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="text-white/60 text-xs font-black uppercase tracking-widest">
                          🔔 {pendingRequests.length} lời mời đang chờ
                        </h3>
                      </div>
                      {pendingRequests.map(req => (
                        <motion.div
                          key={req.connection_id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          className="bg-[#0D2D1F] rounded-2xl p-5 border border-[#D4AF37]/20 hover:border-[#D4AF37]/40 transition-all"
                        >
                          <div className="flex items-center gap-4">
                            <div className="relative">
                              <img
                                src={req.avatar_url?.startsWith('/') ? `${API_URL}${req.avatar_url}` : (req.avatar_url || 'https://i.pravatar.cc/150')}
                                alt="ava"
                                className="w-14 h-14 rounded-full object-cover border-2 border-[#D4AF37]/30"
                                onError={(e) => { e.target.src = 'https://i.pravatar.cc/150'; }}
                              />
                              <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-[#D4AF37] rounded-full flex items-center justify-center text-[8px]">🤝</div>
                            </div>
                            <div className="flex-1 min-w-0">
                              <h4 className="font-bold text-[#F5F2EB] text-sm truncate">{req.full_name}</h4>
                              <div className="flex items-center gap-2 text-[10px] text-white/40 mt-0.5">
                                {req.location && <span>📍 {req.location}</span>}
                                <span>· {timeAgo(req.created_at)}</span>
                              </div>
                              {req.map_status && (
                                <p className="text-xs text-white/50 mt-1 italic truncate">"{req.map_status}"</p>
                              )}
                            </div>
                          </div>
                          <div className="flex gap-2 mt-4">
                            <button
                              onClick={() => handleRespondConnection(req.connection_id, 'accept')}
                              disabled={respondingId === req.connection_id}
                              className="flex-1 bg-gradient-to-r from-[#D4AF37] to-[#F5D76E] text-black py-2.5 rounded-xl text-xs font-black uppercase tracking-widest hover:shadow-lg hover:shadow-[#D4AF37]/20 disabled:opacity-50 transition-all flex items-center justify-center gap-1.5"
                            >
                              {respondingId === req.connection_id ? <span className="animate-pulse">⏳</span> : '✅'} Chấp nhận
                            </button>
                            <button
                              onClick={() => handleRespondConnection(req.connection_id, 'reject')}
                              disabled={respondingId === req.connection_id}
                              className="flex-1 py-2.5 rounded-xl text-xs font-bold border border-white/15 text-white/50 hover:bg-red-500/10 hover:text-red-400 hover:border-red-500/30 disabled:opacity-50 transition-all flex items-center justify-center gap-1.5"
                            >
                              ❌ Từ chối
                            </button>
                          </div>
                        </motion.div>
                      ))}
                    </>
                  )}
                </div>
              )}

              {/* BẠN BÈ */}
              {activeTab === 'Bạn Bè' && (
                <div className="space-y-4">
                  {friends.length === 0 ? (
                    <div className="text-center py-16 text-white/30">
                      <div className="text-4xl mb-3">🤝</div>
                      <p>Chưa có bạn bè nào.</p>
                      <p className="text-xs mt-1">Hãy ghim vị trí trên bản đồ để kết nối với phượt thủ khác!</p>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="text-white/60 text-xs font-black uppercase tracking-widest">
                          🤝 {friends.length} bạn bè
                        </h3>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {friends.map((friend, i) => (
                          <motion.div
                            key={i}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.05 }}
                            className="bg-[#0D2D1F] rounded-2xl p-4 border border-white/5 hover:border-green-500/20 transition-all group"
                          >
                            <div className="flex items-center gap-3">
                              <div className="relative">
                                <img
                                  src={friend.avatar_url?.startsWith('/') ? `${API_URL}${friend.avatar_url}` : (friend.avatar_url || 'https://i.pravatar.cc/150')}
                                  alt="ava"
                                  className="w-12 h-12 rounded-full object-cover border-2 border-green-500/30 group-hover:border-green-500/60 transition-colors"
                                  onError={(e) => { e.target.src = 'https://i.pravatar.cc/150'; }}
                                />
                                <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-green-500 rounded-full border-2 border-[#0D2D1F]"></div>
                              </div>
                              <div className="flex-1 min-w-0">
                                <h4 className="font-bold text-[#F5F2EB] text-sm truncate group-hover:text-[#D4AF37] transition-colors">{friend.full_name}</h4>
                                <div className="flex items-center gap-1.5 text-[10px] text-white/30 mt-0.5">
                                  {friend.location && <span>📍 {friend.location}</span>}
                                  {friend.title && <span className="text-[#D4AF37]/60">· {friend.title}</span>}
                                </div>
                                {friend.map_status && (
                                  <p className="text-[10px] text-white/40 mt-1 italic truncate">"{friend.map_status}"</p>
                                )}
                              </div>
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() => { setChatFriendId(friend.friend_id); setChatOpen(true); }}
                                  className="text-[#D4AF37] text-[10px] font-bold bg-[#D4AF37]/10 hover:bg-[#D4AF37]/20 px-3 py-1.5 rounded-full transition-all flex items-center gap-1 hover:shadow-lg hover:shadow-[#D4AF37]/10"
                                >
                                  💬 Nhắn tin
                                </button>
                                <span className="text-green-400 text-[9px] font-bold bg-green-500/10 px-2 py-0.5 rounded-full">✓ Bạn bè</span>
                              </div>
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>

    {/* Chat Drawer */}
    <ChatDrawer
      isOpen={chatOpen}
      onClose={() => { setChatOpen(false); setChatFriendId(null); }}
      initialFriendId={chatFriendId}
    />
  </>
  );
}

export default Profile;