import { useState, useEffect, useRef, useCallback } from 'react';
import './AIWidget.scss';
import { API } from '../../config/api.js';
import { useLanguage } from '../../context/LanguageContext.jsx';

const RATE_LIMIT_MS = 3000;

const COPY = {
  VIE: {
    greeting: 'Xin chào! 👋 Mình là trợ lý AI của Byway. Bạn cần mình hướng dẫn gì?',
    subtitle: 'Trợ lý thông minh',
    placeholder: 'Nhắn tin với AI...',
    footer: 'Powered by Gemini · Byway AI',
    wait: (seconds) => `⏳ Vui lòng chờ ${seconds}s trước khi gửi tiếp nhé!`,
    rateLimit: '⚠️ Byway AI đang quá tải. Bạn hãy thử lại sau khoảng 30 giây nhé.',
    fallback: 'Có lỗi xảy ra, vui lòng thử lại sau! 😅',
    emptyReply: 'Mình chưa có câu trả lời phù hợp.',
    quickPrompts: [
      'Làm sao để tìm và đăng ký một khóa học?',
      'Hướng dẫn thanh toán khóa học',
      'Làm sao xem tiến độ học tập?',
    ],
  },
  ENG: {
    greeting: 'Hello! 👋 I am Byway AI. What would you like help with?',
    subtitle: 'Smart assistant',
    placeholder: 'Message AI...',
    footer: 'Powered by Gemini · Byway AI',
    wait: (seconds) => `⏳ Please wait ${seconds}s before sending another message.`,
    rateLimit: '⚠️ Byway AI is busy right now. Please try again in about 30 seconds.',
    fallback: 'Something went wrong. Please try again later! 😅',
    emptyReply: 'I do not have a suitable answer yet.',
    quickPrompts: [
      'How do I find and enroll in a course?',
      'How can I pay for a course?',
      'How do I view my learning progress?',
    ],
  },
};

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
  const { language } = useLanguage();
  const copy = COPY[language] || COPY.ENG;
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [hasGreeted, setHasGreeted] = useState(false);
  const [pulse, setPulse] = useState(true);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const messagesRef = useRef([]);

  const lastCallTime = useRef(0);
  const isRequesting = useRef(false);

  // Stop pulse after 5s
  useEffect(() => {
    const t = setTimeout(() => setPulse(false), 5000);
    return () => clearTimeout(t);
  }, []);

  // Auto scroll
  useEffect(() => {
    messagesRef.current = messages;
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  // Focus input & greeting when opened
  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 300);
      if (!hasGreeted) {
        setMessages([{
          role: 'bot',
          text: copy.greeting,
        }]);
        setHasGreeted(true);
      }
    }
  }, [open, hasGreeted, copy.greeting]);

  // Keep the initial greeting in sync when the site language changes while open.
  useEffect(() => {
    const onlyGreeting = messagesRef.current.length === 1 && messagesRef.current[0];
    if (open && onlyGreeting?.role === 'bot' && !onlyGreeting.includeInHistory) {
      setMessages([{ ...onlyGreeting, text: copy.greeting }]);
    }
  }, [open, copy.greeting]);

  const sendMessageWithText = useCallback(async (text) => {
    if (!text || isRequesting.current) return;

    const now = Date.now();
    const elapsed = now - lastCallTime.current;
    if (elapsed < RATE_LIMIT_MS) {
      const wait = RATE_LIMIT_MS - elapsed;
      setMessages(prev => [
        ...prev,
        { role: 'user', text },
        { role: 'bot', text: copy.wait(Math.ceil(wait / 1000)) },
      ]);
      return;
    }

    isRequesting.current = true;
    lastCallTime.current = Date.now();
    setLoading(true);

    const userMessage = { role: 'user', text };
    const newMessages = [...messagesRef.current, userMessage];
    setMessages(newMessages);

    try {
      // Chỉ gửi các lượt hội thoại thật; lời chào giao diện không gửi lên AI.
      const history = newMessages
        .filter(message => message.role === 'user' || message.includeInHistory)
        .slice(-10)
        .map(message => ({
          role: message.role === 'user' ? 'user' : 'model',
          text: message.text,
        }));

      const res = await fetch(API.aiChat, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: history, language }),
      });

      const data = await res.json().catch(() => ({}));
      if (res.status === 429) {
        throw new Error('RATE_LIMIT');
      }
      if (!res.ok) {
        throw new Error(data.message || 'AI_UNAVAILABLE');
      }

      setMessages(prev => [
        ...prev,
        { role: 'bot', text: data.reply || copy.emptyReply, includeInHistory: true },
      ]);
    } catch (error) {
      const errorText = error.message === 'RATE_LIMIT'
        ? copy.rateLimit
        : error.message || copy.fallback;
      setMessages(prev => [...prev, { role: 'bot', text: errorText }]);
    } finally {
      setLoading(false);
      isRequesting.current = false;
    }
  }, [copy, language]);

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

  const handleQuickPrompt = (prompt) => {
    if (!loading) sendMessageWithText(prompt);
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
                <SparkleIcon /> {copy.subtitle}
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

          {messages.length === 1 && !loading && (
            <div className="ai-widget__quick-prompts">
              {copy.quickPrompts.map(prompt => (
                <button
                  key={prompt}
                  type="button"
                  className="ai-widget__quick-btn"
                  onClick={() => handleQuickPrompt(prompt)}
                >
                  {prompt}
                </button>
              ))}
            </div>
          )}

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
            placeholder={copy.placeholder}
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
        <p className="ai-widget__footer">{copy.footer}</p>
      </div>
    </div>
  );
}
