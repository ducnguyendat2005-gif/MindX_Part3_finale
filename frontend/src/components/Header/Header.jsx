import React from 'react';
import styles from './Header.module.scss';

import logo from '../../assets/logo (1).png';
import searchIcon from '../../assets/search-icon.png';
import cartIcon from '../../assets/Frame 427318762.png';
import { useNavigate } from 'react-router-dom';
import { useState, useEffect, useRef } from 'react';
import { Link } from "react-router-dom";
import { API } from '../../config/api.js';
import ThemeToggleButton from './ThemeToggleButton';

function Header() {
  const navigate = useNavigate();

  // Categories dropdown
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Search
  const [query, setQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [showSearch, setShowSearch] = useState(false);
  const searchRef = useRef(null);

  // Data
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // User
  const [user, setUser] = useState(null);
  const [profileOpen, setProfileOpen] = useState(false);
  const profileRef = useRef(null);

  // Fetch courses
    useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const res = await fetch(API.courses);
        if (!res.ok) throw new Error(`Lỗi: ${res.status}`);
        const result = await res.json();
        setProducts(result.data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Lấy user từ localStorage
  // Lấy user từ localStorage
    useEffect(() => {
      const loadUser = () => {
        const stored = localStorage.getItem('loggedInUser');
        setUser(stored ? JSON.parse(stored) : null);
      };

      loadUser();
      window.addEventListener('userUpdated', loadUser);
      return () => window.removeEventListener('userUpdated', loadUser);
    }, []);

  // Click outside để đóng tất cả dropdown
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setOpen(false);
      }
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setShowSearch(false);
      }
      if (profileRef.current && !profileRef.current.contains(e.target)) {
        setProfileOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Search filter
  useEffect(() => {
    if (query.trim() === '') {
      setSearchResults([]);
      setShowSearch(false);
      return;
    }
    const lower = query.toLowerCase();
    const filtered = products.filter((c) =>
      c.title.toLowerCase().includes(lower)
    );
    setSearchResults(filtered);
    setShowSearch(true);
  }, [query, products]);

  const handleLogout = () => {
    localStorage.removeItem('loggedInUser');
    setUser(null);
    setProfileOpen(false);
    navigate('/home');
  };

  // Lấy chữ cái đầu của tên để hiện trong avatar
  const getInitial = (name) => {
    if (!name) return '?';
    return name.charAt(0).toUpperCase();
  };

  const renderStars = (rating) => {
    return '★'.repeat(Math.round(rating)) + '☆'.repeat(5 - Math.round(rating));
  };
  const [cart, setCart] = useState([]);

  useEffect(() => {
    const syncCart = () => {
      setCart(JSON.parse(localStorage.getItem('insideCarts') || '[]'));
    };
    syncCart();
    window.addEventListener('storage', syncCart);
    window.addEventListener('cartUpdated', syncCart);
    return () => {
      window.removeEventListener('storage', syncCart);
      window.removeEventListener('cartUpdated', syncCart);
    };
  }, []);

  return (
    <header className={styles.header}>
      <div className={styles.headStart}>
        <div className={styles.logo} onClick={() => navigate('/home')}>
          <img src={logo} alt="Byway logo" />
          <span>Byway</span>
        </div>

        <div className={styles.categoriesWrapper} ref={dropdownRef}>
          <button
            className={`${styles.categoriesBtn} ${open ? styles.active : ''}`}
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            aria-haspopup="true"
          >
            Categories
            <svg
              className={`${styles.chevron} ${open ? styles.chevronUp : ''}`}
              width="14" height="14" viewBox="0 0 14 14" fill="none"
            >
              <path d="M3 5L7 9L11 5" stroke="currentColor" strokeWidth="1.8"
                strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>

          {open && (
            <div className={styles.dropdown}>
              {!user && <button onClick={() => navigate('/signin')} className={styles.dropdownItem}>Sign In</button>}
              {!user && <button onClick={() => navigate('/signup')} className={styles.dropdownItem}>Sign Up</button>}
              <button onClick={() => navigate('/course-page')} className={styles.dropdownItem}>All Courses</button>
              {user && <button onClick={() => navigate('/home/cartpage')} className={styles.dropdownItem}>My Cart</button>}
              {user && <button onClick={() => navigate('/mycoursespage')} className={styles.dropdownItem}>My Course</button>}
            </div>
          )}
        </div>

        {/* Search */}
        <div className={styles.searchWrapper} ref={searchRef}>
          <div className={styles.searchContainer}>
            <img src={searchIcon} alt="search" />
            <input
              type="text"
              className={styles.searchBox}
              placeholder={loading ? 'Đang tải...' : 'Search courses'}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onFocus={() => { if (searchResults.length > 0) setShowSearch(true); }}
              disabled={loading}
            />
            {query && (
              <button className={styles.clearBtn}
                onClick={() => { setQuery(''); setShowSearch(false); }}>
                ✕
              </button>
            )}
          </div>

          {showSearch && (
            <div className={styles.searchDropdown}>
              {error ? (
                <div className={styles.noResult}>Error! {error}</div>
              ) : searchResults.length === 0 ? (
                <div className={styles.noResult}>No Course can be found</div>
              ) : (
                searchResults.map((course) => (
                  <Link
                    key={course._id}
                    to={`/home/course-page/${course._id}`}
                    style={{ textDecoration: 'none', color: 'inherit' }}
                    onClick={() => { setQuery(''); setShowSearch(false); }}
                  >
                    <div className={styles.searchItem}>
                      <div className={styles.searchItemInfo}>
                        <p className={styles.searchItemTitle}>{course.title}</p>
                        <p className={styles.searchItemMeta}>
                          {course.instructorId?.name} · <span className={styles.searchItemCat}>{course.category}</span>
                        </p>
                      </div>
                      <div className={styles.searchItemRight}>
                        <span className={styles.searchItemStars}>{renderStars(course.rating)}</span>
                        <span className={styles.searchItemPrice}>${course.price}</span>
                      </div>
                    </div>
                  </Link>
                ))
              )}
            </div>
          )}
        </div>

        <p>Teach on Byway</p>
      </div>

      {/* FuncBar */}
      <div className={styles.funcBar}>
        {/* Wishlist */}
        {user && (
          <>
            {/* Wishlist */}
            <button className={styles.iconBtn} onClick={() => navigate('/wishlist')}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
              </svg>
            </button>

            {/* Cart */}
            <div className={styles.iconncount}>
            <button className={styles.iconBtn} onClick={() => navigate('/home/cartpage')}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="9" cy="21" r="1" /><circle cx="20" cy="21" r="1" />
                <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
              </svg>
            </button>
            {cart.length > 0 && 
            <div className={styles.counter}>
              <p>{cart.length}</p>
            </div>}
            </div>

            {/* Notification */}
            <button className={styles.iconBtn}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                <path d="M13.73 21a2 2 0 0 1-3.46 0" />
              </svg>
            </button>
          </>
        )}

        <ThemeToggleButton />

        {/* Avatar / Login */}
        {user ? (
          <div className={styles.profileWrapper} ref={profileRef}>
            <button
              className={styles.avatarBtn}
              onClick={() => setProfileOpen((v) => !v)}
            >
              {getInitial(user.Fname)}
            </button>

            {profileOpen && (
              <div className={styles.profileDropdown}>
                <div className={styles.profileHeader}>
                  <div className={styles.profileAvatar}>{getInitial(user.Fname)}</div>
                  <div>
                    <p className={styles.profileName}>{user.Username}</p>
                    <p className={styles.profileEmail}>{user.Email}</p>
                  </div>
                </div>
                <div className={styles.profileDivider} />
                <button className={styles.profileItem} onClick={() => { navigate('/myprofile'); setProfileOpen(false); }}>
                  👤 My Profile
                </button>
                <button className={styles.profileItem} onClick={() => { navigate('/mycoursespage'); setProfileOpen(false); }}>
                  📚 My Courses
                </button>
                <button className={styles.profileItem} onClick={() => { navigate('/home/cartpage'); setProfileOpen(false); }}>
                  🛒 My Cart
                </button>
                <div className={styles.profileDivider} />
                <button className={`${styles.profileItem} ${styles.logoutItem}`} onClick={handleLogout}>
                  🚪 Log Out
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className={styles.buttonContainer}>
            <button onClick={() => navigate('/signin')} className={styles.loginBtn}>Log In</button>
            <button onClick={() => navigate('/signup')} className={styles.signupBtn}>Sign Up</button>
          </div>
        )}
      </div>
    </header>
  );
}

export default Header;