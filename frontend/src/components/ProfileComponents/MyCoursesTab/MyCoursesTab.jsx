import React, { useState, useEffect, useRef } from 'react';
import { Search, Filter, ChevronDown, Star, ChevronLeft, ChevronRight, X } from 'lucide-react';
import { Link } from "react-router-dom";
import { API, fetchWithAuth } from '../../../config/api.js';
import './MyCoursesTab.scss';

const img = "https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&q=80&w=400";

export default function MyCoursesTab({ myCourses }) {
  const [course, setCourse] = useState(myCourses || []);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const storedUser = JSON.parse(localStorage.getItem('loggedInUser') || '{}');
  const isTeacher = storedUser.role === 'teacher';

  // --- Filter states ---
  const [searchText, setSearchText] = useState('');
  const [sortBy, setSortBy] = useState('relevance');
  const [showSortMenu, setShowSortMenu] = useState(false);
  const [showFilterMenu, setShowFilterMenu] = useState(false);
  const [filterCategory, setFilterCategory] = useState('');
  const [filterLevel, setFilterLevel] = useState('');
  // Chỉ dùng cho giáo viên: 'published' | 'draft'
  const [filterStatus, setFilterStatus] = useState('published');

  const filterRef = useRef(null);
  const sortRef = useRef(null);

  useEffect(() => {
    if (Array.isArray(myCourses)) {
      setCourse(myCourses);
      setLoading(false);
      setError(null);
      return;
    }

    const fetchMyCourses = async () => {
      try {
        setLoading(true);
        const endpoint = isTeacher
          ? API.teachingCourses
          : API.mycourses;
        const res = await fetchWithAuth(endpoint);
        if (!res.ok) throw new Error(`Lỗi: ${res.status}`);
        const result = await res.json();
        setCourse(result.data || []);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchMyCourses();
  }, [myCourses]);

  // Đóng dropdown khi click ra ngoài
  useEffect(() => {
    const handler = (e) => {
      if (filterRef.current && !filterRef.current.contains(e.target)) setShowFilterMenu(false);
      if (sortRef.current && !sortRef.current.contains(e.target)) setShowSortMenu(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // --- Derived: filtered + sorted ---
  const displayedCourses = course
    .filter(c => {
      const matchSearch = !searchText ||
        c.title?.toLowerCase().includes(searchText.toLowerCase()) ||
        c.author?.toLowerCase().includes(searchText.toLowerCase());

      if (isTeacher) {
        // Giáo viên: lọc theo status thay vì category/level
        const matchStatus = (c.status || 'published') === filterStatus;
        return matchSearch && matchStatus;
      }

      const matchCategory = !filterCategory || c.category === filterCategory;
      const matchLevel = !filterLevel || c.level === filterLevel;
      return matchSearch && matchCategory && matchLevel;
    })
    .sort((a, b) => {
      if (sortBy === 'rating') return (b.rating || 0) - (a.rating || 0);
      if (sortBy === 'price_asc') return (a.price || 0) - (b.price || 0);
      if (sortBy === 'price_desc') return (b.price || 0) - (a.price || 0);
      return 0; // relevance
    });

  const sortLabels = {
    relevance: 'Relevance',
    rating: 'Highest Rated',
    price_asc: 'Price: Low to High',
    price_desc: 'Price: High to Low',
  };

  const categories = [...new Set(course.map(c => c.category).filter(Boolean))];
  const levels = [...new Set(course.map(c => c.level).filter(Boolean))];

  const activeFilterCount = isTeacher
    ? 0 // luôn có 1 trạng thái được chọn, không tính là "filter đang bật"
    : [filterCategory, filterLevel].filter(Boolean).length;

  const statusLabels = {
    published: 'Your Courses',
    draft: 'Draft Courses',
  };

  if (loading) return <p style={{ padding: 24 }}>Đang tải...</p>;
  if (error) return <p style={{ padding: 24, color: 'red' }}>Lỗi: {error}</p>;

  return (
    <div className="my-courses-tab">
      <div className="courses-header">
        <h1 className="courses-header__title">
          Courses <span className="courses-header__count">({displayedCourses.length})</span>
        </h1>

        <div className="courses-header__controls">
          {/* Search */}
          <div className="search-box">
            <input
              type="text"
              placeholder="Search User"
              className="search-box__input"
              value={searchText}
              onChange={e => setSearchText(e.target.value)}
            />
            <Search className="search-box__icon" />
          </div>

          {/* Sort */}
          <div className="sort-control" ref={sortRef} style={{ position: 'relative' }}>
            <span className="sort-control__label">Sort By</span>
            <button className="sort-control__btn" onClick={() => setShowSortMenu(v => !v)}>
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

          {/* Filter */}
          <div ref={filterRef} style={{ position: 'relative' }}>
            <button className="filter-btn" onClick={() => setShowFilterMenu(v => !v)}>
              <Filter className="filter-btn__icon" />
              {isTeacher ? statusLabels[filterStatus] : 'Filter'}
              {activeFilterCount > 0 && (
                <span className="filter-badge">{activeFilterCount}</span>
              )}
            </button>
            {showFilterMenu && (
              <div className="dropdown-menu dropdown-menu--filter">
                {isTeacher ? (
                  <div className="dropdown-menu__section">
                    <p className="dropdown-menu__section-title">Status</p>
                    {Object.entries(statusLabels).map(([key, label]) => (
                      <button
                        key={key}
                        className={`dropdown-menu__item ${filterStatus === key ? 'dropdown-menu__item--active' : ''}`}
                        onClick={() => { setFilterStatus(key); setShowFilterMenu(false); }}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                ) : (
                  <>
                    <div className="dropdown-menu__section">
                      <p className="dropdown-menu__section-title">Category</p>
                      <button
                        className={`dropdown-menu__item ${!filterCategory ? 'dropdown-menu__item--active' : ''}`}
                        onClick={() => setFilterCategory('')}
                      >All</button>
                      {categories.map(cat => (
                        <button
                          key={cat}
                          className={`dropdown-menu__item ${filterCategory === cat ? 'dropdown-menu__item--active' : ''}`}
                          onClick={() => setFilterCategory(cat)}
                        >
                          {cat.charAt(0).toUpperCase() + cat.slice(1)}
                        </button>
                      ))}
                    </div>
                    <div className="dropdown-menu__section">
                      <p className="dropdown-menu__section-title">Level</p>
                      <button
                        className={`dropdown-menu__item ${!filterLevel ? 'dropdown-menu__item--active' : ''}`}
                        onClick={() => setFilterLevel('')}
                      >All</button>
                      {levels.map(lv => (
                        <button
                          key={lv}
                          className={`dropdown-menu__item ${filterLevel === lv ? 'dropdown-menu__item--active' : ''}`}
                          onClick={() => setFilterLevel(lv)}
                        >
                          {lv}
                        </button>
                      ))}
                    </div>
                    {activeFilterCount > 0 && (
                      <button
                        className="dropdown-menu__clear"
                        onClick={() => { setFilterCategory(''); setFilterLevel(''); }}
                      >
                        <X size={12} /> Clear all
                      </button>
                    )}
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Course Grid */}
      <div className="course-grid">
        {displayedCourses.length === 0 ? (
          <p style={{ color: '#94a3b8', gridColumn: '1/-1' }}>No courses found.</p>
        ) : (
          displayedCourses.map((data) => (
            <Link
              key={data._id || data.id}
              to={`/mycoursespage/${data._id || data.id}`}
              state={{ course: data }}
            >
              <div className="course-card">
                <div className="course-card__thumbnail">
                  <img src={img} alt={data.title} className="course-card__image" referrerPolicy="no-referrer" />
                </div>
                <div className="course-card__body">
                  <h3 className="course-card__title">{data.title}</h3>
                  <p className="course-card__instructor">By {data.author}</p>
                  <div className="course-card__rating">
                    {[...Array(5)].map((_, i) => {
                      const full = i < Math.floor(data.rating);
                      const half = !full && i + 0.5 <= data.rating;
                      return (
                        <span key={i} style={{ position: 'relative', display: 'inline-block' }}>
                          <Star size={14} fill="#D1D5DB" stroke="#D1D5DB" />
                          {(full || half) && (
                            <span style={{ position: 'absolute', top: 0, left: 0, width: full ? '100%' : '50%', overflow: 'hidden', display: 'inline-block' }}>
                              <Star size={14} fill="#FBBF24" stroke="#FBBF24" />
                            </span>
                          )}
                        </span>
                      );
                    })}
                    <span className="course-card__reviews">({data.reviews} Ratings)</span>
                  </div>
                </div>
              </div>
            </Link>
          ))
        )}
      </div>

      {/* Pagination */}
      <div className="pagination">
        <button className="pagination__arrow"><ChevronLeft className="pagination__arrow-icon" /></button>
        <button className="pagination__page pagination__page--active">1</button>
        <button className="pagination__page">2</button>
        <button className="pagination__page">3</button>
        <button className="pagination__arrow"><ChevronRight className="pagination__arrow-icon" /></button>
      </div>
    </div>
  );
}