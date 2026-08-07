import React, { useState } from 'react';
import { Share2, ArrowLeft, MoreHorizontal, Send } from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import './MessagePage.scss';

const teacherImg = "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&q=80&w=200";

export default function MessagePage() {
  const location = useLocation();
  const navigate = useNavigate();

  const teacher = location.state?.teacher ?? {
    name: 'Ronald Richards',
    avatar: teacherImg,
  };

  const [user] = useState(() => {
    const stored = localStorage.getItem('loggedInUser');
    return stored ? JSON.parse(stored) : null;
  });

  const [messages, setMessages] = useState([
    { id: 1, from: 'me', time: '10:25 am', text: 'Hello' },
    { id: 2, from: 'me', time: '10:25 am', text: "Just wanted to tell you that i started your course and its going great!!" },
    { id: 3, from: 'them', time: '12:23 pm', text: 'Hello! Thank you for reaching out to me. Feel free to ask any questions regarding the course, i will try to reply ASAP' },
    { id: 4, from: 'me', time: '10:25 am', text: 'Yes Sure' },
  ]);

  const [draft, setDraft] = useState('');

  const handleSend = () => {
    const text = draft.trim();
    if (!text) return;
    const now = new Date();
    const time = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }).toLowerCase();
    setMessages((prev) => [...prev, { id: prev.length + 1, from: 'me', time, text }]);
    setDraft('');
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="message-page">
      <div className="message-page__inner">

        {/* Sidebar */}
        <aside className="message-page__sidebar">
          <div className="sidebar__profile-card">
            <div className="sidebar__avatar-wrapper">
              <img
                src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=facearea&facepad=2&w=256&h=256&q=80"
                alt={user?.Username ?? 'John Doe'}
                className="sidebar__avatar"
                referrerPolicy="no-referrer"
              />
            </div>
            <h2 className="sidebar__name">{user?.Username ?? 'John Doe'}</h2>
            <button className="sidebar__share-btn">
              Share Profile <Share2 className="sidebar__share-icon" />
            </button>
          </div>
          <nav className="sidebar__nav">
            <Link to="/profile" className="sidebar__nav-item">Profile</Link>
            <Link to="/mycoursespage" className="sidebar__nav-item">My Courses</Link>
            <Link to="/teachers" className="sidebar__nav-item">Teachers</Link>
            <Link to="/message" className="sidebar__nav-item sidebar__nav-item--active">Message</Link>
            <Link to="/myreviews" className="sidebar__nav-item">My Reviews</Link>
          </nav>
        </aside>

        {/* Main content */}
        <main className="message-page__main">
          <h1 className="message-page__title">Messages</h1>

          <div className="chat-window">
            {/* Chat header */}
            <div className="chat-window__header">
              <button className="chat-window__back" onClick={() => navigate(-1)} aria-label="Back">
                <ArrowLeft size={18} />
              </button>
              <img src={teacher.avatar} alt={teacher.name} className="chat-window__avatar" referrerPolicy="no-referrer" />
              <h2 className="chat-window__name">{teacher.name}</h2>
              <button className="chat-window__more" aria-label="More options">
                <MoreHorizontal size={18} />
              </button>
            </div>

            {/* Messages */}
            <div className="chat-window__body">
              <div className="chat-divider"><span>Today</span></div>

              {messages.map((m) => (
                m.from === 'me' ? (
                  <div className="chat-bubble-row chat-bubble-row--me" key={m.id}>
                    <span className="chat-bubble-row__time">{m.time}</span>
                    <div className="chat-bubble chat-bubble--me">{m.text}</div>
                  </div>
                ) : (
                  <div className="chat-bubble-row chat-bubble-row--them" key={m.id}>
                    <img src={teacher.avatar} alt={teacher.name} className="chat-bubble-row__avatar" referrerPolicy="no-referrer" />
                    <div className="chat-bubble-row__content">
                      <span className="chat-bubble-row__time">{m.time}</span>
                      <div className="chat-bubble chat-bubble--them">{m.text}</div>
                    </div>
                  </div>
                )
              ))}
            </div>

            {/* Input */}
            <div className="chat-window__footer">
              <input
                type="text"
                placeholder="Type Your Message"
                className="chat-window__input"
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={handleKeyDown}
              />
              <button className="chat-window__send" onClick={handleSend}>
                Send <Send size={14} />
              </button>
            </div>
          </div>
        </main>

      </div>
    </div>
  );
}