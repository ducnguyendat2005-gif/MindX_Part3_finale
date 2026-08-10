import React, { useState, useRef, useEffect } from 'react';
import { Search, Filter, ChevronDown, Mail, ChevronLeft, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import './TeachersTab.scss';

const teacherImg = "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&q=80&w=400";

export default function TeachersTab() {
  const navigate = useNavigate();

  const [teachers] = useState(
    Array.from({ length: 8 }, (_, i) => ({
      id: i + 1,
      name: 'Ronald Richards',
      title: 'UI/UX Designer',
      avatar: teacherImg,
    }))
  );

  const [searchText, setSearchText] = useState('');
  const [sortBy, setSortBy] = useState('relevance');
  const [showSortMenu, setShowSortMenu] = useState(false);
  const [showFilterMenu, setShowFilterMenu] = useState(false);
  const [page, setPage] = useState(1);
  const totalPages = 3;

  const sortRef = useRef(null);
  const filterRef = useRef(null);

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

  const displayedTeachers = teachers.filter(
    (t) => !searchText || t.name.toLowerCase().includes(searchText.toLowerCase())
  );

  return (
    <div className="teachers-tab">
      <div className="teachers-header">
        <h1 className="teachers-header__title">
          Teachers <span className="teachers-header__count">({displayedTeachers.length})</span>
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
        {displayedTeachers.length === 0 ? (
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
                <button
                  className="teacher-card__btn"
                  onClick={() => navigate('/message', { state: { teacher: { name: t.name, avatar: t.avatar } } })}
                >
                  Send Message <Mail size={14} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Pagination */}
      <div className="pagination">
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
      </div>
    </div>
  );
}