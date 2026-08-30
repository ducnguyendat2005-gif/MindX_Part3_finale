import React, { useCallback, useEffect, useRef, useState } from 'react';
import { MoreHorizontal, Send } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import { API, fetchWithAuth } from '../../../config/api.js';
import './MessageTab.scss';

const DEFAULT_AVATAR = 'https://cdn-icons-png.flaticon.com/512/149/149071.png';

const getContactId = (contact) => String(contact?.accountId || contact?.id || '');

const normalizeContact = (contact) => ({
  accountId: contact.accountId || contact.id,
  name: contact.name || contact.username || 'Người dùng',
  username: contact.username,
  avatar: contact.avatar || DEFAULT_AVATAR,
  role: contact.role,
});

const formatTime = (date) => {
  const parsedDate = new Date(date);
  if (Number.isNaN(parsedDate.getTime())) return '';
  return parsedDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

export default function MessageTab() {
  const location = useLocation();
  const routeContact = location.state?.teacher;
  const [selectedContact, setSelectedContact] = useState(
    routeContact?.accountId ? normalizeContact(routeContact) : null
  );
  const [conversations, setConversations] = useState([]);
  const [messages, setMessages] = useState([]);
  const [loadingConversations, setLoadingConversations] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const [draft, setDraft] = useState('');
  const messageBodyRef = useRef(null);

  useEffect(() => {
    if (routeContact?.accountId) setSelectedContact(normalizeContact(routeContact));
  }, [location.state]);

  const loadConversations = useCallback(async () => {
    try {
      const res = await fetchWithAuth(API.conversations);
      const result = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(result.message || 'Không thể tải cuộc trò chuyện');
      const nextConversations = (result.data || []).map(normalizeContact);
      setConversations(nextConversations);
      setSelectedContact((current) => current || nextConversations[0] || null);
    } catch (loadError) {
      setError(loadError.message || 'Không thể tải cuộc trò chuyện');
    } finally {
      setLoadingConversations(false);
    }
  }, []);

  useEffect(() => {
    loadConversations();
    const intervalId = window.setInterval(loadConversations, 15000);
    return () => window.clearInterval(intervalId);
  }, [loadConversations]);

  const loadMessages = useCallback(async () => {
    const contactId = getContactId(selectedContact);
    if (!contactId) {
      setMessages([]);
      return;
    }

    setLoadingMessages(true);
    try {
      const res = await fetchWithAuth(API.messages(contactId));
      const result = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(result.message || 'Không thể tải tin nhắn');
      setMessages(result.data || []);
      if (result.contact) {
        setSelectedContact((current) => {
          const next = normalizeContact(result.contact);
          return getContactId(current) === getContactId(next) && current?.name === next.name
            ? current
            : next;
        });
      }
      setError('');
    } catch (loadError) {
      setMessages([]);
      setError(loadError.message || 'Không thể tải tin nhắn');
    } finally {
      setLoadingMessages(false);
    }
  }, [selectedContact]);

  useEffect(() => {
    loadMessages();
    if (!getContactId(selectedContact)) return undefined;

    const intervalId = window.setInterval(loadMessages, 5000);
    return () => window.clearInterval(intervalId);
  }, [loadMessages, selectedContact]);

  useEffect(() => {
    if (messageBodyRef.current) {
      messageBodyRef.current.scrollTop = messageBodyRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    const text = draft.trim();
    const contactId = getContactId(selectedContact);
    if (!text || !contactId || sending) return;

    setSending(true);
    setError('');
    try {
      const res = await fetchWithAuth(API.messages(contactId), {
        method: 'POST',
        body: JSON.stringify({ text }),
      });
      const result = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(result.message || 'Không thể gửi tin nhắn');

      setMessages((current) => [...current, result.data]);
      setDraft('');
      await loadConversations();
    } catch (sendError) {
      setError(sendError.message || 'Không thể gửi tin nhắn');
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (event) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="message-tab">
      <h1 className="message-tab__title">Messages</h1>

      <div className="message-layout">
        <aside className="conversation-list">
          <h2 className="conversation-list__title">Conversations</h2>
          {loadingConversations && conversations.length === 0 ? (
            <p className="conversation-list__empty">Đang tải...</p>
          ) : conversations.length === 0 ? (
            <p className="conversation-list__empty">Chưa có cuộc trò chuyện</p>
          ) : (
            conversations.map((conversation) => {
              const conversationId = getContactId(conversation);
              return (
                <button
                  type="button"
                  key={conversationId}
                  className={`conversation-list__item ${conversationId === getContactId(selectedContact) ? 'conversation-list__item--active' : ''}`}
                  onClick={() => setSelectedContact(conversation)}
                >
                  <img src={conversation.avatar} alt={conversation.name} referrerPolicy="no-referrer" />
                  <span>
                    <strong>{conversation.name}</strong>
                    <small>{conversation.lastMessage || 'Bắt đầu trò chuyện'}</small>
                  </span>
                  {conversation.unreadCount > 0 && <b>{conversation.unreadCount}</b>}
                </button>
              );
            })
          )}
        </aside>

        <section className="chat-window">
          {selectedContact ? (
            <>
              <div className="chat-window__header">
                <img src={selectedContact.avatar} alt={selectedContact.name} className="chat-window__avatar" referrerPolicy="no-referrer" />
                <h2 className="chat-window__name">{selectedContact.name}</h2>
                <button className="chat-window__more" aria-label="More options" type="button">
                  <MoreHorizontal size={18} />
                </button>
              </div>

              <div className="chat-window__body" ref={messageBodyRef}>
                <div className="chat-divider"><span>Conversation</span></div>
                {loadingMessages && messages.length === 0 ? (
                  <p className="chat-window__empty">Đang tải tin nhắn...</p>
                ) : messages.length === 0 ? (
                  <p className="chat-window__empty">Chưa có tin nhắn. Hãy bắt đầu cuộc trò chuyện.</p>
                ) : (
                  messages.map((message) => (
                    message.from === 'me' ? (
                      <div className="chat-bubble-row chat-bubble-row--me" key={message.id}>
                        <span className="chat-bubble-row__time">{formatTime(message.createdAt)}</span>
                        <div className="chat-bubble chat-bubble--me">{message.text}</div>
                      </div>
                    ) : (
                      <div className="chat-bubble-row chat-bubble-row--them" key={message.id}>
                        <img src={selectedContact.avatar} alt={selectedContact.name} className="chat-bubble-row__avatar" referrerPolicy="no-referrer" />
                        <div className="chat-bubble-row__content">
                          <span className="chat-bubble-row__time">{formatTime(message.createdAt)}</span>
                          <div className="chat-bubble chat-bubble--them">{message.text}</div>
                        </div>
                      </div>
                    )
                  ))
                )}
              </div>

              <div className="chat-window__footer">
                <input
                  type="text"
                  placeholder="Type Your Message"
                  className="chat-window__input"
                  value={draft}
                  onChange={(event) => setDraft(event.target.value)}
                  onKeyDown={handleKeyDown}
                  disabled={sending}
                />
                <button className="chat-window__send" onClick={handleSend} type="button" disabled={sending || !draft.trim()}>
                  {sending ? 'Sending...' : 'Send'} <Send size={14} />
                </button>
              </div>
            </>
          ) : (
            <div className="chat-window__empty chat-window__empty--full">
              {error || 'Hãy kết bạn với một người để bắt đầu trò chuyện.'}
            </div>
          )}
        </section>
      </div>

      {error && selectedContact && <p className="message-tab__error">{error}</p>}
    </div>
  );
}
