import { useEffect, useState } from 'react';
import { API, fetchWithAuth } from '../../config/api.js';
import styles from './EventLeaderboard.module.scss';

function EventLeaderboard({ eventId, highlightRefreshKey }) {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const res = await fetchWithAuth(API.eventLeaderboard(eventId));
        const body = await res.json();
        if (res.ok) setRows(body.data);
      } finally {
        setLoading(false);
      }
    })();
  }, [eventId, highlightRefreshKey]);

  if (loading) return <div className={styles.loading}>Loading leaderboard...</div>;

  const medal = (rank) => (rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : null);

  return (
    <div className={styles.board}>
      <div className={styles.header}>
        <h3 className={styles.title}>Leaderboard</h3>
        <span className={styles.subtitle}>{rows.length} participants</span>
      </div>

      {rows.length === 0 ? (
        <div className={styles.emptyWrap}>
          <span className={styles.emptyIcon}>🏆</span>
          <p className={styles.empty}>No scores yet. Be the first!</p>
        </div>
      ) : (
        <ol className={styles.list}>
          {rows.map((r) => (
            <li
              key={r.rank}
              className={styles.row}
              data-top={r.rank <= 3}
              data-rank={r.rank}
              style={{ '--delay': `${Math.min(r.rank, 10) * 0.03}s` }}
            >
              <span className={styles.rank}>
                {medal(r.rank) || `#${r.rank}`}
              </span>

              <div className={styles.avatarWrap}>
                {r.avatar ? (
                  <img src={r.avatar} alt="" className={styles.avatar} />
                ) : (
                  <div className={styles.avatarFallback}>
                    {r.displayName?.[0]?.toUpperCase() || '?'}
                  </div>
                )}
              </div>

              <span className={styles.name}>{r.displayName}</span>

              {r.currentStreak > 1 && (
                <span className={styles.streak}>
                  <span className={styles.flame}>🔥</span>{r.currentStreak}
                </span>
              )}

              <span className={styles.score}>{r.totalScore} đ</span>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}

export default EventLeaderboard;