import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import API_URL from '../config/api';

// ============================================================
// QUICK SUGGESTIONS
// ============================================================
const QUICK_SUGGESTIONS = [
  '🎒 Đi Sapa cần chuẩn bị gì?',
  '🌴 Gợi ý du lịch tháng 6?',
  '🍜 Ăn gì ở Hội An?',
  '⛰️ Cẩm nang Hà Giang',
  '🏖️ Biển nào đẹp nhất miền Trung?',
  '💰 Du lịch Đà Lạt tiết kiệm',
];

// ============================================================
// AI CHATBOX COMPONENT
// ============================================================
function AIChatbox() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [aiStatus, setAiStatus] = useState('checking'); // 'online' | 'offline' | 'checking'
  const [showSuggestions, setShowSuggestions] = useState(true);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const chatContainerRef = useRef(null);

  // Load messages from sessionStorage
  useEffect(() => {
    const saved = sessionStorage.getItem('wanderly_ai_chat');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setMessages(parsed);
        if (parsed.length > 0) setShowSuggestions(false);
      } catch {}
    }
  }, []);

  // Save messages to sessionStorage
  useEffect(() => {
    if (messages.length > 0) {
      sessionStorage.setItem('wanderly_ai_chat', JSON.stringify(messages));
    }
  }, [messages]);

  // Check AI status
  const checkStatus = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/api/ai/status`);
      const data = await res.json();
      setAiStatus(data.status === 'online' ? 'online' : 'offline');
    } catch {
      setAiStatus('offline');
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      checkStatus();
      inputRef.current?.focus();
    }
  }, [isOpen, checkStatus]);

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  // Send message
  const sendMessage = async (text) => {
    const trimmed = (text || input).trim();
    if (!trimmed || isLoading) return;

    setInput('');
    setShowSuggestions(false);

    const userMsg = { role: 'user', content: trimmed, timestamp: Date.now() };
    setMessages(prev => [...prev, userMsg]);
    setIsLoading(true);

    try {
      // Build history for context
      const history = messages.slice(-6).map(m => ({
        role: m.role,
        content: m.content
      }));

      // Try streaming first
      const res = await fetch(`${API_URL}/api/ai/chat-stream`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: trimmed, history })
      });

      if (res.status === 503) {
        // AI offline
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: '⚠️ AI đang offline. Vui lòng kiểm tra lại:\n1. File `.env` ở thư mục gốc đã có dòng `GROQ_API_KEY=gsk_...` chưa.\n2. Nếu chạy trên Render, hãy đảm bảo đã cấu hình biến môi trường `GROQ_API_KEY` trong Environment Dashboard.',
          timestamp: Date.now(),
          isError: true
        }]);
        setAiStatus('offline');
        setIsLoading(false);
        return;
      }

      if (!res.ok) {
        throw new Error('Lỗi kết nối AI');
      }

      // Check if response is SSE stream
      const contentType = res.headers.get('content-type') || '';
      if (contentType.includes('text/event-stream')) {
        // Streaming response
        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let aiMessage = '';
        let sources = [];
        let aiMsgId = Date.now();

        // Add placeholder AI message
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: '',
          timestamp: aiMsgId,
          sources: [],
          isStreaming: true
        }]);

        let buffer = '';
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';

          for (const line of lines) {
            const trimmedLine = line.trim();
            if (!trimmedLine || !trimmedLine.startsWith('data: ')) continue;
            const dataStr = trimmedLine.slice(6);
            if (dataStr === '[DONE]') continue;

            try {
              const json = JSON.parse(dataStr);
              if (json.type === 'sources') {
                sources = json.data || [];
              } else if (json.type === 'token') {
                aiMessage += json.data;
                // Update the streaming message
                setMessages(prev => prev.map(m =>
                  m.timestamp === aiMsgId
                    ? { ...m, content: aiMessage, sources }
                    : m
                ));
              } else if (json.type === 'done') {
                // Mark as complete
                setMessages(prev => prev.map(m =>
                  m.timestamp === aiMsgId
                    ? { ...m, isStreaming: false }
                    : m
                ));
              }
            } catch {}
          }
        }

        // Final update
        setMessages(prev => prev.map(m =>
          m.timestamp === aiMsgId
            ? { ...m, content: aiMessage, sources, isStreaming: false }
            : m
        ));
      } else {
        // Non-streaming fallback
        const data = await res.json();
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: data.reply || 'Xin lỗi, mình không hiểu câu hỏi.',
          timestamp: Date.now(),
          sources: data.sources || []
        }]);
      }
    } catch (err) {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: `❌ Lỗi: ${err.message}. Hãy kiểm tra file .env đã cấu hình GROQ_API_KEY chưa.`,
        timestamp: Date.now(),
        isError: true
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const clearChat = () => {
    setMessages([]);
    setShowSuggestions(true);
    sessionStorage.removeItem('wanderly_ai_chat');
  };

  return (
    <>
      {/* ===== FLOATING BUTTON ===== */}
      <motion.button
        id="ai-chatbox-trigger"
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 z-[9999] w-16 h-16 rounded-full shadow-2xl flex items-center justify-center group"
        style={{
          background: isOpen
            ? 'linear-gradient(135deg, #1a3636 0%, #0A241A 100%)'
            : 'linear-gradient(135deg, #D4AF37 0%, #C27A5B 50%, #D4AF37 100%)',
          boxShadow: isOpen
            ? '0 4px 20px rgba(0,0,0,0.3)'
            : '0 4px 30px rgba(212,175,55,0.5), 0 0 60px rgba(212,175,55,0.2)'
        }}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        animate={isOpen ? {} : {
          boxShadow: [
            '0 4px 30px rgba(212,175,55,0.3), 0 0 60px rgba(212,175,55,0.1)',
            '0 4px 30px rgba(212,175,55,0.6), 0 0 80px rgba(212,175,55,0.3)',
            '0 4px 30px rgba(212,175,55,0.3), 0 0 60px rgba(212,175,55,0.1)',
          ]
        }}
        transition={isOpen ? {} : {
          boxShadow: { duration: 2, repeat: Infinity, ease: 'easeInOut' }
        }}
      >
        <AnimatePresence mode="wait">
          {isOpen ? (
            <motion.svg key="close" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }} className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </motion.svg>
          ) : (
            <motion.div key="ai" initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0, opacity: 0 }} className="flex items-center justify-center">
              <svg className="w-7 h-7 text-[#0A241A]" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/>
              </svg>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Status dot */}
        {!isOpen && (
          <span className={`absolute top-0 right-0 w-4 h-4 rounded-full border-2 border-white ${
            aiStatus === 'online' ? 'bg-green-400' : aiStatus === 'offline' ? 'bg-red-400' : 'bg-yellow-400 animate-pulse'
          }`} />
        )}
      </motion.button>

      {/* ===== CHAT WINDOW ===== */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            id="ai-chatbox-window"
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed bottom-24 right-6 z-[9998] w-[380px] max-w-[calc(100vw-2rem)] h-[600px] max-h-[calc(100vh-8rem)] rounded-3xl overflow-hidden flex flex-col"
            style={{
              background: 'linear-gradient(180deg, #0D2D1F 0%, #0A241A 100%)',
              boxShadow: '0 25px 60px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.08), inset 0 1px 0 rgba(255,255,255,0.05)',
            }}
          >
            {/* Header */}
            <div className="px-5 py-4 border-b border-white/10 flex items-center justify-between shrink-0 bg-gradient-to-r from-[#0D2D1F] to-[#112418]">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #D4AF37 0%, #C27A5B 100%)' }}>
                  <svg className="w-5 h-5 text-[#0A241A]" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/>
                  </svg>
                </div>
                <div>
                  <h3 className="text-[#F5F2EB] font-bold text-sm">WanderlyAI</h3>
                  <div className="flex items-center gap-1.5">
                    <span className={`w-2 h-2 rounded-full ${aiStatus === 'online' ? 'bg-green-400' : 'bg-red-400'}`} />
                    <span className="text-white/40 text-[10px] uppercase tracking-wider">
                      {aiStatus === 'online' ? 'Sẵn sàng' : aiStatus === 'checking' ? 'Đang kiểm tra...' : 'Offline'}
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={clearChat}
                  className="p-2 rounded-lg hover:bg-white/10 transition-colors text-white/40 hover:text-white/80"
                  title="Xoá lịch sử chat"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
                <button
                  onClick={checkStatus}
                  className="p-2 rounded-lg hover:bg-white/10 transition-colors text-white/40 hover:text-white/80"
                  title="Kiểm tra kết nối AI"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Messages */}
            <div ref={chatContainerRef} className="flex-1 overflow-y-auto p-4 space-y-4 ai-chat-scrollbar">
              {/* Welcome message */}
              {messages.length === 0 && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="text-center py-6">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-2xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, rgba(212,175,55,0.15) 0%, rgba(194,122,91,0.15) 100%)' }}>
                    <span className="text-3xl">🌏</span>
                  </div>
                  <h4 className="text-[#F5F2EB] font-bold text-base mb-2">Xin chào! 👋</h4>
                  <p className="text-white/40 text-xs leading-relaxed px-4">
                    Mình là <span className="text-[#D4AF37] font-semibold">WanderlyAI</span> — trợ lý du lịch Việt Nam của bạn. 
                    Hỏi mình bất cứ điều gì về du lịch nhé!
                  </p>
                </motion.div>
              )}

              {/* Quick Suggestions */}
              {showSuggestions && messages.length === 0 && (
                <div className="space-y-2">
                  <p className="text-white/30 text-[10px] uppercase tracking-widest text-center mb-3">Gợi ý câu hỏi</p>
                  <div className="flex flex-wrap gap-2 justify-center">
                    {QUICK_SUGGESTIONS.map((q, i) => (
                      <motion.button
                        key={i}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.05 }}
                        onClick={() => sendMessage(q)}
                        className="px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white/60 text-xs hover:bg-[#D4AF37]/10 hover:border-[#D4AF37]/30 hover:text-[#D4AF37] transition-all duration-300"
                      >
                        {q}
                      </motion.button>
                    ))}
                  </div>
                </div>
              )}

              {/* Message Bubbles */}
              {messages.map((msg, idx) => (
                <motion.div
                  key={msg.timestamp || idx}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`max-w-[85%] ${msg.role === 'user' ? '' : 'flex gap-2'}`}>
                    {msg.role === 'assistant' && (
                      <div className="w-7 h-7 rounded-lg shrink-0 mt-1 flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #D4AF37 0%, #C27A5B 100%)' }}>
                        <svg className="w-3.5 h-3.5 text-[#0A241A]" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/>
                        </svg>
                      </div>
                    )}
                    <div>
                      <div
                        className={`px-4 py-3 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap ${
                          msg.role === 'user'
                            ? 'bg-gradient-to-r from-[#D4AF37] to-[#C27A5B] text-[#0A241A] font-medium rounded-br-lg'
                            : msg.isError
                              ? 'bg-red-500/10 border border-red-500/20 text-red-300 rounded-bl-lg'
                              : 'bg-white/[0.06] border border-white/[0.08] text-[#F5F2EB]/90 rounded-bl-lg'
                        }`}
                      >
                        {msg.content}
                        {msg.isStreaming && (
                          <span className="inline-block ml-1 ai-typing-cursor">▊</span>
                        )}
                      </div>

                      {/* Sources */}
                      {msg.sources && msg.sources.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-1">
                          {msg.sources.slice(0, 3).map((s, si) => (
                            <span key={si} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-[#D4AF37]/10 border border-[#D4AF37]/20 text-[10px] text-[#D4AF37]">
                              📍 {s.name}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}

              {/* Loading indicator */}
              {isLoading && messages[messages.length - 1]?.role !== 'assistant' && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex gap-2"
                >
                  <div className="w-7 h-7 rounded-lg shrink-0 flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #D4AF37 0%, #C27A5B 100%)' }}>
                    <svg className="w-3.5 h-3.5 text-[#0A241A]" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z"/>
                    </svg>
                  </div>
                  <div className="bg-white/[0.06] border border-white/[0.08] rounded-2xl rounded-bl-lg px-4 py-3">
                    <div className="flex items-center gap-1.5">
                      <div className="ai-typing-dot w-2 h-2 rounded-full bg-[#D4AF37]" style={{ animationDelay: '0ms' }} />
                      <div className="ai-typing-dot w-2 h-2 rounded-full bg-[#D4AF37]" style={{ animationDelay: '150ms' }} />
                      <div className="ai-typing-dot w-2 h-2 rounded-full bg-[#D4AF37]" style={{ animationDelay: '300ms' }} />
                    </div>
                  </div>
                </motion.div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="p-4 border-t border-white/10 shrink-0 bg-[#0A241A]">
              <div className="flex items-end gap-2">
                <div className="flex-1 relative">
                  <textarea
                    ref={inputRef}
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder={aiStatus === 'online' ? 'Hỏi về du lịch Việt Nam...' : 'AI đang offline...'}
                    disabled={aiStatus === 'offline'}
                    rows={1}
                    className="w-full resize-none bg-white/[0.06] border border-white/10 rounded-xl px-4 py-3 text-[#F5F2EB] text-sm placeholder-white/25 outline-none focus:border-[#D4AF37]/50 focus:bg-white/[0.08] transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                    style={{ maxHeight: '100px' }}
                    onInput={(e) => {
                      e.target.style.height = 'auto';
                      e.target.style.height = Math.min(e.target.scrollHeight, 100) + 'px';
                    }}
                  />
                </div>
                <button
                  onClick={() => sendMessage()}
                  disabled={!input.trim() || isLoading || aiStatus === 'offline'}
                  className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0 transition-all duration-300 disabled:opacity-30 disabled:cursor-not-allowed"
                  style={{
                    background: input.trim() && !isLoading
                      ? 'linear-gradient(135deg, #D4AF37 0%, #C27A5B 100%)'
                      : 'rgba(255,255,255,0.06)'
                  }}
                >
                  <svg className={`w-5 h-5 ${input.trim() && !isLoading ? 'text-[#0A241A]' : 'text-white/30'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 19V5m0 0l-7 7m7-7l7 7" />
                  </svg>
                </button>
              </div>
              <p className="text-white/15 text-[9px] text-center mt-2 tracking-wider">
                WanderlyAI · Powered by Groq Cloud + RAG
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

export default AIChatbox;
