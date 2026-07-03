import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './MyProfilePage.module.scss';
import { Link } from "react-router-dom";
import { API, fetchWithAuth, tokenStorage } from '../../config/api.js';


const MyProfilePage = () => {
  const [user, setUser] = useState(null);
  const [myCourses, setMyCourses] = useState([]);
  const [activeTab, setActiveTab] = useState('profile');
  const navigate = useNavigate();

  useEffect(() => {
    const stored = localStorage.getItem('loggedInUser');
    const at = tokenStorage.getAT();
    if (!stored || !at) { navigate('/signin'); return; }

    const loadProfile = async () => {
      try {
        // /account/myprofile trả thông tin cá nhân (Fname, Lname, Username, Email...)
        const profileRes = await fetchWithAuth(API.myprofile);
        if (!profileRes.ok) throw new Error('Không lấy được thông tin tài khoản');
        const profileResult = await profileRes.json();
        const merged = {
          ...profileResult.user,
          myCourses: (profileResult.courses || []).map(e => e.courseId),
        };
        setUser(merged);
        localStorage.setItem('loggedInUser', JSON.stringify(merged));

        
        const coursesRes = await fetchWithAuth(API.mycourses);
        if (coursesRes.ok) {
          const coursesResult = await coursesRes.json();
          setMyCourses(coursesResult.data || []);
        }
      } catch (err) {
        // Token hỏng / hết hạn cả AT lẫn RT → fetchWithAuth đã tự điều hướng về /signin
        const localUser = JSON.parse(stored);
        setUser(localUser);
      }
    };

    loadProfile();
  }, []);

  const handleSignOut = () => {
    tokenStorage.clear();
    window.dispatchEvent(new Event('userUpdated'));
    navigate('/');
  };

  if (!user) return <p className={styles.loading}>Đang tải...</p>;

  const initials = `${user.Fname?.[0] ?? ''}${user.Lname?.[0] ?? ''}`.toUpperCase();
  const totalHours = myCourses.reduce((s, c) => s + (c.hours ?? 0), 0);
  const totalLectures = myCourses.reduce((s, c) => s + (c.lectures ?? 0), 0);

  const categoryIcon = (cat) => {
    const map = {
      development: '💻', marketing: '📢', physics: '⚛️', astrology: '🔭',
      mathematics: '📐', design: '🎨', 'data-science': '📊', cloud: '☁️',
      database: '🗄️', hardware: '🖥️', languages: '🌐', engineering: '⚙️'
    };
    return map[cat] ?? '📚';
  };

  const tabs = [
    { key: 'profile', label: 'My profile', icon: 'user' },
    { key: 'courses', label: 'My courses', icon: 'book' },
  ];

  return (
    <div className={styles.page}>
      <div className={styles.container}>
        {/* ── Sidebar ── */}
        <aside className={styles.sidebar}>
          <div className={styles.avatarWrap}>
            <div className={styles.avatar}>{initials}</div>
            <p className={styles.fullName}>{user.Fname} {user.Lname}</p>
            <p className={styles.username}>@{user.Username}</p>
          </div>

          <div className={styles.divider} />

          <nav className={styles.nav}>
            {tabs.map(t => (
              <button
                key={t.key}
                className={`${styles.navItem} ${activeTab === t.key ? styles.navActive : ''}`}
                onClick={() => setActiveTab(t.key)}
              >
                <span className={styles.navIcon}>
                  {t.icon === 'user' ? (
                    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="8" r="4"/>
                      <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/>
                    </svg>
                  ) : (
                    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M4 4h16v16H4z"/>
                      <path d="M4 9h16M9 4v16"/>
                    </svg>
                  )}
                </span>
                {t.label}
              </button>
            ))}

            <div className={styles.divider} />

            <button className={`${styles.navItem} ${styles.navSignout}`} onClick={handleSignOut}>
              <span className={styles.navIcon}>
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                  <polyline points="16 17 21 12 16 7"/>
                  <line x1="21" y1="12" x2="9" y2="12"/>
                </svg>
              </span>
              Sign out
            </button>
          </nav>
        </aside>

        {/* ── Main ── */}
        <main className={styles.main}>
          {activeTab === 'profile' && (
            <>
              {/* Stats */}
              <div className={styles.statsRow}>
                <div className={styles.statCard}>
                  <span className={styles.statNum}>{myCourses.length}</span>
                  <span className={styles.statLabel}>Courses enrolled</span>
                </div>
                <div className={styles.statCard}>
                  <span className={styles.statNum}>{totalHours}h</span>
                  <span className={styles.statLabel}>Total hours</span>
                </div>
                <div className={styles.statCard}>
                  <span className={styles.statNum}>{totalLectures}</span>
                  <span className={styles.statLabel}>Total lectures</span>
                </div>
              </div>

              {/* Personal info */}
              <div className={styles.sectionCard}>
                <div className={styles.sectionHeader}>
                  <p className={styles.sectionTitle}>Personal information</p>
                </div>
                <div className={styles.infoGrid}>
                  {[
                    { label: 'First name', value: user.Fname },
                    { label: 'Last name', value: user.Lname },
                    { label: 'Username', value: user.Username },
                    { label: 'Email', value: user.Email },
                  ].map(f => (
                    <div key={f.label} className={styles.infoField}>
                      <span className={styles.infoLabel}>{f.label}</span>
                      <span className={styles.infoValue}>{f.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          {activeTab === 'courses' && (
            <div className={styles.sectionCard}>
              <p className={styles.sectionTitle}>My courses</p>

              {!myCourses.length ? (
                <p className={styles.empty}>Bạn chưa có khóa học nào.</p>
              ) : (
                <div className={styles.courseList}>
                  {myCourses.map(course => (
                    <Link
                      key={course._id || course.id}
                      to={`/mycoursespage/${course._id || course.id}`}
                      state={{ course }}
                      className={styles.courseLink}
                    >
                      <div className={styles.courseRow}>
                        <div className={styles.courseThumb}>
                          {categoryIcon(course.category)}
                        </div>
                        <div className={styles.courseInfo}>
                          <p className={styles.courseTitle}>{course.title}</p>
                          <p className={styles.courseMeta}>
                            {course.author} · {course.hours}h · {course.lectures} lectures
                          </p>
                        </div>
                        <span className={`${styles.badge} ${styles[`badge_${course.category}`] ?? styles.badgeDefault}`}>
                          {course.level}
                        </span>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default MyProfilePage;