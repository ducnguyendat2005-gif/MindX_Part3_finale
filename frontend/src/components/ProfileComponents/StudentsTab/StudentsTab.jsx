import React, { useEffect, useRef, useState } from 'react';
import { ChevronDown, ChevronLeft, ChevronRight, Filter, Mail, UserPlus, Search } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { API, fetchWithAuth } from '../../../config/api.js';
import useFriendStatuses, { FRIEND_STATUS_EVENT } from '../../../hooks/useFriendStatuses.js';
import '../TeacherTab/TeachersTab.scss';

const PAGE_SIZE = 6;

export default function StudentsTab() {
  const navigate = useNavigate();
  const [students, setStudents] = useState([]);
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

  const sortLabels = {
    relevance: 'Relevance',
    name_asc: 'Name: A to Z',
    name_desc: 'Name: Z to A',
  };

  useEffect(() => {
    let isCurrent = true;

    const loadStudents = async () => {
      try {
        const res = await fetchWithAuth(API.students);
        const result = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(result.message || 'Unable to load students');
        if (isCurrent) setStudents(result.data || []);
      } catch (error) {
        if (isCurrent) setLoadError(error.message || 'Unable to load students');
      } finally {
        if (isCurrent) setLoading(false);
      }
    };

    loadStudents();
    return () => { isCurrent = false; };
  }, []);

  useEffect(() => {
    const handleOutsideClick = (event) => {
      if (sortRef.current && !sortRef.current.contains(event.target)) setShowSortMenu(false);
      if (filterRef.current && !filterRef.current.contains(event.target)) setShowFilterMenu(false);
    };

    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  const filteredStudents = students.filter(
    (student) => !searchText || student.name.toLowerCase().includes(searchText.toLowerCase())
  );
  const sortedStudents = [...filteredStudents].sort((first, second) => {
    if (sortBy === 'relevance') {
      const firstIsFriend = friendStatuses[String(first.accountId || first.id)]?.status === 'accepted';
      const secondIsFriend = friendStatuses[String(second.accountId || second.id)]?.status === 'accepted';
      if (firstIsFriend !== secondIsFriend) return firstIsFriend ? -1 : 1;
    }
    if (sortBy === 'name_asc') return first.name.localeCompare(second.name);
    if (sortBy === 'name_desc') return second.name.localeCompare(first.name);
    return 0;
  });
  const totalPages = Math.max(1, Math.ceil(sortedStudents.length / PAGE_SIZE));
  const displayedStudents = sortedStudents.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  useEffect(() => {
    setPage(1);
  }, [searchText, sortBy]);

  const handleAddFriend = async (student) => {
    const recipientId = String(student.accountId || student.id);
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
          Students <span className="teachers-header__count">({filteredStudents.length})</span>
        </h1>

        <div className="teachers-header__controls">
          <div className="search-box">
            <input
              type="text"
              placeholder="Search User"
              className="search-box__input"
              value={searchText}
              onChange={(event) => setSearchText(event.target.value)}
            />
            <Search className="search-box__icon" />
          </div>

          <div className="sort-control" ref={sortRef} style={{ position: 'relative' }}>
            <span className="sort-control__label">Sort By</span>
            <button type="button" className="sort-control__btn" onClick={() => setShowSortMenu((value) => !value)}>
              {sortLabels[sortBy]} <ChevronDown className="sort-control__icon" />
            </button>
            {showSortMenu && (
              <div className="dropdown-menu">
                {Object.entries(sortLabels).map(([key, label]) => (
                  <button
                    type="button"
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
            <button type="button" className="filter-btn" onClick={() => setShowFilterMenu((value) => !value)}>
              <Filter className="filter-btn__icon" />
              Filter
            </button>
            {showFilterMenu && (
              <div className="dropdown-menu dropdown-menu--filter">
                <p className="dropdown-menu__section-title">Coming soon</p>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="teacher-grid">
        {loading ? (
          <p style={{ color: '#94a3b8', gridColumn: '1/-1' }}>Loading students...</p>
        ) : loadError ? (
          <p style={{ color: '#f87171', gridColumn: '1/-1' }}>{loadError}</p>
        ) : filteredStudents.length === 0 ? (
          <p style={{ color: '#94a3b8', gridColumn: '1/-1' }}>No students found.</p>
        ) : (
          displayedStudents.map((student) => (
            <div className="teacher-card" key={student.id}>
              <div className="teacher-card__thumbnail">
                <img src={student.avatar} alt={student.name} className="teacher-card__image" referrerPolicy="no-referrer" />
              </div>
              <div className="teacher-card__body">
                <h3 className="teacher-card__name">{student.name}</h3>
                <p className="teacher-card__title">{student.title}</p>
                {(() => {
                  const targetId = String(student.accountId || student.id);
                  const status = friendStatuses[targetId]?.status;

                  if (status === 'accepted') {
                    return (
                      <button
                        type="button"
                        className="teacher-card__btn"
                        onClick={() => navigate('/profile', { state: { tab: 'message', teacher: { name: student.name, avatar: student.avatar, accountId: student.accountId } } })}
                      >
                        Send Message <Mail size={14} />
                      </button>
                    );
                  }

                  return (
                    <button
                      type="button"
                      className="teacher-card__btn"
                      disabled={loadingFriendStatuses || friendActionId === targetId || status === 'pending' || status === 'incoming'}
                      onClick={() => handleAddFriend(student)}
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

      {!loading && !loadError && totalPages > 1 && (
        <div className="pagination">
          <button type="button" className="pagination__arrow" onClick={() => setPage((value) => Math.max(1, value - 1))} disabled={page === 1}>
            <ChevronLeft className="pagination__arrow-icon" />
          </button>
          {[...Array(totalPages)].map((_, index) => {
            const number = index + 1;
            return (
              <button
                type="button"
                key={number}
                className={`pagination__page ${page === number ? 'pagination__page--active' : ''}`}
                onClick={() => setPage(number)}
              >
                {number}
              </button>
            );
          })}
          <button type="button" className="pagination__arrow" onClick={() => setPage((value) => Math.min(totalPages, value + 1))} disabled={page === totalPages}>
            <ChevronRight className="pagination__arrow-icon" />
          </button>
        </div>
      )}
    </div>
  );
}
