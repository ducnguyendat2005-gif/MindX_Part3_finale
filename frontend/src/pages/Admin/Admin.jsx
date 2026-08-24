import { useState, useMemo, useEffect } from 'react';
import { API, fetchWithAuth } from '../../config/api.js'; // chỉnh lại đường dẫn cho đúng vị trí file api.js trong project của bạn
import { useTheme } from '../../context/ThemeContext.jsx';
import { useIsMobile } from '../../hooks/use-mobile.jsx';
import './Admin.scss';


const INSTRUCTORS = [
  { id: '1', name: 'Ronald Richards', role: 'UI/UX Designer', rating: 4.9, students: 2400 },
  { id: '2', name: 'Sarah Johnson', role: 'Frontend Developer', rating: 4.8, students: 1800 },
  { id: '3', name: 'Michael Chen', role: 'Fullstack Developer', rating: 4.7, students: 2100 },
  { id: '4', name: 'Emily Davis', role: 'Graphic Designer', rating: 4.9, students: 1500 },
  { id: '5', name: 'David Wilson', role: 'Product Designer', rating: 4.6, students: 1700 },
];

const PALETTE = [
  ['#EEF5FF', '#1947D6'], ['#FFF3E6', '#C2540A'], ['#EAF8EE', '#19874A'],
  ['#FCEFFB', '#A21CAF'], ['#FEF1F1', '#C0263A'], ['#EFF0FE', '#4338CA'], ['#EAFBF7', '#0F766E'],
];
function colorFor(seed) {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  return PALETTE[h % PALETTE.length];
}
function initials(name) {
}
function fmtMoney(n) {
  if (n == null) return '$0';
}
function categoryLabel(cat) {
  return (cat || '').split('-').map((w) => w[0]?.toUpperCase() + w.slice(1)).join(' ');
}
function levelLabel(level) {
  const normalized = (level || '').trim().toLowerCase();
  const labels = {
    'người mới bắt đầu': 'Beginner',
    'nguoi moi bat dau': 'Beginner',
    beginner: 'Beginner',
    'trung cấp': 'Intermediate',
    'trung cap': 'Intermediate',
    intermediate: 'Intermediate',
    'nâng cao': 'Advanced',
    'nang cao': 'Advanced',
    advanced: 'Advanced',
    'chuyên gia': 'Expert',
    'chuyen gia': 'Expert',
    expert: 'Expert',
  };
  return labels[normalized] || level || 'Unknown';
}

function Avatar({ name, size = 40, rounded = '9999px' }) {
  const [bg, fg] = colorFor(name || '?');
  return (
    <div style={{
      width: size, height: size, minWidth: size, borderRadius: rounded, background: bg, color: fg,
      display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 500, fontSize: size * 0.38,
    }}>
      {initials(name) || '?'}
    </div>
  );
}

function Star({ size = 13, fill = '#f59e0b' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={fill}>
      <path d="M12 2l2.9 6.6 7.1.6-5.4 4.7 1.6 7-6.2-3.8L5.8 21l1.6-7L2 9.2l7.1-.6L12 2z" />
    </svg>
  );
}

const NAV = [
  { key: 'overview', label: 'Overview' },
  { key: 'courses', label: 'Courses' },
  { key: 'approvals', label: 'Course Approvals' },
  { key: 'instructors', label: 'Instructors' },
  { key: 'accounts', label: 'Accounts' },
  { key: 'testimonials', label: 'Testimonials' },
];

const LEVEL_BG = {
  Beginner: '#EAF8EE', Intermediate: '#FFF3E6', Advanced: '#FEF1F1', Expert: '#FCEFFB',
};
const LEVEL_FG = {
  Beginner: '#19874A', Intermediate: '#C2540A', Advanced: '#C0263A', Expert: '#A21CAF',
};

function StatCard({ label, value, accentBg, accentFg, icon }) {
  return (
    <div className="admin-surface" style={{ background: '#fff', borderRadius: 16, border: '1px solid #eef1f7', boxShadow: '0 1px 2px rgba(13,19,33,0.04), 0 8px 24px -12px rgba(13,19,33,0.1)', padding: 20 }}>
      <div style={{ width: 40, height: 40, borderRadius: 12, background: accentBg, color: accentFg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, marginBottom: 14 }}>
        {icon}
      </div>
      <p style={{ fontSize: 24, fontWeight: 700, margin: 0, color: '#0d1321' }}>{value}</p>
      <p style={{ fontSize: 13, color: '#5c6884', margin: '2px 0 0' }}>{label}</p>
    </div>
  );
}

