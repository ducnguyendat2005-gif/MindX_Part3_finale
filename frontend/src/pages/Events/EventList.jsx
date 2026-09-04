import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { API, fetchWithAuth } from '../../config/api.js';
import styles from './EventList.module.scss';

function EventsList() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    (async () => {
      try {
        const res = await fetchWithAuth(API.activeEvents);
        const body = await res.json();
        if (!res.ok) throw new Error(body.message || 'Could not load event');
        setEvents(body.data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) {
    return <div className={`${styles.state}`}>Loading event...</div>;
  }
  if (error) {
    return <div className={`${styles.state} ${styles.stateError}`}>{error}</div>;
  }

  return (
    <div className={styles.eventsList}>
      <div className={styles.header}>
        <span className={styles.eyebrow}>Season Pass</span>
        <h1>Sự kiện đang diễn ra</h1>
        <p>Trả lời nhanh, giữ streak, leo hạng bảng xếp hạng mùa này.</p>
      </div>

      {events.length === 0 ? (
        <div className={styles.empty}>
          Hiện chưa có sự kiện nào đang mở. Back sau nhé.
        </div>
      ) : (
        <div className={styles.grid}>
          {events.map((ev) => (
            <button
              key={ev._id}
              className={styles.card}
              onClick={() => navigate(`/events/${ev._id}`)}
            >
              {ev.coverImage && (
                <img src={ev.coverImage} alt="" className={styles.cardCover} />
              )}
              <div className={styles.cardBody}>
                <h3>{ev.title}</h3>
                <p>{ev.description}</p>
                <span className={styles.cardMeta}>
                  {ev.questions?.length || 0} câu hỏi · End{' '}
                  {new Date(ev.endDate).toLocaleDateString('vi-VN')}
                </span>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default EventsList;