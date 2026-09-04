import React, { useState, useRef, useEffect } from 'react';
import { Search, Filter, ChevronDown, Mail, UserPlus, ChevronLeft, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { API, fetchWithAuth } from '../../../config/api.js';
import useFriendStatuses, { FRIEND_STATUS_EVENT } from '../../../hooks/useFriendStatuses.js';
import './TeachersTab.scss';

const PAGE_SIZE = 6;

export default function TeachersTab() {
  const navigate = useNavigate();

  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');

  const [searchText, setSearchText] = useState('');
  const [sortBy, setSortBy] = useState('relevance');
  const [showSortMenu, setShowSortMenu] = useState(false);
  const [showFilterMenu, setShowFilterMenu] = useState(false);
  const [page, setPage] = useState(1);
  const [friendActionId, setFriendActionId] = useState(null);
  const { friendStatuses, setFriendStatuses, loadingFriendStatuses } = useFriendStatuses();

  const sortRef = useRef(null);
  const filterRef = useRef(null);

  useEffect(() => {
    let isCurrent = true;

    const loadTeachers = async () => {
      try {
        const res = await fetchWithAuth(API.teachers);
        const result = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(result.message || 'Unable to load teachers');
        if (isCurrent) setTeachers(result.data || []);
      } catch (error) {
        if (isCurrent) setLoadError(error.message || 'Unable to load teachers');
      } finally {
        if (isCurrent) setLoading(false);
      }
    };

    loadTeachers();
    return () => { isCurrent = false; };
  }, []);

  const sortLabels = {
    relevance: 'Relevance',
    name_asc: 'Name: A to Z',
    name_desc: 'Name: Z to A',
  };

  useEffect(() => {
    const handler = (e) => {
      if (sortRef.current && !sortRef.current.contains(e.target)) setShowSortMenu(false);
      if (filterRef.current && !filterRef.current.contains(e.target)) setShowFilterMenu(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const filteredTeachers = teachers.filter(
    (t) => !searchText || t.name.toLowerCase().includes(searchText.toLowerCase())
  );
  const sortedTeachers = [...filteredTeachers].sort((a, b) => {
    if (sortBy === 'relevance') {
      const aIsFriend = friendStatuses[String(a.accountId || a.id)]?.status === 'accepted';
      const bIsFriend = friendStatuses[String(b.accountId || b.id)]?.status === 'accepted';
      if (aIsFriend !== bIsFriend) return aIsFriend ? -1 : 1;
    }
    if (sortBy === 'name_asc') return a.name.localeCompare(b.name);
    if (sortBy === 'name_desc') return b.name.localeCompare(a.name);
    return 0;
  });
  const totalPages = Math.max(1, Math.ceil(sortedTeachers.length / PAGE_SIZE));
  const displayedTeachers = sortedTeachers.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  useEffect(() => {
    setPage(1);
  }, [searchText, sortBy]);

  const handleAddFriend = async (teacher) => {
    const recipientId = String(teacher.accountId || teacher.id);
    if (!window.confirm('Có chấp nhận add friend không?')) return;

    setFriendActionId(recipientId);
    try {
      const res = await fetchWithAuth(API.sendFriendRequest, {
        method: 'POST',
        body: JSON.stringify({ recipientId }),
      });
      const result = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(result.message || 'Không thể gửi lời mời kết bạn');

      setFriendStatuses((current) => ({
        ...current,
        [recipientId]: { userId: recipientId, status: 'pending' },
      }));
      window.dispatchEvent(new Event(FRIEND_STATUS_EVENT));
    } catch (error) {
      window.alert(error.message || 'Không thể gửi lời mời kết bạn');
    } finally {
      setFriendActionId(null);
    }
  };

  return (
    <div className="teachers-tab">
      <div className="teachers-header">
        <h1 className="teachers-header__title">
          Teachers <span className="teachers-header__count">({filteredTeachers.length})</span>
        </h1>

        <div className="teachers-header__controls">
          <div className="search-box">
            <input
              type="text"
              placeholder="Search User"
              className="search-box__input"
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
            />
            <Search className="search-box__icon" />
          </div>

          <div className="sort-control" ref={sortRef} style={{ position: 'relative' }}>
            <span className="sort-control__label">Sort By</span>
            <button className="sort-control__btn" onClick={() => setShowSortMenu((v) => !v)}>
              {sortLabels[sortBy]} <ChevronDown className="sort-control__icon" />
            </button>
            {showSortMenu && (
              <div className="dropdown-menu">
                {Object.entries(sortLabels).map(([key, label]) => (
                  <button
                    key={key}
                    className={`dropdown-menu__item ${sortBy === key ? 'dropdown-menu__item--active' : ''}`}
                    onClick={() => { setSortBy(key); setShowSortMenu(false); }}
                  >
                    {label}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div ref={filterRef} style={{ position: 'relative' }}>
            <button className="filter-btn" onClick={() => setShowFilterMenu((v) => !v)}>
              <Filter className="filter-btn__icon" />
              Filter
            </button>
            {showFilterMenu && (
              <div className="dropdown-menu dropdown-menu--filter">
                <div className="dropdown-menu__section">
                  <p className="dropdown-menu__section-title">Coming soon</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Teacher Grid */}
      <div className="teacher-grid">
        {loading ? (
          <p style={{ color: '#94a3b8', gridColumn: '1/-1' }}>Loading teachers...</p>
        ) : loadError ? (
          <p style={{ color: '#f87171', gridColumn: '1/-1' }}>{loadError}</p>
        ) : filteredTeachers.length === 0 ? (
          <p style={{ color: '#94a3b8', gridColumn: '1/-1' }}>No teachers found.</p>
        ) : (
          displayedTeachers.map((t) => (
            <div className="teacher-card" key={t.id}>
              <div className="teacher-card__thumbnail">
                <img src={t.avatar} alt={t.name} className="teacher-card__image" referrerPolicy="no-referrer" />
              </div>
              <div className="teacher-card__body">
                <h3 className="teacher-card__name">{t.name}</h3>
                <p className="teacher-card__title">{t.title}</p>
                {(() => {
                  const targetId = String(t.accountId || t.id);
                  const status = friendStatuses[targetId]?.status;

                  if (status === 'accepted') {
                    return (
                      <button
                        className="teacher-card__btn"
                        onClick={() => navigate('/profile', { state: { tab: 'message', teacher: { name: t.name, avatar: t.avatar, accountId: t.accountId } } })}
                      >
                        Send Message <Mail size={14} />
                      </button>
                    );
                  }

                  return (
                    <button
                      className="teacher-card__btn"
                      disabled={loadingFriendStatuses || friendActionId === targetId || status === 'pending' || status === 'incoming'}
                      onClick={() => handleAddFriend(t)}
                    >
                      {loadingFriendStatuses ? 'Loading...' : friendActionId === targetId ? 'Đang gửi...' : status === 'incoming' ? 'Chờ bạn phản hồi' : status === 'pending' ? 'Chờ phản hồi' : 'Add Friend'}
                      {status !== 'pending' && status !== 'incoming' && <UserPlus size={14} />}
                    </button>
                  );
                })()}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Pagination */}
      {!loading && !loadError && totalPages > 1 && <div className="pagination">
        <button
          className="pagination__arrow"
          onClick={() => setPage((p) => Math.max(1, p - 1))}
          disabled={page === 1}
        >
          <ChevronLeft className="pagination__arrow-icon" />
        </button>
        {[...Array(totalPages)].map((_, i) => {
          const n = i + 1;
          return (
            <button
              key={n}
              className={`pagination__page ${page === n ? 'pagination__page--active' : ''}`}
              onClick={() => setPage(n)}
            >
              {n}
            </button>
          );
        })}
        <button
          className="pagination__arrow"
          onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
          disabled={page === totalPages}
        >
          <ChevronRight className="pagination__arrow-icon" />
        </button>
      </div>}
    </div>
  );
}
