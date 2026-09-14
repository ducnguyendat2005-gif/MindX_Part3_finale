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
        message: 'You need to sign in to play Season Pass Quiz.',
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
          message: 'You need to own at least 1 course to join the event.',
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
        <span className={styles.badge}>🔥 Season Pass · Limited Time EVENT!</span>
        <h2>Joining Season Pass Quiz</h2>
        <p>
          Answer fast, maintain your streak, climb the ranks, and earn exclusive season badges!
        </p>

        <div className={styles.actions}>
          <button className={styles.cta} onClick={handleJoin} disabled={checking}>
            {checking ? 'Checking...' : 'Join NOW →'}
          </button>

          {notice && (
            <div className={styles.notice} data-type={notice.type}>
              <span>{notice.message}</span>
              {notice.type === 'guest' && <a href="/signin">Sign in</a>}
              {notice.type === 'no-course' && <a href="/course-page">View Courses</a>}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

export default EventPromoBanner;