import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import API_URL from '../config/api';

function ChatDrawer({ isOpen, onClose, initialFriendId }) {
  const [conversations, setConversations] = useState([]);
  const [activeFriend, setActiveFriend] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(false);
  const [view, setView] = useState('list'); // 'list' | 'chat'
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const pollRef = useRef(null);
  const loggedInUser = JSON.parse(localStorage.getItem('user'));
  const token = localStorage.getItem('token') || '';

  const authHeaders = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  };

  // Scroll xuống tin nhắn mới nhất
  const scrollToBottom = useCallback(() => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  }, []);

  // Fetch danh sách hội thoại
  const fetchConversations = useCallback(async () => {
    if (!token) return;
    try {
      const res = await fetch(`${API_URL}/api/messages/conversations`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.status === 'success') setConversations(data.data);
    } catch (e) { console.error('Fetch conversations error:', e); }
  }, [token]);

  // Fetch tin nhắn với 1 bạn bè
  const fetchMessages = useCallback(async (friendId) => {
    if (!token || !friendId) return;
    try {
      const res = await fetch(`${API_URL}/api/messages/${friendId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.status === 'success') {
        setMessages(data.data);
        scrollToBottom();
        // Đánh dấu đã đọc
        fetch(`${API_URL}/api/messages/read/${friendId}`, {
          method: 'PUT',
          headers: authHeaders
        }).catch(() => {});
      }
    } catch (e) { console.error('Fetch messages error:', e); }
  }, [token]);

  // Khi mở drawer
  useEffect(() => {
    if (isOpen) {
      fetchConversations();
      if (initialFriendId) {
        openChat(initialFriendId);
      }
    } else {
      // Reset khi đóng
      setView('list');
      setActiveFriend(null);
      setMessages([]);
      if (pollRef.current) clearInterval(pollRef.current);
    }
  }, [isOpen, initialFriendId]);

  // Mở chat với 1 bạn bè
  const openChat = async (friendId) => {
    setLoading(true);
    // Tìm thông tin friend từ conversations hoặc fetch
    let friend = conversations.find(c => c.friend_id === friendId);
    if (!friend) {
      // Nếu chưa có trong danh sách (mở trực tiếp từ Profile)
      await fetchConversations();
      friend = conversations.find(c => c.friend_id === friendId);
    }
    
    if (!friend) {
      // Fetch friend info directly
      try {
        const res = await fetch(`${API_URL}/api/profile/${friendId}`);
        const data = await res.json();
        if (data.id) {
          friend = {
            friend_id: data.id,
            full_name: data.full_name,
            avatar_url: data.avatar_url,
            location: data.location,
            unread_count: 0
          };
        }
      } catch (e) {}
    }
    
    setActiveFriend(friend || { friend_id: friendId, full_name: 'Bạn bè', avatar_url: null });
    setView('chat');
    await fetchMessages(friendId);
    setLoading(false);

    // Bắt đầu polling
    if (pollRef.current) clearInterval(pollRef.current);
    pollRef.current = setInterval(() => {
      fetchMessages(friendId);
    }, 3000);
  };

  // Cleanup polling khi unmount hoặc đóng
  useEffect(() => {
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, []);

  // Gửi tin nhắn
  const handleSend = async (e) => {
    e?.preventDefault();
    if (!inputText.trim() || !activeFriend || sending) return;
    setSending(true);
    try {
      const res = await fetch(`${API_URL}/api/messages`, {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({
          receiver_id: activeFriend.friend_id,
          content: inputText.trim()
        })
      });
      const data = await res.json();
      if (data.status === 'success') {
        setMessages(prev => [...prev, data.data]);
        setInputText('');
        scrollToBottom();
        inputRef.current?.focus();
      }
    } catch (e) { console.error('Send message error:', e); }
    finally { setSending(false); }
  };

  // Format thời gian
  const formatTime = (dateStr) => {
    if (!dateStr) return '';
    const utcDateStr = dateStr.endsWith('Z') ? dateStr : dateStr.replace(' ', 'T') + 'Z';
    const d = new Date(utcDateStr);
    const now = new Date();
    const diffMs = now - d;
    const diffMin = Math.floor(diffMs / 60000);
    
    if (diffMin < 1) return 'Vừa xong';
    if (diffMin < 60) return `${diffMin} phút`;
    if (diffMin < 1440) return `${Math.floor(diffMin / 60)} giờ`;
    if (diffMin < 10080) return `${Math.floor(diffMin / 1440)} ngày`;
    return d.toLocaleDateString('vi-VN');
  };

  const formatMessageTime = (dateStr) => {
    if (!dateStr) return '';
    const utcDateStr = dateStr.endsWith('Z') ? dateStr : dateStr.replace(' ', 'T') + 'Z';
    const d = new Date(utcDateStr);
    return d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
  };

  const getAvatarUrl = (url) => {
    if (!url) return 'https://i.pravatar.cc/150';
    return url.startsWith('/') ? `${API_URL}${url}` : url;
  };

  // Quay lại danh sách
  const goBack = () => {
    if (pollRef.current) clearInterval(pollRef.current);
    setView('list');
    setActiveFriend(null);
    setMessages([]);
    fetchConversations();
  };

  if (!loggedInUser) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9990]"
          />

          {/* Drawer */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="fixed right-0 top-0 h-full w-full sm:w-[420px] bg-[#0A241A] z-[9991] flex flex-col shadow-2xl shadow-black/50"
          >
            {/* ===== HEADER ===== */}
            <div className="flex items-center gap-3 px-5 py-4 border-b border-white/10 bg-gradient-to-r from-[#0D2D1F] to-[#0A241A]"
                 style={{ backdropFilter: 'blur(20px)' }}>
              {view === 'chat' ? (
                <>
                  <button onClick={goBack}
                    className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/10 transition-colors text-white/70 hover:text-white">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6"/></svg>
                  </button>
                  <img
                    src={getAvatarUrl(activeFriend?.avatar_url)}
                    alt="ava"
                    className="w-9 h-9 rounded-full object-cover border-2 border-[#D4AF37]/40"
                    onError={(e) => { e.target.src = 'https://i.pravatar.cc/150'; }}
                  />
                  <div className="flex-1 min-w-0">
                    <h3 className="text-white font-bold text-sm truncate">{activeFriend?.full_name}</h3>
                    <p className="text-white/40 text-[10px] truncate">{activeFriend?.location || 'Bạn bè'}</p>
                  </div>
                </>
              ) : (
                <>
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#D4AF37] to-[#F5D76E] flex items-center justify-center text-black font-black text-sm">
                    💬
                  </div>
                  <div className="flex-1">
                    <h3 className="text-white font-bold text-sm">Tin nhắn</h3>
                    <p className="text-white/40 text-[10px]">{conversations.length} cuộc hội thoại</p>
                  </div>
                </>
              )}
              <button onClick={onClose}
                className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/10 transition-colors text-white/50 hover:text-white">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>

            {/* ===== CONTENT ===== */}
            <div className="flex-1 overflow-hidden flex flex-col">
              <AnimatePresence mode="wait">
                {/* ===== CONVERSATION LIST ===== */}
                {view === 'list' && (
                  <motion.div
                    key="list"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="flex-1 overflow-y-auto"
                  >
                    {conversations.length === 0 ? (
                      <div className="flex flex-col items-center justify-center h-full text-white/30 px-8 text-center">
                        <div className="text-5xl mb-4">💬</div>
                        <p className="text-sm font-bold mb-1">Chưa có cuộc trò chuyện</p>
                        <p className="text-xs">Hãy kết bạn với phượt thủ khác và bắt đầu trò chuyện!</p>
                      </div>
                    ) : (
                      <div className="py-2">
                        {conversations.map((conv, i) => (
                          <motion.button
                            key={conv.friend_id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.03 }}
                            onClick={() => openChat(conv.friend_id)}
                            className="w-full flex items-center gap-3 px-5 py-3.5 hover:bg-white/5 transition-all text-left group"
                          >
                            <div className="relative flex-shrink-0">
                              <img
                                src={getAvatarUrl(conv.avatar_url)}
                                alt="ava"
                                className="w-12 h-12 rounded-full object-cover border-2 border-white/10 group-hover:border-[#D4AF37]/40 transition-colors"
                                onError={(e) => { e.target.src = 'https://i.pravatar.cc/150'; }}
                              />
                              {conv.unread_count > 0 && (
                                <div className="absolute -top-1 -right-1 w-5 h-5 bg-[#D4AF37] rounded-full flex items-center justify-center text-[10px] font-black text-black shadow-lg">
                                  {conv.unread_count > 9 ? '9+' : conv.unread_count}
                                </div>
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between gap-2">
                                <h4 className={`text-sm truncate ${conv.unread_count > 0 ? 'font-black text-white' : 'font-semibold text-white/80'}`}>
                                  {conv.full_name}
                                </h4>
                                {conv.last_message_time && (
                                  <span className={`text-[10px] flex-shrink-0 ${conv.unread_count > 0 ? 'text-[#D4AF37] font-bold' : 'text-white/30'}`}>
                                    {formatTime(conv.last_message_time)}
                                  </span>
                                )}
                              </div>
                              {conv.last_message ? (
                                <p className={`text-xs truncate mt-0.5 ${conv.unread_count > 0 ? 'text-white/70 font-semibold' : 'text-white/40'}`}>
                                  {conv.last_message_is_mine ? 'Bạn: ' : ''}{conv.last_message}
                                </p>
                              ) : (
                                <p className="text-xs text-white/25 mt-0.5 italic">Chưa có tin nhắn</p>
                              )}
                            </div>
                          </motion.button>
                        ))}
                      </div>
                    )}
                  </motion.div>
                )}

                {/* ===== CHAT VIEW ===== */}
                {view === 'chat' && (
                  <motion.div
                    key="chat"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    className="flex-1 flex flex-col overflow-hidden"
                  >
                    {/* Messages */}
                    <div className="flex-1 overflow-y-auto px-4 py-4 space-y-1">
                      {loading ? (
                        <div className="flex items-center justify-center h-full">
                          <div className="text-[#D4AF37] text-sm animate-pulse font-bold">Đang tải...</div>
                        </div>
                      ) : messages.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full text-white/25 text-center">
                          <div className="w-16 h-16 rounded-full bg-[#0D2D1F] border border-white/10 flex items-center justify-center text-2xl mb-3">
                            👋
                          </div>
                          <p className="text-xs">Hãy gửi lời chào đến <span className="text-[#D4AF37] font-bold">{activeFriend?.full_name}</span>!</p>
                        </div>
                      ) : (
                        <>
                          {messages.map((msg, i) => {
                            const isMine = msg.sender_id == loggedInUser.id;
                            const showTime = i === 0 || 
                              (new Date(messages[i].created_at) - new Date(messages[i-1].created_at)) > 300000;
                            const prevSameSender = i > 0 && messages[i-1].sender_id === msg.sender_id;
                            
                            return (
                              <React.Fragment key={msg.id}>
                                {showTime && (
                                  <div className="flex justify-center my-3">
                                    <span className="text-[10px] text-white/20 bg-white/5 px-3 py-1 rounded-full">
                                      {formatMessageTime(msg.created_at)}
                                    </span>
                                  </div>
                                )}
                                <motion.div
                                  initial={{ opacity: 0, y: 5, scale: 0.98 }}
                                  animate={{ opacity: 1, y: 0, scale: 1 }}
                                  className={`flex ${isMine ? 'justify-end' : 'justify-start'} ${prevSameSender ? 'mt-0.5' : 'mt-2'}`}
                                >
                                  {!isMine && !prevSameSender && (
                                    <img
                                      src={getAvatarUrl(activeFriend?.avatar_url)}
                                      alt=""
                                      className="w-7 h-7 rounded-full object-cover mr-2 mt-1 flex-shrink-0"
                                      onError={(e) => { e.target.src = 'https://i.pravatar.cc/150'; }}
                                    />
                                  )}
                                  {!isMine && prevSameSender && <div className="w-7 mr-2 flex-shrink-0" />}
                                  <div
                                    className={`max-w-[75%] px-4 py-2.5 text-sm leading-relaxed ${
                                      isMine
                                        ? 'bg-gradient-to-br from-[#D4AF37] to-[#C5A028] text-black rounded-2xl rounded-br-md font-medium'
                                        : 'bg-[#152E22] text-white/90 rounded-2xl rounded-bl-md border border-white/5'
                                    }`}
                                  >
                                    {msg.content}
                                  </div>
                                </motion.div>
                              </React.Fragment>
                            );
                          })}
                          <div ref={messagesEndRef} />
                        </>
                      )}
                    </div>

                    {/* Input area */}
                    <form onSubmit={handleSend} className="px-4 pb-4 pt-2 border-t border-white/5">
                      <div className="flex items-center gap-2 bg-[#0D2D1F] rounded-2xl border border-white/10 focus-within:border-[#D4AF37]/40 transition-colors px-4 py-1">
                        <input
                          ref={inputRef}
                          type="text"
                          value={inputText}
                          onChange={e => setInputText(e.target.value)}
                          placeholder="Nhập tin nhắn..."
                          className="flex-1 bg-transparent text-white text-sm py-2.5 outline-none placeholder:text-white/25"
                          autoFocus
                        />
                        <button
                          type="submit"
                          disabled={!inputText.trim() || sending}
                          className="w-9 h-9 rounded-xl flex items-center justify-center transition-all disabled:opacity-30 disabled:cursor-not-allowed bg-gradient-to-br from-[#D4AF37] to-[#F5D76E] text-black hover:shadow-lg hover:shadow-[#D4AF37]/20 active:scale-95"
                        >
                          {sending ? (
                            <span className="text-xs animate-pulse">⏳</span>
                          ) : (
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                              <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
                            </svg>
                          )}
                        </button>
                      </div>
                    </form>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

export default ChatDrawer;
