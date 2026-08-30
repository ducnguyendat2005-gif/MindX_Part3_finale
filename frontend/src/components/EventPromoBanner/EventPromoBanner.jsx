import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { API, fetchWithAuth, tokenStorage } from '../../config/api.js';
import styles from './EventPromoBanner.module.scss';

function EventPromoBanner() {
  const navigate = useNavigate();
  const [notice, setNotice] = useState(null); // { type: 'guest' | 'no-course' | 'error', message }
  const [checking, setChecking] = useState(false);

  const handleJoin = async () => {
    setNotice(null);
    const AT = tokenStorage.getAT();

    if (!AT) {
      setNotice({
        type: 'guest',
        message: 'Bạn cần đăng nhập để tham gia Season Pass Quiz.',
      });
      return;
    }

    setChecking(true);
    try {
      const res = await fetchWithAuth(API.mycourses);
      const body = await res.json();
      const owned = Array.isArray(body.data) ? body.data : [];

      if (owned.length === 0) {
        setNotice({
          type: 'no-course',
          message: 'Bạn cần sở hữu ít nhất 1 khóa học để tham gia sự kiện.',
        });
        return;
      }

      navigate('/events');
    } catch {
      setNotice({ type: 'error', message: 'Không kiểm tra được điều kiện tham gia, thử lại sau.' });
    } finally {
      setChecking(false);
    }
  };

  return (
    <section className={styles.promo}>
      <div className={styles.glowOne} />
      <div className={styles.glowTwo} />

      <div className={styles.content}>
        <span className={styles.badge}>🔥 Season Pass · Sự kiện giới hạn thời gian</span>
        <h2>Tham gia Season Pass Quiz</h2>
        <p>
          Trả lời nhanh, giữ streak mỗi ngày, leo hạng trên bảng xếp hạng và
          giành huy hiệu độc quyền của mùa này.
        </p>

        <div className={styles.actions}>
          <button className={styles.cta} onClick={handleJoin} disabled={checking}>
            {checking ? 'Đang kiểm tra...' : 'Tham gia ngay →'}
          </button>

          {notice && (
            <div className={styles.notice} data-type={notice.type}>
              <span>{notice.message}</span>
              {notice.type === 'guest' && <a href="/signin">Đăng nhập</a>}
              {notice.type === 'no-course' && <a href="/course-page">Xem khóa học</a>}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

export default EventPromoBanner;