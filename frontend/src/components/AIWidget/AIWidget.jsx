import { useState, useEffect, useRef, useCallback } from 'react';
import './AIWidget.scss';

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-lite:generateContent?key=${GEMINI_API_KEY}`;

const RATE_LIMIT_MS = 3000;

const BotIcon = () => (
  <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
    <rect x="4" y="8" width="20" height="14" rx="4" fill="white" fillOpacity="0.2" stroke="white" strokeWidth="1.5"/>
    <circle cx="10" cy="15" r="2" fill="white"/>
    <circle cx="18" cy="15" r="2" fill="white"/>
    <path d="M14 4v4M11 4h6" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
    <path d="M7 22l-2 2M21 22l2 2" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
  </svg>
);

const SendIcon = () => (
  <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
    <path d="M2 9l14-7-5 7 5 7-14-7z" fill="currentColor"/>
  </svg>
);

const SparkleIcon = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
    <path d="M7 1l1.5 3.5L12 6l-3.5 1.5L7 11l-1.5-3.5L2 6l3.5-1.5L7 1z" fill="currentColor"/>
  </svg>
);

export default function AIWidget() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [hasGreeted, setHasGreeted] = useState(false);
  const [pulse, setPulse] = useState(true);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  const lastCallTime = useRef(0);
  const isRequesting = useRef(false);

  // Stop pulse after 5s
  useEffect(() => {
    const t = setTimeout(() => setPulse(false), 5000);
    return () => clearTimeout(t);
  }, []);

  // Auto scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  // Focus input & greeting when opened
  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 300);
      if (!hasGreeted) {
        setMessages([{
          role: 'bot',
          text: 'Xin chào! 👋 Mình là trợ lý AI. Bạn cần mình giúp gì nào?',
        }]);
        setHasGreeted(true);
      }
    }
  }, [open]);

  const sendMessageWithText = useCallback(async (text) => {
    if (!text || isRequesting.current) return;

    const now = Date.now();
    const elapsed = now - lastCallTime.current;
    if (elapsed < RATE_LIMIT_MS) {
      const wait = RATE_LIMIT_MS - elapsed;
      setMessages(prev => [
        ...prev,
        { role: 'user', text },
        { role: 'bot', text: `⏳ Vui lòng chờ ${Math.ceil(wait / 1000)}s trước khi gửi tiếp nhé!` },
      ]);
      return;
    }

    isRequesting.current = true;
    lastCallTime.current = Date.now();

    setMessages(prev => {
      const newMessages = [...prev, { role: 'user', text }];

      (async () => {
        setLoading(true);
        try {
          // Build conversation history for context (last 10 messages)
          const contents = newMessages.slice(-10).map(m => ({
            role: m.role === 'user' ? 'user' : 'model',
            parts: [{ text: m.text }],
          }));

          const res = await fetch(GEMINI_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ contents }),
          });

          if (res.status === 429) {
            setMessages(prev => [
              ...prev,
              { role: 'bot', text: '⚠️ Mình đang quá tải! Bạn hãy đợi khoảng 30 giây rồi hỏi lại nhé 🙏' },
            ]);
            lastCallTime.current = Date.now() + 20_000;
            return;
          }

          if (!res.ok) throw new Error(`HTTP ${res.status}`);

          const data = await res.json();
          const botText =
            data?.candidates?.[0]?.content?.parts?.[0]?.text ||
            'Xin lỗi, mình không hiểu. Bạn thử hỏi lại nhé!';

          setMessages(prev => [...prev, { role: 'bot', text: botText }]);
        } catch {
          setMessages(prev => [
            ...prev,
            { role: 'bot', text: 'Có lỗi xảy ra, vui lòng thử lại sau! 😅' },
          ]);
        } finally {
          setLoading(false);
          isRequesting.current = false;
        }
      })();

      return newMessages;
    });
  }, []);

  const sendMessage = useCallback(() => {
    const text = input.trim();
    if (!text || loading) return;
    setInput('');
    sendMessageWithText(text);
  }, [input, loading, sendMessageWithText]);

  const handleKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  // Render simple markdown (bold)
  const renderText = (text) => {
    const parts = text.split(/(\*\*[^*]+\*\*)/g);
    return parts.map((part, i) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={i}>{part.slice(2, -2)}</strong>;
      }
      return <span key={i}>{part}</span>;
    });
  };

  return (
    <div className="ai-widget">
      {/* Floating Button */}
      <button
        className={`ai-widget__fab ${open ? 'ai-widget__fab--open' : ''} ${pulse ? 'ai-widget__fab--pulse' : ''}`}
        onClick={() => setOpen(v => !v)}
        aria-label="AI Assistant"
      >
        {open ? (
          <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
            <path d="M4 4l14 14M18 4L4 18" stroke="white" strokeWidth="2.2" strokeLinecap="round"/>
          </svg>
        ) : (
          <BotIcon />
        )}
        {!open && <span className="ai-widget__fab-label">AI</span>}
      </button>

      {/* Chat Window */}
      <div className={`ai-widget__window ${open ? 'ai-widget__window--open' : ''}`}>
        {/* Header */}
        <div className="ai-widget__header">
          <div className="ai-widget__header-left">
            <div className="ai-widget__avatar">
              <BotIcon />
              <span className="ai-widget__status-dot" />
            </div>
            <div>
              <p className="ai-widget__header-title">Byway AI</p>
              <p className="ai-widget__header-sub">
                <SparkleIcon /> Trợ lý thông minh
              </p>
            </div>
          </div>
          <button className="ai-widget__close" onClick={() => setOpen(false)}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M3 3l10 10M13 3L3 13" stroke="white" strokeWidth="1.8" strokeLinecap="round"/>
            </svg>
          </button>
        </div>

        {/* Messages */}
        <div className="ai-widget__messages">
          {messages.map((msg, i) => (
            <div key={i} className={`ai-widget__msg ai-widget__msg--${msg.role}`}>
              {msg.role === 'bot' && (
                <div className="ai-widget__msg-avatar">
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                    <rect x="1" y="3" width="12" height="8" rx="2.5" fill="white" fillOpacity="0.9"/>
                    <circle cx="5" cy="7" r="1.2" fill="#6366f1"/>
                    <circle cx="9" cy="7" r="1.2" fill="#6366f1"/>
                    <path d="M7 1v2M5.5 1h3" stroke="white" strokeWidth="1" strokeLinecap="round"/>
                  </svg>
                </div>
              )}
              <div className="ai-widget__msg-bubble">
                {renderText(msg.text)}
              </div>
            </div>
          ))}

          {loading && (
            <div className="ai-widget__msg ai-widget__msg--bot">
              <div className="ai-widget__msg-avatar">
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <rect x="1" y="3" width="12" height="8" rx="2.5" fill="white" fillOpacity="0.9"/>
                  <circle cx="5" cy="7" r="1.2" fill="#6366f1"/>
                  <circle cx="9" cy="7" r="1.2" fill="#6366f1"/>
                </svg>
              </div>
              <div className="ai-widget__msg-bubble ai-widget__msg-bubble--typing">
                <span/><span/><span/>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="ai-widget__input-area">
          <textarea
            ref={inputRef}
            className="ai-widget__input"
            placeholder="Nhắn tin với AI..."
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKey}
            rows={1}
          />
          <button
            className={`ai-widget__send ${input.trim() ? 'ai-widget__send--active' : ''}`}
            onClick={sendMessage}
            disabled={!input.trim() || loading}
          >
            <SendIcon />
          </button>
        </div>
        <p className="ai-widget__footer">Powered by Gemini · Byway AI</p>
      </div>
    </div>
  );
}