function Overview({ courses, accounts, testimonials,instructors, onSelectCourse }) {
  const stats = useMemo(() => {
    const avgRating = courses.length ? (courses.reduce((s, c) => s + (c.rating || 0), 0) / courses.length).toFixed(1) : 0;
    return { totalCourses: courses.length, totalAccounts: accounts.length, avgRating };
  }, [courses, accounts]);

  const categoryData = useMemo(() => {
    const map = {};
    courses.forEach((c) => { map[c.category] = (map[c.category] || 0) + 1; });
    return Object.entries(map).map(([name, value]) => ({ name: categoryLabel(name), value })).sort((a, b) => b.value - a.value);
  }, [courses]);

  const topCourses = useMemo(() => [...courses].sort((a, b) => b.rating - a.rating || b.reviews - a.reviews).slice(0, 5), [courses]);
  const maxCat = Math.max(...categoryData.map((c) => c.value), 1);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 14 }}>
        <StatCard label="Tổng khóa học" value={stats.totalCourses} accentBg="#EEF5FF" accentFg="#1947D6" icon="📚" />
        <StatCard label="Tài khoản" value={stats.totalAccounts} accentBg="#EAF8EE" accentFg="#19874A" icon="👥" />
        <StatCard label="Đánh giá TB" value={stats.avgRating + ' / 5'} accentBg="#FFF3E6" accentFg="#C2540A" icon="⭐" />
        <StatCard label="Giảng viên" value={instructors.length} accentBg="#FEF1F1" accentFg="#C0263A" icon="🎓" />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,3fr) minmax(0,2fr)', gap: 16 }}>
        <div className="admin-surface" style={{ background: '#fff', borderRadius: 16, border: '1px solid #eef1f7', boxShadow: '0 1px 2px rgba(13,19,33,0.04), 0 8px 24px -12px rgba(13,19,33,0.1)', padding: 20 }}>
          <p style={{ fontWeight: 600, margin: '0 0 4px', color: '#0d1321' }}>Khóa học theo danh mục</p>
          <p style={{ fontSize: 12, color: '#8893ab', margin: '0 0 16px' }}>Phân bố {stats.totalCourses} khóa học</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {categoryData.map((c, i) => (
              <div key={c.name} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ width: 80, fontSize: 12, color: '#39455e', flexShrink: 0 }}>{c.name}</span>
                <div style={{ flex: 1, height: 10, background: '#f1f3f9', borderRadius: 999, overflow: 'hidden' }}>
                  <div style={{ width: (c.value / maxCat * 100) + '%', height: '100%', background: '#2563f5', borderRadius: 999 }} />
                </div>
                <span style={{ width: 18, fontSize: 12, color: '#8893ab', textAlign: 'right', flexShrink: 0 }}>{c.value}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="admin-surface" style={{ background: '#fff', borderRadius: 16, border: '1px solid #eef1f7', boxShadow: '0 1px 2px rgba(13,19,33,0.04), 0 8px 24px -12px rgba(13,19,33,0.1)', overflow: 'hidden' }}>
          <p style={{ fontWeight: 600, margin: '20px 20px 4px', color: '#0d1321' }}>Giảng viên nổi bật</p>
          <div>
            {instructors.slice(0, 5).map((t) => (
              <div key={t._id || t.id || t.name} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 20px', borderTop: '1px solid #f1f3f9' }}>
                <Avatar name={t.name} size={34} />
                <div style={{ minWidth: 0, flex: 1 }}>
                  <p style={{ fontSize: 13, fontWeight: 500, margin: 0, color: '#0d1321', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{t.name}</p>
                  <p style={{ fontSize: 11, color: '#8893ab', margin: 0 }}>{t.role}</p>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 3, fontSize: 12, fontWeight: 600, color: '#f59e0b' }}>
                  <Star size={11} /> {t.rating}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="admin-surface" style={{ background: '#fff', borderRadius: 16, border: '1px solid #eef1f7', boxShadow: '0 1px 2px rgba(13,19,33,0.04), 0 8px 24px -12px rgba(13,19,33,0.1)', overflow: 'hidden' }}>
        <p style={{ fontWeight: 600, margin: '20px 20px 4px', color: '#0d1321' }}>Khóa học đánh giá cao nhất</p>
        <div>
          {topCourses.map((c) => (
            <div key={c.id} onClick={() => onSelectCourse(c)} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 20px', borderTop: '1px solid #f1f3f9', cursor: 'pointer' }}>
              <Avatar name={c.title} size={36} rounded="10px" />
              <div style={{ minWidth: 0, flex: 1 }}>
                <p style={{ fontSize: 13, fontWeight: 500, margin: 0, color: '#0d1321', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{c.title}</p>
                <p style={{ fontSize: 11, color: '#8893ab', margin: 0 }}>by {c.author} · {categoryLabel(c.category)}</p>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 3, fontSize: 12, fontWeight: 600, color: '#f59e0b', flexShrink: 0 }}>
                <Star size={12} /> {c.rating}
              </div>
              <p style={{ fontSize: 13, fontWeight: 600, color: '#0d1321', width: 56, textAlign: 'right', margin: 0, flexShrink: 0 }}>{fmtMoney(c.price)}</p>
            </div>
          ))}
        </div>
      </div>

      {testimonials?.length > 0 && (
        <div className="admin-surface" style={{ background: '#fff', borderRadius: 16, border: '1px solid #eef1f7', boxShadow: '0 1px 2px rgba(13,19,33,0.04), 0 8px 24px -12px rgba(13,19,33,0.1)', padding: 20 }}>
          <p style={{ fontWeight: 600, margin: '0 0 14px', color: '#0d1321' }}>Phản hồi gần đây</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12 }}>
            {testimonials.slice(0, 3).map((t) => (
              <div key={t.id} className="admin-testimonial-card" style={{ background: '#f8f9fc', borderRadius: 12, padding: 14, border: '1px solid #eef1f7' }}>
                <p style={{ fontSize: 13, color: '#39455e', lineHeight: 1.6, margin: '0 0 10px' }}>"{t.content.slice(0, 130)}{t.content.length > 130 ? '...' : ''}"</p>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Avatar name={t.name} size={26} />
                  <div>
                    <p style={{ fontSize: 12, fontWeight: 600, margin: 0, color: '#0d1321' }}>{t.name}</p>
                    <p style={{ fontSize: 11, color: '#8893ab', margin: 0 }}>{t.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function Courses({ courses, query, onSelectCourse }) {
  const [category, setCategory] = useState('all');
  const [level, setLevel] = useState('all');
  const categories = useMemo(() => ['all', ...Array.from(new Set(courses.map((c) => c.category)))], [courses]);

  const filtered = useMemo(() => {
    return courses.filter((c) => {
      const q = !query || c.title.toLowerCase().includes(query.toLowerCase()) || c.author.toLowerCase().includes(query.toLowerCase());
      const cat = category === 'all' || c.category === category;
      const lv = level === 'all' || levelLabel(c.level) === level;
      return q && cat && lv;
    }).sort((a, b) => b.rating - a.rating);
  }, [courses, query, category, level]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div className="admin-course-filters" style={{ display: 'flex', flexWrap: 'wrap', gap: 10, alignItems: 'center', background: '#fff', border: '1px solid #eef1f7', borderRadius: 16, padding: 12 }}>
        <select className="admin-course-filter" value={category} onChange={(e) => setCategory(e.target.value)} style={{ padding: '8px 10px', fontSize: 13, borderRadius: 10, border: '1px solid #dde1ec', background: '#fff' }}>
          {categories.map((c) => <option key={c} value={c}>{c === 'all' ? 'Tất cả danh mục' : categoryLabel(c)}</option>)}
        </select>
        <select className="admin-course-filter" value={level} onChange={(e) => setLevel(e.target.value)} style={{ padding: '8px 10px', fontSize: 13, borderRadius: 10, border: '1px solid #dde1ec', background: '#fff' }}>
          <option value="all">Tất cả cấp độ</option>
          {['Beginner', 'Intermediate', 'Advanced', 'Expert'].map((l) => <option key={l} value={l}>{l}</option>)}
        </select>
        <div style={{ flex: 1 }} />
        <span style={{ fontSize: 12, color: '#8893ab', fontWeight: 500 }}>{filtered.length} kết quả</span>
      </div>

      <div className="admin-surface" style={{ background: '#fff', borderRadius: 16, border: '1px solid #eef1f7', overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table className="admin-course-table" style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ background: '#f6f8fb', color: '#8893ab', fontSize: 11, textTransform: 'uppercase' }}>
                <th style={{ textAlign: 'left', padding: '10px 16px', fontWeight: 600 }}>Khóa học</th>
                <th style={{ textAlign: 'left', padding: '10px 10px', fontWeight: 600 }}>Danh mục</th>
                <th style={{ textAlign: 'left', padding: '10px 10px', fontWeight: 600 }}>Cấp độ</th>
                <th style={{ textAlign: 'left', padding: '10px 10px', fontWeight: 600 }}>Đánh giá</th>
                <th style={{ textAlign: 'right', padding: '10px 16px', fontWeight: 600 }}>Giá</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((c) => (
                <tr key={c.id} onClick={() => onSelectCourse(c)} style={{ borderTop: '1px solid #f1f3f9', cursor: 'pointer' }}>
                  <td style={{ padding: '10px 16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 200 }}>
                      <Avatar name={c.title} size={34} rounded="9px" />
                      <div style={{ minWidth: 0 }}>
                        <p style={{ margin: 0, fontWeight: 500, color: '#0d1321', maxWidth: 220, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{c.title}</p>
                        <p style={{ margin: 0, fontSize: 11, color: '#8893ab' }}>by {c.author}</p>
                      </div>
                    </div>
                  </td>
                  <td style={{ padding: '10px' }}>
                    <span className="admin-course-badge" style={{ fontSize: 11, fontWeight: 500, padding: '3px 8px', borderRadius: 999, background: '#EEF5FF', color: '#1947D6' }}>{categoryLabel(c.category)}</span>
                  </td>
                  <td style={{ padding: '10px' }}>
                    <span className="admin-course-badge" style={{ fontSize: 11, fontWeight: 500, padding: '3px 8px', borderRadius: 999, background: LEVEL_BG[levelLabel(c.level)] || '#eef1f7', color: LEVEL_FG[levelLabel(c.level)] || '#5c6884' }}>{levelLabel(c.level)}</span>
                  </td>
                  <td style={{ padding: '10px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 3, color: '#f59e0b', fontWeight: 600, fontSize: 12 }}>
                      <Star size={12} /> {c.rating} <span style={{ color: '#8893ab', fontWeight: 400 }}>({c.reviews})</span>
                    </div>
                  </td>
                  <td style={{ padding: '10px 16px', textAlign: 'right', fontWeight: 600, color: '#0d1321' }}>{fmtMoney(c.price)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function Instructors({ courses, instructors }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 14 }}>
      {instructors.map((t) => {
        const taught = courses.filter((c) => c.instructorId === t._id);
        return (
          <div key={t._id} className="admin-surface" style={{ background: '#fff', borderRadius: 16, border: '1px solid #eef1f7', padding: 18, display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <Avatar name={t.name} size={48} />
              <div style={{ minWidth: 0 }}>
                <p style={{ margin: 0, fontWeight: 600, color: '#0d1321' }}>{t.name}</p>
                <p style={{ margin: 0, fontSize: 12, color: '#8893ab' }}>{t.title}</p>
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <div className="admin-instructor-stat" style={{ background: '#f6f8fb', borderRadius: 10, padding: '10px 0', textAlign: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 3, color: '#f59e0b', fontWeight: 700 }}><Star size={13} />{t.rating}</div>
                <p style={{ margin: '2px 0 0', fontSize: 11, color: '#8893ab' }}>đánh giá</p>
              </div>
              <div className="admin-instructor-stat" style={{ background: '#f6f8fb', borderRadius: 10, padding: '10px 0', textAlign: 'center' }}>
                <p style={{ margin: 0, fontWeight: 700, color: '#1947D6' }}>{t.totalStudents.toLocaleString()}</p>
                <p style={{ margin: '2px 0 0', fontSize: 11, color: '#8893ab' }}>học viên</p>
              </div>
            </div>
            {taught.length > 0 && (
              <div>
                <p style={{ fontSize: 11, fontWeight: 600, color: '#5c6884', margin: '0 0 6px' }}>{taught.length} khóa học trên Byway</p>
                {taught.slice(0, 3).map((c) => (
                  <p key={c.id} style={{ fontSize: 12, color: '#39455e', margin: '2px 0', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>• {c.title}</p>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function isHoadoAccount(account) {
  return String(account?.Username || '').replace(/^@/, '').toLowerCase() === 'hoado';
}

function Accounts({ accounts, query, onToggleStatus }) {
  const [revealed, setRevealed] = useState({});
  const [updatingId, setUpdatingId] = useState(null);
  const [statusError, setStatusError] = useState('');
  const filtered = accounts.filter((a) => {
    if (isHoadoAccount(a)) return false;
    if (!query) return true;
    const q = query.toLowerCase();
    return a.Fname?.toLowerCase().includes(q) || a.Lname?.toLowerCase().includes(q) || a.Username?.toLowerCase().includes(q) || a.Email?.toLowerCase().includes(q);
  });

  const handleToggleStatus = async (account) => {
    const nextStatus = account.isActive === false;
    const actionLabel = nextStatus ? 'mở khóa' : 'tạm khóa';
    const confirmed = window.confirm(`Bạn có chắc muốn ${actionLabel} tài khoản @${account.Username} không?`);
    if (!confirmed) return;

    setUpdatingId(account.id);
    setStatusError('');
    try {
      await onToggleStatus(account.id, nextStatus);
    } catch (error) {
      setStatusError(error.message || 'Không thể cập nhật trạng thái tài khoản');
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div className="admin-surface" style={{ background: '#fff', borderRadius: 16, border: '1px solid #eef1f7', overflow: 'hidden' }}>
      {statusError && <p role="alert" style={{ margin: 0, padding: '10px 16px', color: '#b42318', background: '#fff1f0', fontSize: 12 }}>{statusError}</p>}
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr style={{ background: '#f6f8fb', color: '#8893ab', fontSize: 11, textTransform: 'uppercase' }}>
              <th style={{ textAlign: 'left', padding: '10px 16px', fontWeight: 600 }}>Người dùng</th>
              <th style={{ textAlign: 'left', padding: '10px 10px', fontWeight: 600 }}>Username</th>
              <th style={{ textAlign: 'left', padding: '10px 10px', fontWeight: 600 }}>Email</th>
              <th style={{ textAlign: 'left', padding: '10px 10px', fontWeight: 600 }}>Mật khẩu</th>
              <th style={{ textAlign: 'left', padding: '10px 10px', fontWeight: 600 }}>Trạng thái</th>
              <th style={{ textAlign: 'right', padding: '10px 16px', fontWeight: 600 }}>ID</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((a) => {
              const fullName = (a.Fname + ' ' + a.Lname).trim() || 'Người dùng';
              const isR = revealed[a.id];
              const isActive = a.isActive !== false;
              return (
                <tr key={a.id} style={{ borderTop: '1px solid #f1f3f9' }}>
                  <td style={{ padding: '10px 16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <Avatar name={fullName} size={32} />
                      <p style={{ margin: 0, fontWeight: 500, color: '#0d1321' }}>{fullName}</p>
                    </div>
                  </td>
                  <td style={{ padding: '10px', color: '#39455e' }}>@{a.Username}</td>
                  <td style={{ padding: '10px', color: '#39455e' }}>{a.Email}</td>
                  <td style={{ padding: '10px' }}>
                    <button onClick={() => setRevealed((r) => ({ ...r, [a.id]: !r[a.id] }))} style={{ fontFamily: 'monospace', fontSize: 12, color: '#5c6884', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
                      {isR ? a.pass : '••••••••'}
                    </button>
                  </td>
                  <td style={{ padding: '10px' }}>
                    <button
                      type="button"
                      className={`admin-account-status ${isActive ? 'admin-account-status--active' : 'admin-account-status--suspended'}`}
                      disabled={updatingId === a.id}
                      onClick={() => handleToggleStatus(a)}
                      title={isActive ? 'Tạm khóa tài khoản' : 'Mở khóa tài khoản'}
                    >
                      {updatingId === a.id ? 'Đang lưu...' : (isActive ? 'Hoạt động' : 'Tạm khóa')}
                    </button>
                  </td>
                  <td style={{ padding: '10px 16px', textAlign: 'right', color: '#8893ab', fontSize: 12 }}>#{a.id}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Testimonials({ testimonials }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 14 }}>
      {testimonials.map((t) => (
        <div key={t.id} className="admin-surface" style={{ background: '#fff', borderRadius: 16, border: '1px solid #eef1f7', padding: 18, display: 'flex', flexDirection: 'column', gap: 12 }}>
          <p style={{ fontSize: 24, color: '#b6d4ff', margin: 0, fontWeight: 700 }}>"</p>
          <p style={{ fontSize: 13, color: '#39455e', lineHeight: 1.6, margin: 0, flex: 1 }}>{t.content}</p>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, paddingTop: 10, borderTop: '1px solid #f1f3f9' }}>
            <Avatar name={t.name} size={34} />
            <div>
              <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: '#0d1321' }}>{t.name}</p>
              <p style={{ margin: 0, fontSize: 11, color: '#8893ab' }}>{t.role}</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function CourseDetail({ course, onClose }) {
  const [tab, setTab] = useState('description');
  if (!course) return null;
  const d = course.details || {};
  const tabs = [
    { key: 'description', label: 'Mô tả' },
    { key: 'instructor', label: 'Giảng viên' },
    { key: 'syllabus', label: 'Chương trình' },
    { key: 'reviews', label: 'Đánh giá' },
  ];
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', justifyContent: 'flex-end' }}>
      <div onClick={onClose} style={{ position: 'absolute', inset: 0, background: 'rgba(13,19,33,0.5)' }} />
      <div style={{ position: 'relative', width: '100%', maxWidth: 480, height: '100%', background: '#fff', display: 'flex', flexDirection: 'column', boxShadow: '-12px 0 32px rgba(0,0,0,0.15)' }}>
        <div style={{ display: 'flex', gap: 12, padding: '18px 20px', borderBottom: '1px solid #eef1f7' }}>
          <Avatar name={course.title} size={48} rounded="14px" />
          <div style={{ minWidth: 0, flex: 1 }}>
            <span style={{ fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 999, background: '#EEF5FF', color: '#1947D6' }}>{categoryLabel(course.category)}</span>
            <p style={{ margin: '6px 0 0', fontWeight: 700, fontSize: 15, color: '#0d1321', lineHeight: 1.3 }}>{course.title}</p>
            <p style={{ margin: 0, fontSize: 12, color: '#8893ab' }}>by {course.author}</p>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#8893ab', fontSize: 20, lineHeight: 1, padding: 4 }}>×</button>
        </div>

        <div style={{ display: 'flex', gap: 16, padding: '12px 20px', background: '#f6f8fb', borderBottom: '1px solid #eef1f7', fontSize: 12 }}>
          <div><span style={{ color: '#f59e0b', fontWeight: 700 }}>★ {course.rating}</span> <span style={{ color: '#8893ab' }}>({course.reviews})</span></div>
          <div style={{ color: '#39455e' }}>{course.hours}h</div>
          <div style={{ color: '#39455e' }}>{course.lectures} bài giảng</div>
        </div>

        <div style={{ display: 'flex', gap: 4, padding: '0 16px', borderBottom: '1px solid #eef1f7', overflowX: 'auto' }}>
          {tabs.map((t) => (
            <button key={t.key} onClick={() => setTab(t.key)} style={{
              padding: '10px 10px', fontSize: 13, fontWeight: 500, background: 'none', border: 'none', cursor: 'pointer',
              borderBottom: tab === t.key ? '2px solid #2563f5' : '2px solid transparent',
              color: tab === t.key ? '#1947D6' : '#8893ab', whiteSpace: 'nowrap',
            }}>{t.label}</button>
          ))}
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: 20 }}>
          {tab === 'description' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
                <p style={{ fontSize: 22, fontWeight: 700, margin: 0, color: '#0d1321' }}>{fmtMoney(course.promotionalPrice ?? course.price)}</p>
                {d.originalPrice && d.originalPrice !== course.promotionalPrice && <p style={{ fontSize: 13, color: '#8893ab', textDecoration: 'line-through', margin: 0 }}>{fmtMoney(d.originalPrice)}</p>}
                {course.discount && <span style={{ fontSize: 11, fontWeight: 600, padding: '3px 8px', borderRadius: 999, background: '#EAF8EE', color: '#19874A' }}>{d.discount}</span>}
              </div>
              {course.shortDescription && <p style={{ fontSize: 13, color: '#39455e', lineHeight: 1.6, margin: 0 }}>{course.shortDescription}</p>}
              {course.courseDescription && (
                <div>
                  <p style={{ fontSize: 13, fontWeight: 600, color: '#0d1321', margin: '0 0 4px' }}>Mô tả khóa học</p>
                  <p style={{ fontSize: 13, color: '#39455e', lineHeight: 1.6, margin: 0 }}>{course.courseDescription}</p>
                </div>
              )}
              {course.certification && (
                <div style={{ background: '#f5f8ff', border: '1px solid #dce9ff', borderRadius: 12, padding: 14 }}>
                  <p style={{ fontSize: 13, color: '#1947D6', lineHeight: 1.6, margin: 0 }}>{course.certification}</p>
                </div>
              )}
              {d.languages?.length > 0 && (
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {d.languages.map((l) => <span key={l} style={{ fontSize: 11, fontWeight: 500, padding: '3px 8px', borderRadius: 999, background: '#eef1f7', color: '#39455e' }}>{l}</span>)}
                </div>
              )}
            </div>
          )}

          {tab === 'instructor' && course.instructor && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <Avatar name={course.instructor.name} size={56} />
                <div>
                  <p style={{ margin: 0, fontWeight: 600, color: '#0d1321' }}>{course.instructor.name}</p>
                  <p style={{ margin: 0, fontSize: 12, color: '#8893ab' }}>{course.instructor.title}</p>
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, textAlign: 'center' }}>
                <div style={{ background: '#f6f8fb', borderRadius: 10, padding: 10 }}>
                  <p style={{ margin: 0, fontWeight: 700, color: '#0d1321' }}>{course.instructor.totalReviews?.toLocaleString()}</p>
                  <p style={{ margin: 0, fontSize: 11, color: '#8893ab' }}>đánh giá</p>
                </div>
                <div style={{ background: '#f6f8fb', borderRadius: 10, padding: 10 }}>
                  <p style={{ margin: 0, fontWeight: 700, color: '#0d1321' }}>{course.instructor.totalStudents?.toLocaleString()}</p>
                  <p style={{ margin: 0, fontSize: 11, color: '#8893ab' }}>học viên</p>
                </div>
                <div style={{ background: '#f6f8fb', borderRadius: 10, padding: 10 }}>
                  <p style={{ margin: 0, fontWeight: 700, color: '#0d1321' }}>{course.instructor.totalCourses}</p>
                  <p style={{ margin: 0, fontSize: 11, color: '#8893ab' }}>khóa học</p>
                </div>
              </div>
              {course.instructor.bio && <p style={{ fontSize: 13, color: '#39455e', lineHeight: 1.6, margin: 0 }}>{course.instructor.bio}</p>}
            </div>
          )}

          {tab === 'syllabus' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {(course.syllabus || []).map((s, i) => {
                const lessons = s.lessonDetails?.length ? s.lessonDetails : (s.items || []).map((title) => ({ title, videoUrl: '' }));
                return (
                  <div key={i} style={{ border: '1px solid #eef1f7', borderRadius: 12, padding: 12 }}>
                    <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: '#0d1321' }}>{s.title}</p>
                    <p style={{ margin: '2px 0 8px', fontSize: 11, color: '#8893ab' }}>{s.lessons} bài · {s.duration}</p>
                    {lessons.map((lesson, j) => (
                      <div key={j} style={{ margin: '8px 0' }}>
                        <p style={{ margin: '0 0 4px', fontSize: 12, color: '#39455e' }}>
                          • {lesson.title}{lesson.duration ? ` (${lesson.duration})` : ''}
                        </p>
                        {lesson.videoUrl ? (
                          <video
                            src={lesson.videoUrl}
                            controls
                            style={{ width: '100%', maxHeight: 200, borderRadius: 8, background: '#000' }}
                          />
                        ) : (
                          <p style={{ margin: 0, fontSize: 11, color: '#c2540a' }}>Chưa có video</p>
                        )}
                      </div>
                    ))}
                  </div>
                );
              })}
            </div>
          )}

          {tab === 'reviews' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {course.courseReviews?.length > 0 && (
                <div style={{ /* giữ nguyên style */ }}>
                  <p>{(course.courseReviews.reduce((s, r) => s + r.rating, 0) / course.courseReviews.length).toFixed(1)}</p>
                  <p>{course.courseReviews.length} đánh giá</p>
                </div>
              )}
              {(course.courseReviews || []).map((r) => (
                <div key={r._id} style={{ display: 'flex', gap: 10 }}>
                  <Avatar name={r.name} size={32} />
                  <div>
                    <p>{r.name} <span>{'★'.repeat(r.rating)}</span></p>
                    <p>{r.comment}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
const STATUS_BADGE = {
  pending: { bg: '#FFF3E6', fg: '#C2540A', label: 'Pending' },
  approved: { bg: '#EAF8EE', fg: '#19874A', label: 'Approved' },
  rejected: { bg: '#FEF1F1', fg: '#C0263A', label: 'Rejected' },
  draft: { bg: '#eef1f7', fg: '#5c6884', label: 'Draft' },
};

function RejectModal({ course, onCancel, onConfirm, submitting }) {
  const [reason, setReason] = useState('');
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 60, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div onClick={onCancel} style={{ position: 'absolute', inset: 0, background: 'rgba(13,19,33,0.5)' }} />
      <div style={{ position: 'relative', width: '100%', maxWidth: 420, background: '#fff', borderRadius: 16, padding: 20, display: 'flex', flexDirection: 'column', gap: 12 }}>
        <p style={{ margin: 0, fontWeight: 700, fontSize: 15, color: '#0d1321' }}>Reject "{course.title}"</p>
        <p style={{ margin: 0, fontSize: 12, color: '#8893ab' }}>Please provide a reason so the instructor can fix and resubmit.</p>
        <textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          rows={4}
          placeholder="e.g. Missing lesson videos, unclear course description..."
          style={{ padding: 10, fontSize: 13, borderRadius: 10, border: '1px solid #dde1ec', resize: 'vertical', fontFamily: 'inherit' }}
        />
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
          <button onClick={onCancel} disabled={submitting} style={{ padding: '8px 14px', fontSize: 13, borderRadius: 10, border: '1px solid #dde1ec', background: '#fff', cursor: 'pointer' }}>Cancel</button>
          <button
            onClick={() => reason.trim() && onConfirm(reason.trim())}
            disabled={submitting || !reason.trim()}
            style={{ padding: '8px 14px', fontSize: 13, borderRadius: 10, border: 'none', background: '#dc2626', color: '#fff', cursor: reason.trim() ? 'pointer' : 'not-allowed', opacity: reason.trim() ? 1 : 0.5 }}
          >
            {submitting ? 'Rejecting...' : 'Confirm Reject'}
          </button>
        </div>
      </div>
    </div>
  );
}

function CourseApprovals() {
  const [pending, setPending] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actioningId, setActioningId] = useState(null);
  const [rejectTarget, setRejectTarget] = useState(null);
  const [viewingCourse, setViewingCourse] = useState(null); 

  const loadPending = async () => {
    try {
      setLoading(true);
      const res = await fetchWithAuth(API.pendingCourses);
      if (!res.ok) throw new Error(`Failed to load pending courses: ${res.status}`);
      const result = await res.json();
      setPending(result.data || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadPending(); }, []);

  const handleApprove = async (course) => {
    setActioningId(course._id);
    try {
      const res = await fetchWithAuth(API.approveCourse(course._id), { method: 'PUT' });
      if (!res.ok) throw new Error('Approve failed');
      setPending((prev) => prev.filter((c) => c._id !== course._id));
    } catch (err) {
      alert(err.message);
    } finally {
      setActioningId(null);
    }
  };

  const handleReject = async (reason) => {
    const course = rejectTarget;
    setActioningId(course._id);
    try {
      const res = await fetchWithAuth(API.rejectCourse(course._id), {
        method: 'PUT',
        body: JSON.stringify({ reason }),
      });
      if (!res.ok) throw new Error('Reject failed');
      setPending((prev) => prev.filter((c) => c._id !== course._id));
      setRejectTarget(null);
    } catch (err) {
      alert(err.message);
    } finally {
      setActioningId(null);
    }
  };

  if (loading) return <p style={{ color: '#8893ab', fontSize: 13 }}>Loading pending courses...</p>;
  if (error) return <p style={{ color: '#dc2626', fontSize: 13 }}>Error: {error}</p>;

  if (pending.length === 0) {
    return (
      <div className="admin-approval-empty" style={{ background: '#fff', borderRadius: 16, border: '1px solid #eef1f7', padding: 40, textAlign: 'center' }}>
        <p style={{ margin: 0, fontSize: 32 }}>✅</p>
        <p style={{ margin: '10px 0 0', fontWeight: 600, color: '#0d1321' }}>No courses waiting for review</p>
        <p style={{ margin: '4px 0 0', fontSize: 12, color: '#8893ab' }}>New submissions will show up here.</p>
      </div>
    );
  }

  return (
    <>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {pending.map((c) => (
          <div
            key={c._id}
            onClick={() => setViewingCourse({
              ...c,
              author: c.instructorId?.name || 'Unknown instructor',
              instructor: c.instructorId,
              courseReviews: [],
            })}
            style={{ background: '#fff', borderRadius: 16, border: '1px solid #eef1f7', padding: 16, display: 'flex', gap: 14, alignItems: 'flex-start', cursor: 'pointer' }}
          >
            <Avatar name={c.title} size={44} rounded="12px" />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                <p style={{ margin: 0, fontWeight: 600, color: '#0d1321', fontSize: 14 }}>{c.title}</p>
                <span style={{ fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 999, background: STATUS_BADGE.pending.bg, color: STATUS_BADGE.pending.fg }}>
                  {STATUS_BADGE.pending.label}
                </span>
              </div>
              <p style={{ margin: '4px 0 0', fontSize: 12, color: '#8893ab' }}>
                by {c.instructorId?.name || 'Unknown instructor'} · {categoryLabel(c.category)} · {c.level}
              </p>
              {c.shortDescription && (
                <p style={{ margin: '6px 0 0', fontSize: 12, color: '#39455e', lineHeight: 1.5, maxWidth: 560 }}>
                  {c.shortDescription.slice(0, 160)}{c.shortDescription.length > 160 ? '...' : ''}
                </p>
              )}
            </div>
            <div style={{ display: 'flex', gap: 8, flexShrink: 0 }} onClick={(e) => e.stopPropagation()}>
              <button
                onClick={() => setRejectTarget(c)}
                disabled={actioningId === c._id}
                style={{ padding: '8px 14px', fontSize: 12, fontWeight: 500, borderRadius: 10, border: '1px solid #fecaca', background: '#fff', color: '#dc2626', cursor: 'pointer' }}
              >
                Reject
              </button>
              <button
                onClick={() => handleApprove(c)}
                disabled={actioningId === c._id}
                style={{ padding: '8px 14px', fontSize: 12, fontWeight: 500, borderRadius: 10, border: 'none', background: '#19874A', color: '#fff', cursor: 'pointer' }}
              >
                {actioningId === c._id ? 'Approving...' : 'Approve'}
              </button>
            </div>
          </div>
        ))}
      </div>
      {rejectTarget && (
        <RejectModal
          course={rejectTarget}
          submitting={actioningId === rejectTarget._id}
          onCancel={() => setRejectTarget(null)}
          onConfirm={handleReject}
        />
      )}
      {viewingCourse && (
        <CourseDetail course={viewingCourse} onClose={() => setViewingCourse(null)} />
      )}
    </>
  );
}

export default function AdminPage() {
  const { theme } = useTheme();
  const isMobile = useIsMobile(900);
  const [active, setActive] = useState('overview');
  const [query, setQuery] = useState('');
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const [courses, setCourses] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [instructors, setInstructors] = useState([]);
  const [testimonials, setTestimonials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!isMobile) setSidebarOpen(false);
  }, [isMobile]);

  useEffect(() => {
  const fetchData = async () => {
    try {
      setLoading(true);

      const res = await fetchWithAuth(API.admin); // GET /admin, cần token admin
      if (!res.ok) throw new Error(`Lỗi tải dữ liệu admin: ${res.status}`);

      const data = await res.json();

      const instructorsList = data.instructor || [];
      const reviewsList = data.review || [];

      // map course: thêm id, author (join từ instructorId), reviews (đếm từ mảng review)
      const mappedCourses = (data.course || []).map((c) => {
        const instructor = instructorsList.find((i) => i._id === c.instructorId);
        const courseReviews = reviewsList.filter((r) => r.courseId === c._id);
        return {
          ...c,
          id: c._id,
          author: instructor?.name || 'Chưa rõ giảng viên',
          reviews: courseReviews.length,
          instructor,        // gắn luôn object giảng viên đầy đủ
          courseReviews,      // gắn luôn review của khóa học này
        };
      });

      setCourses(mappedCourses);
      setAccounts((data.user || []).map((a) => ({ ...a, id: a._id })));
      setTestimonials((data.comment || []).map((t) => ({ ...t, id: t._id })));
      setInstructors(instructorsList);   // cần thêm state mới: const [instructors, setInstructors] = useState([]);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };
  fetchData();
}, []);

  const handleToggleAccountStatus = async (accountId, isActive) => {
    const res = await fetchWithAuth(API.updateAccountStatus(accountId), {
      method: 'PUT',
      body: JSON.stringify({ isActive }),
    });
    const result = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(result.message || `Lỗi cập nhật trạng thái: ${res.status}`);

    setAccounts((current) => current.map((account) => (
      account.id === accountId ? { ...account, isActive } : account
    )));
  };

  const showSearch = active === 'courses' || active === 'accounts';

  const titles = {
    overview: ['Tổng quan', 'Số liệu nền tảng theo thời gian thực'],
    courses: ['Khóa học', 'Quản lý toàn bộ khóa học trên Byway'],
    approvals: ['Course Approvals', 'Review and moderate pending course submissions'],
    instructors: ['Giảng viên', 'Đội ngũ giảng viên nổi bật'],
    accounts: ['Tài khoản', 'Người dùng đã đăng ký'],
    testimonials: ['Đánh giá nổi bật', 'Phản hồi từ học viên'],
  };
  const [title, subtitle] = titles[active];

  if (loading) {
    return (
      <div style={{ display: 'flex', height: '100vh', alignItems: 'center', justifyContent: 'center', fontFamily: 'Inter, system-ui, sans-serif', color: '#39455e' }}>
        Đang tải dữ liệu...
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ display: 'flex', height: '100vh', alignItems: 'center', justifyContent: 'center', fontFamily: 'Inter, system-ui, sans-serif', color: '#dc2626' }}>
        Lỗi tải dữ liệu: {error}
      </div>
    );
  }

  return (
    <div className={`admin-page admin-page--${theme}`} style={{ display: 'flex', height: '100vh', background: '#f6f8fb', fontFamily: 'Inter, system-ui, sans-serif', color: '#0d1321' }}>
      {sidebarOpen && <div onClick={() => setSidebarOpen(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(13,19,33,0.4)', zIndex: 30 }} />}
      <aside style={{
        position: isMobile ? 'fixed' : 'static', zIndex: 40, insetBlock: 0, left: 0, width: 224,
        background: '#0d1321', color: '#fff', display: 'flex', flexDirection: 'column', flexShrink: 0,
        transform: isMobile && !sidebarOpen ? 'translateX(-100%)' : 'none', transition: 'transform .2s', height: '100%',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '0 20px', height: 60, borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
          <div style={{ width: 28, height: 28, borderRadius: 8, background: '#2563f5', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 13 }}>B</div>
          <span style={{ fontWeight: 600, fontSize: 14 }}>Byway Admin</span>
        </div>
        <nav style={{ flex: 1, padding: '16px 12px', display: 'flex', flexDirection: 'column', gap: 4 }}>
          <p style={{ padding: '0 12px', margin: '0 0 6px', fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#8893ab' }}>Quản lý</p>
          {NAV.map((n) => (
            <button key={n.key} className={active === n.key ? 'admin-nav-item admin-nav-item--active' : 'admin-nav-item'} onClick={() => { setActive(n.key); setSidebarOpen(false); }} style={{
              display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: 12, fontSize: 13, fontWeight: 500,
              border: 'none', cursor: 'pointer', textAlign: 'left',
              background: active === n.key ? '#2563f5' : 'transparent', color: active === n.key ? '#fff' : '#b7bfd2',
            }}>{n.label}</button>
          ))}
        </nav>
        <div style={{ padding: 14, borderTop: '1px solid rgba(255,255,255,0.1)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'rgba(255,255,255,0.06)', borderRadius: 12, padding: 8 }}>
            <div style={{ width: 30, height: 30, borderRadius: 999, background: '#4f8fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700 }}>HĐ</div>
            <div style={{ minWidth: 0 }}>
              <p style={{ margin: 0, fontSize: 12, fontWeight: 500 }}>Hoa Đỗ</p>
              <p style={{ margin: 0, fontSize: 10, color: '#8893ab' }}>Quản trị viên</p>
            </div>
          </div>
        </div>
      </aside>

      <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
        <header style={{ height: 60, flexShrink: 0, display: 'flex', alignItems: 'center', gap: 14, padding: '0 20px', borderBottom: '1px solid #eef1f7', background: 'rgba(255,255,255,0.9)' }}>
          <button aria-label="Open navigation" onClick={() => setSidebarOpen(true)} style={{ display: isMobile ? 'block' : 'none', background: 'none', border: 'none', fontSize: 18, cursor: 'pointer', color: '#39455e' }}>☰</button>
          <div style={{ minWidth: 0 }}>
            <p style={{ margin: 0, fontWeight: 600, fontSize: 15 }}>{title}</p>
            <p style={{ margin: 0, fontSize: 11, color: '#8893ab' }}>{subtitle}</p>
          </div>
          <div style={{ flex: 1 }} />
          {showSearch && (
            <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Tìm kiếm..." style={{
              padding: '8px 12px', fontSize: 13, borderRadius: 10, border: '1px solid #dde1ec', background: '#f6f8fb', width: 200, outline: 'none',
            }} />
          )}
        </header>

        <main style={{ flex: 1, overflowY: 'auto', padding: 20 }}>
          <div style={{ maxWidth: 1100, margin: '0 auto' }}>
            {active === 'overview' && <Overview courses={courses} accounts={accounts} instructors={instructors} testimonials={testimonials} onSelectCourse={setSelectedCourse} />}
            {active === 'courses' && <Courses courses={courses} query={query} onSelectCourse={setSelectedCourse} />}
            {active === 'instructors' && <Instructors courses={courses} instructors={instructors} />}
            {active === 'approvals' && <CourseApprovals />}
            {active === 'accounts' && <Accounts accounts={accounts} query={query} onToggleStatus={handleToggleAccountStatus} />}
            {active === 'testimonials' && <Testimonials testimonials={testimonials} />}
          </div>
        </main>
      </div>

      {selectedCourse && <CourseDetail course={selectedCourse} onClose={() => setSelectedCourse(null)} />}
    </div>
  );
}
