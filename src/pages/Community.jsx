import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import API_URL from '../config/api';
import CommunityMap from '../components/CommunityMap';

// No mock posts anymore

const TOP_USERS = [
  { name: 'Phượt Thủ 9x', ava: 'https://i.pravatar.cc/150?img=11', followers: '5.2k', badge: '🌟 Thổ Địa' },
  { name: 'Yêu Bếp & Đi', ava: 'https://i.pravatar.cc/150?img=5', followers: '4.8k', badge: '🍜 Food Expert' },
  { name: 'Lang Thang VN', ava: 'https://i.pravatar.cc/150?img=33', followers: '3.1k', badge: '📸 Nhiếp Ảnh' },
  { name: 'Cây Bút Vàng', ava: 'https://i.pravatar.cc/150?img=15', followers: '2.7k', badge: '✍️ Cây Bút' },
];

const TRENDING_TAGS = [
  { tag: '#SapaMuaLua', posts: 1000 },
  { tag: '#HoiAnByNight', posts: 877 },
  { tag: '#FoodTourHanoi', posts: 754 },
  { tag: '#BienDaNang', posts: 631 },
  { tag: '#CheckinPhuQuoc', posts: 508 },
];

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

function PostCard({ post, onRefresh }) {
  const [liked, setLiked] = useState(!!post.has_liked);
  const [saved, setSaved] = useState(false);
  const [likeCount, setLikeCount] = useState(post.likes || 0);
  const [imgError, setImgError] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [loadingComments, setLoadingComments] = useState(false);
  
  // New states for Edit/Delete
  const [showMenu, setShowMenu] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(post.content);
  const [editLocation, setEditLocation] = useState(post.location || '');
  const [isUpdating, setIsUpdating] = useState(false);

  let loggedInUser = null;
  try {
    const userData = localStorage.getItem('user');
    if (userData) loggedInUser = JSON.parse(userData);
  } catch (err) {
    console.error('Lỗi khi đọc dữ liệu người dùng:', err);
  }
  const FALLBACK = 'https://images.unsplash.com/photo-1524661135-423995f22d0b?q=80&w=800';

  const handleLike = async () => {
    if (!loggedInUser) return;
    try {
      const res = await fetch(`${API_URL}/api/posts/${post.id}/like`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: loggedInUser.id })
      });
      const data = await res.json();
      if (data.status === 'success') {
        setLiked(data.liked);
        setLikeCount((c) => data.liked ? c + 1 : Math.max(0, c - 1));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleToggleComments = () => {
    if (!showComments) {
      fetchComments();
    }
    setShowComments(!showComments);
  };

  const fetchComments = async () => {
    setLoadingComments(true);
    try {
      const res = await fetch(`${API_URL}/api/posts/${post.id}/comments`);
      const data = await res.json();
      setComments(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingComments(false);
    }
  };

  const handlePostComment = async () => {
    if (!loggedInUser || !newComment.trim()) return;
    try {
      const res = await fetch(`${API_URL}/api/posts/${post.id}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: loggedInUser.id, content: newComment })
      });
      const data = await res.json();
      if (data.status === 'success') {
        setComments([...comments, data.data]);
        setNewComment('');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa bài viết này?')) return;
    try {
      const res = await fetch(`${API_URL}/api/posts/${post.id}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: loggedInUser.id })
      });
      const data = await res.json();
      if (data.status === 'success') {
        onRefresh();
      } else {
        alert(data.message || 'Lỗi khi xóa bài');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleUpdate = async () => {
    if (!editContent.trim()) return;
    setIsUpdating(true);
    try {
      const res = await fetch(`${API_URL}/api/posts/${post.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          user_id: loggedInUser.id, 
          content: editContent, 
          location: editLocation,
          image_url: post.image_url 
        })
      });
      const data = await res.json();
      if (data.status === 'success') {
        setIsEditing(false);
        onRefresh();
      } else {
        alert(data.message || 'Lỗi khi cập nhật bài');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsUpdating(false);
    }
  };

  const isOwner = loggedInUser && loggedInUser.id === post.user_id;

  return (
    <motion.article
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5 }}
      className="bg-[#0D2D1F] rounded-[1.5rem] border border-white/5 overflow-hidden hover:border-white/10 transition-all duration-300"
    >
      {/* Post header */}
      <div className="p-5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <img
            src={post.avatar_url?.startsWith('/') ? `${API_URL}${post.avatar_url}` : (post.avatar_url || 'https://i.pravatar.cc/150')}
            alt="avatar"
            className="w-11 h-11 rounded-full object-cover border-2 border-[#D4AF37]/30"
            onError={(e) => { e.target.src = 'https://i.pravatar.cc/150'; }}
          />
          <div>
            <h5 className="font-bold text-[#F5F2EB] text-sm hover:text-[#D4AF37] cursor-pointer transition-colors">{post.user_name}</h5>
            <div className="flex items-center gap-1.5 text-xs text-white/40 mt-0.5">
              {post.location && <><span className="text-[#D4AF37]">📍</span><span>{post.location}</span><span>·</span></>}
              <span>{timeAgo(post.created_at)}</span>
            </div>
          </div>
        </div>
        
        {/* Three dots menu */}
        <div className="relative">
          <button 
            onClick={() => setShowMenu(!showMenu)}
            className="text-white/30 hover:text-white transition-colors text-xl leading-none px-2"
          >
            ···
          </button>
          
          <AnimatePresence>
            {showMenu && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setShowMenu(false)} />
                <motion.div
                  initial={{ opacity: 0, scale: 0.9, y: -10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9, y: -10 }}
                  className="absolute right-0 mt-2 w-40 bg-[#112418] border border-white/10 rounded-xl shadow-2xl z-50 overflow-hidden"
                >
                  {isOwner ? (
                    <>
                      <button 
                        onClick={() => { setIsEditing(true); setShowMenu(false); }}
                        className="w-full text-left px-4 py-3 text-xs text-white/70 hover:bg-white/5 hover:text-[#D4AF37] transition-all flex items-center gap-2"
                      >
                        ✏️ Chỉnh sửa
                      </button>
                      <button 
                        onClick={() => { handleDelete(); setShowMenu(false); }}
                        className="w-full text-left px-4 py-3 text-xs text-red-400 hover:bg-red-500/10 transition-all flex items-center gap-2"
                      >
                        🗑️ Xóa bài
                      </button>
                    </>
                  ) : (
                    <>
                      <button className="w-full text-left px-4 py-3 text-xs text-white/70 hover:bg-white/5 transition-all flex items-center gap-2">
                        🚩 Báo cáo
                      </button>
                      <button className="w-full text-left px-4 py-3 text-xs text-white/70 hover:bg-white/5 transition-all flex items-center gap-2">
                        🚫 Ẩn bài viết
                      </button>
                    </>
                  )}
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Content / Edit Mode */}
      <div className="px-5 pb-4">
        {isEditing ? (
          <div className="space-y-3">
            <textarea
              className="w-full bg-[#112418] text-white text-sm p-3 rounded-xl border border-[#D4AF37]/30 outline-none focus:ring-1 focus:ring-[#D4AF37] min-h-[100px]"
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              autoFocus
            />
            <div className="flex items-center gap-2">
              <span className="text-[#D4AF37] text-sm">📍</span>
              <input
                type="text"
                className="flex-1 bg-transparent text-white/60 text-xs outline-none border-b border-white/10 pb-1"
                placeholder="Vị trí..."
                value={editLocation}
                onChange={(e) => setEditLocation(e.target.value)}
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button 
                onClick={() => { setIsEditing(false); setEditContent(post.content); setEditLocation(post.location || ''); }}
                className="px-4 py-1.5 rounded-full text-xs font-bold text-white/40 hover:text-white transition-all"
              >
                Hủy
              </button>
              <button 
                onClick={handleUpdate}
                disabled={isUpdating || !editContent.trim()}
                className="bg-[#D4AF37] text-black px-5 py-1.5 rounded-full text-xs font-black uppercase tracking-widest hover:bg-white disabled:opacity-30 transition-all"
              >
                {isUpdating ? '...' : 'Lưu'}
              </button>
            </div>
          </div>
        ) : (
          <p className="text-white/75 text-sm leading-relaxed">{post.content}</p>
        )}
      </div>

      {/* Image */}
      {post.image_url && !isEditing && (
        <div className="w-full aspect-[4/3] overflow-hidden bg-[#112418] relative">
          <img
            src={imgError ? FALLBACK : (post.image_url?.startsWith('/') ? `${API_URL}${post.image_url}` : post.image_url)}
            alt="post"
            className="w-full h-full object-cover"
            onError={() => setImgError(true)}
          />
        </div>
      )}

      {/* Actions */}
      <div className="px-5 py-4 flex items-center gap-1 border-t border-white/5">
        <button
          onClick={handleLike}
          className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold transition-all ${liked ? 'bg-red-500/20 text-red-400' : 'text-white/40 hover:bg-white/5 hover:text-white/70'}`}
        >
          <span className="text-base">{liked ? '❤️' : '🤍'}</span> {likeCount}
        </button>
        <button 
          onClick={handleToggleComments}
          className="flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold text-white/40 hover:bg-white/5 hover:text-white/70 transition-all"
        >
          <span className="text-base">💬</span> {comments.length || post.comment_count || 0}
        </button>
        <button className="flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold text-white/40 hover:bg-white/5 hover:text-white/70 transition-all">
          <span className="text-base">📤</span>
        </button>
        <button
          onClick={() => setSaved(!saved)}
          className={`ml-auto flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold transition-all ${saved ? 'bg-[#D4AF37]/20 text-[#D4AF37]' : 'text-white/40 hover:bg-white/5 hover:text-white/70'}`}
        >
          <span className="text-base">{saved ? '🔖' : '🏷️'}</span> {saved ? 'Đã lưu' : 'Lưu'}
        </button>
      </div>

      {/* Comments Section */}
      {showComments && (
        <div className="px-5 py-4 border-t border-white/5 bg-black/20">
          <div className="space-y-4 mb-4 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
            {loadingComments ? (
              <p className="text-white/40 text-xs text-center">Đang tải bình luận...</p>
            ) : comments.length === 0 ? (
              <p className="text-white/40 text-xs text-center">Chưa có bình luận nào. Hãy là người đầu tiên!</p>
            ) : (
              comments.map((comment, idx) => (
                <div key={idx} className="flex gap-3">
                  <img src={comment.avatar_url || 'https://i.pravatar.cc/150'} alt="ava" className="w-8 h-8 rounded-full object-cover" onError={(e) => e.target.src='https://i.pravatar.cc/150'} />
                  <div className="flex-1 bg-[#112418] rounded-2xl rounded-tl-none p-3 border border-white/5">
                    <h6 className="font-bold text-[#F5F2EB] text-xs mb-1">{comment.user_name}</h6>
                    <p className="text-white/70 text-xs">{comment.content}</p>
                  </div>
                </div>
              ))
            )}
          </div>
          
          {loggedInUser ? (
            <div className="flex gap-3 items-center">
              <img src={loggedInUser.avatar_url || 'https://i.pravatar.cc/150'} alt="ava" className="w-8 h-8 rounded-full object-cover" />
              <div className="flex-1 relative">
                <input
                  type="text"
                  placeholder="Viết bình luận..."
                  className="w-full bg-[#112418] text-white text-xs placeholder-white/30 px-4 py-2.5 rounded-full border border-white/10 outline-none focus:border-[#D4AF37]/50 transition-colors pr-12"
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handlePostComment()}
                />
                <button
                  onClick={handlePostComment}
                  disabled={!newComment.trim()}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-[#D4AF37] disabled:opacity-30 hover:text-white transition-colors"
                >
                  ➤
                </button>
              </div>
            </div>
          ) : (
            <p className="text-xs text-white/40 text-center italic">Vui lòng đăng nhập để bình luận</p>
          )}
        </div>
      )}
    </motion.article>
  );
}

// ============================================================
function Community() {
  const [activeTab, setActiveTab] = useState('feed');
  const [posts, setPosts] = useState([]);
  const [newPostContent, setNewPostContent] = useState('');
  const [newPostLocation, setNewPostLocation] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const fileInputRef = React.useRef(null);
  let loggedInUser = null;
  try {
    const userData = localStorage.getItem('user');
    if (userData) loggedInUser = JSON.parse(userData);
  } catch (err) {
    console.error('Lỗi khi đọc dữ liệu người dùng:', err);
  }
  const navigate = useNavigate();

  // Notification bell: pending connection count
  const [pendingCount, setPendingCount] = useState(0);

  const fetchPosts = async () => {
    try {
      const url = loggedInUser 
        ? `${API_URL}/api/posts?user_id=${loggedInUser.id}`
        : `${API_URL}/api/posts`;
      const res = await fetch(url);
      const data = await res.json();
      if (data && data.length > 0) setPosts(data);
      else setPosts([]);
    } catch { setPosts([]); }
  };

  const fetchPendingCount = async () => {
    if (!loggedInUser) return;
    try {
      const res = await fetch(`${API_URL}/api/connections/pending/count`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token') || ''}` }
      });
      const data = await res.json();
      if (data.status === 'success') setPendingCount(data.count || 0);
    } catch (e) { console.error(e); }
  };

  useEffect(() => { fetchPosts(); fetchPendingCount(); }, []);

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handlePost = async () => {
    if (!loggedInUser) { navigate('/suggestions'); return; }
    if (!newPostContent.trim() && !selectedFile) return;
    setLoading(true);
    let finalImageUrl = '';

    try {
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

      const res = await fetch(`${API_URL}/api/posts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: loggedInUser.id, content: newPostContent, location: newPostLocation, image_url: finalImageUrl }),
      });
      const data = await res.json();
      if (data.status === 'success') { 
        setNewPostContent(''); 
        setNewPostLocation(''); 
        setSelectedFile(null);
        setPreviewUrl('');
        fetchPosts(); 
      } else {
        alert('Lỗi đăng bài: ' + (data.message || 'Không xác định'));
      }
    } catch (err) { 
      console.error('Post Error:', err);
      alert('Không thể kết nối đến server để đăng bài.');
    } finally { setLoading(false); }

  };

  return (
    <div className="bg-[#0A241A] min-h-screen pt-24 pb-10 font-sans">
      <div className="max-w-[1200px] mx-auto px-5 grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">

        {/* ===== CỘT TRÁI ===== */}
        <aside className="hidden lg:flex flex-col gap-5 lg:col-span-1 sticky top-24 h-fit">
          {/* Trending */}
          <div className="bg-[#0D2D1F] p-6 rounded-[1.5rem] border border-white/5">
            <h4 className="font-black uppercase tracking-widest text-[10px] text-[#D4AF37] mb-4 flex items-center gap-2">
              🔥 Đang Thịnh Hành
            </h4>
            <ul className="space-y-4">
              {TRENDING_TAGS.map((item, i) => (
                <li key={i} className="group cursor-pointer">
                  <span className="font-bold text-sm text-[#F5F2EB] group-hover:text-[#D4AF37] transition-colors block leading-tight">{item.tag}</span>
                  <span className="text-xs text-white/30 flex items-center gap-1 mt-0.5">
                    <span className="text-[#D4AF37]">📈</span> {item.posts} bài viết
                  </span>
                </li>
              ))}
            </ul>
          </div>

          {/* Weekly Challenge */}
          <div
            className="relative p-6 rounded-[1.5rem] text-white text-center overflow-hidden"
            style={{ background: 'linear-gradient(135deg, #0A4D2E 0%, #1a6b40 50%, #0A3D28 100%)' }}
          >
            <div
              className="absolute inset-0 opacity-20 bg-cover bg-center"
              style={{ backgroundImage: "url('https://images.unsplash.com/photo-1506905925346-21bda4d32df4?q=80&w=800')" }}
            />
            <div className="relative z-10">
              <div className="text-3xl mb-2">🌅</div>
              <h4 className="font-heading text-xl font-bold mb-2">Thử Thách Tuần</h4>
              <p className="text-white/80 text-xs leading-relaxed mb-4">
                Chia sẻ 1 bức ảnh hoàng hôn đẹp nhất của bạn để nhận huy hiệu độc quyền!
              </p>
              <button className="bg-[#D4AF37] text-black w-full py-2.5 rounded-full font-black text-xs uppercase tracking-widest hover:bg-white transition-all">
                Tham Gia Ngay
              </button>
            </div>
          </div>
        </aside>

        {/* ===== CỘT GIỮA: FEED/MAP ===== */}
        <main className="col-span-1 lg:col-span-2 space-y-5">
          {/* Tabs Navigation */}
          <div className="flex gap-2 bg-[#0D2D1F] p-2 rounded-2xl border border-white/5 items-center">
            <button 
              onClick={() => setActiveTab('feed')}
              className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all uppercase tracking-widest ${activeTab === 'feed' ? 'bg-[#D4AF37] text-black shadow-lg' : 'text-white/50 hover:bg-white/5 hover:text-white'}`}
            >
              📝 Bảng Tin
            </button>
            <button 
              onClick={() => setActiveTab('map')}
              className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all uppercase tracking-widest ${activeTab === 'map' ? 'bg-[#D4AF37] text-black shadow-lg' : 'text-white/50 hover:bg-white/5 hover:text-white'}`}
            >
              🗺️ Bản Đồ Phượt Thủ
            </button>
            {/* Notification Bell */}
            {loggedInUser && (
              <button
                onClick={() => navigate('/profile?tab=Lời+Mời')}
                className="relative p-2.5 rounded-xl text-white/40 hover:bg-white/5 hover:text-[#D4AF37] transition-all"
                title="Lời mời kết nối"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
                {pendingCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 w-5 h-5 bg-red-500 text-white text-[10px] font-black rounded-full flex items-center justify-center shadow-lg animate-pulse">
                    {pendingCount > 9 ? '9+' : pendingCount}
                  </span>
                )}
              </button>
            )}
          </div>

          {activeTab === 'feed' ? (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-5"
            >
              {/* Post Form */}
              <div className="bg-[#0D2D1F] p-5 rounded-[1.5rem] border border-white/5">
                <div className="flex gap-4">
                  <img
                    src={loggedInUser?.avatar_url || 'https://i.pravatar.cc/150'}
                    className="w-11 h-11 rounded-full object-cover border-2 border-[#D4AF37]/30 flex-shrink-0"
                    alt="ava"
                    onError={(e) => { e.target.src = 'https://i.pravatar.cc/150'; }}
                  />
                  <div className="flex-1">
                    <textarea
                      placeholder={loggedInUser ? 'Hôm nay bạn đã đến đâu? Chia sẻ với cộng đồng...' : 'Vui lòng đăng nhập để chia sẻ...'}
                      className="w-full bg-[#112418] text-white placeholder-white/20 p-4 rounded-xl resize-none h-24 outline-none focus:ring-2 focus:ring-[#D4AF37]/40 text-sm border border-white/5 transition-all"
                      value={newPostContent}
                      onChange={(e) => setNewPostContent(e.target.value)}
                      disabled={!loggedInUser}
                    />
                    {/* Image Preview */}
                    {previewUrl && (
                      <div className="relative mt-3 w-32 h-32 rounded-lg overflow-hidden border border-white/10">
                        <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
                        <button 
                          onClick={() => { setSelectedFile(null); setPreviewUrl(''); }}
                          className="absolute top-1 right-1 bg-black/60 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-black"
                        >
                          ✕
                        </button>
                      </div>
                    )}
                    {/* Location input */}
                    {loggedInUser && (
                      <div className="flex items-center gap-2 mt-2">
                        <span className="text-[#D4AF37] text-sm">📍</span>
                        <input
                          type="text"
                          placeholder="Thêm vị trí..."
                          className="flex-1 bg-transparent text-white/60 placeholder-white/20 text-xs outline-none border-b border-white/10 pb-1"
                          value={newPostLocation}
                          onChange={(e) => setNewPostLocation(e.target.value)}
                        />
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex justify-between items-center mt-4 pt-4 border-t border-white/5">
                  <div className="flex gap-3 text-white/40">
                    <input 
                      type="file" 
                      accept="image/*" 
                      ref={fileInputRef} 
                      onChange={handleFileChange} 
                      className="hidden" 
                    />
                    <button 
                      onClick={() => fileInputRef.current?.click()}
                      className="hover:text-[#D4AF37] flex items-center gap-1.5 text-xs font-bold transition-colors"
                    >
                      <span className="text-base">🖼️</span> Ảnh/Video
                    </button>
                    <button className="hover:text-[#D4AF37] flex items-center gap-1.5 text-xs font-bold transition-colors">
                      <span className="text-base">📍</span> Check-in
                    </button>
                  </div>
                  <button
                    onClick={handlePost}
                    disabled={loading || !loggedInUser || (!newPostContent.trim() && !selectedFile)}
                    className="bg-[#D4AF37] text-black px-6 py-2 rounded-full font-black text-xs uppercase tracking-widest hover:bg-white disabled:opacity-30 transition-all"
                  >
                    {loading ? '⏳ Đang đăng...' : '✈️ Chia Sẻ'}
                  </button>
                </div>
              </div>

              {/* Feed */}
              <div className="space-y-5">
                {posts.length === 0 ? (
                  <p className="text-center text-white/30 py-10">Chưa có bài viết nào.</p>
                ) : (
                  posts.map((post) => <PostCard key={post.id} post={post} onRefresh={fetchPosts} />)
                )}
              </div>
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
            >
              <CommunityMap />
            </motion.div>
          )}
        </main>

        {/* ===== CỘT PHẢI: TOP CONTRIBUTORS ===== */}
        <aside className="hidden lg:flex flex-col gap-5 lg:col-span-1 sticky top-24 h-fit">
          <div className="bg-[#0D2D1F] p-6 rounded-[1.5rem] border border-white/5">
            <h4 className="font-black uppercase tracking-widest text-[10px] text-[#C27A5B] mb-5 flex items-center gap-2">
              🏆 Người Truyền Cảm Hứng
            </h4>
            <ul className="space-y-4">
              {TOP_USERS.map((user, i) => (
                <li key={i} className="group cursor-pointer">
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <img src={user.ava} className="w-10 h-10 rounded-full object-cover border-2 border-white/10 group-hover:border-[#D4AF37]/50 transition-colors" alt="ava" />
                      {i === 0 && <span className="absolute -top-1 -right-1 text-xs">👑</span>}
                    </div>
                    <div className="flex-1 min-w-0">
                      <span className="font-bold text-sm text-[#F5F2EB] group-hover:text-[#D4AF37] transition-colors block truncate">{user.name}</span>
                      <span className="text-[10px] text-[#D4AF37]/70 font-bold">{user.badge}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-xs font-black text-[#D4AF37]">{user.followers}</span>
                      <p className="text-[10px] text-white/30">followers</p>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
            <button className="w-full mt-5 border border-white/10 text-white/40 text-xs font-bold py-2.5 rounded-full hover:border-[#D4AF37]/40 hover:text-[#D4AF37] transition-all uppercase tracking-widest">
              Xem Tất Cả
            </button>
          </div>

          {/* App download CTA */}
          <div className="bg-[#0D2D1F] p-6 rounded-[1.5rem] border border-white/5 text-center">
            <div className="text-3xl mb-3">🌍</div>
            <h4 className="text-[#F5F2EB] font-bold text-sm mb-2">WanderlyVietNam Community</h4>
            <p className="text-white/40 text-xs leading-relaxed mb-4">Chia sẻ hành trình, kết nối với những người yêu du lịch khắp Việt Nam.</p>
            <div className="flex items-center gap-2 justify-center text-white/30 text-xs">
              <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse"></span>
              <span>1.2k người đang online</span>
            </div>
          </div>
        </aside>

      </div>
    </div>
  );
}

export default Community;