import { useEffect, useRef, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { API, fetchWithAuth } from '../../config/api.js';
import EventLeaderboard from '../../components/EventLeaderboard/EventLeaderboard.jsx';
import styles from './EventPlay.module.scss';

const PHASE = {
  LOADING: 'loading',
  ERROR: 'error',
  DISPLAY_MODE: 'display_mode',
  ALREADY_PLAYED: 'already_played', 
  QUESTION: 'question',
  ANSWERED: 'answered',
  DONE: 'done',
};

function shuffleArray(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function EventPlay() {
  const { id: eventId } = useParams();
  const [event, setEvent] = useState(null);
  const [phase, setPhase] = useState(PHASE.LOADING);
  const [errorMsg, setErrorMsg] = useState('');

  const [displayMode, setDisplayMode] = useState('realname');
  const [nickname, setNickname] = useState('');

  const [qIndex, setQIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState(0);
  const [lastResult, setLastResult] = useState(null); // { isCorrect, pointsEarned, totalScore, currentStreak }
  const [sessionScore, setSessionScore] = useState(0);
  const [leaderboardKey, setLeaderboardKey] = useState(0);

  // ── State riêng cho Unscramble ──
  const [scrambleTiles, setScrambleTiles] = useState([]); // [{ id, char, used }]
  const [answerTiles, setAnswerTiles] = useState([]); // [{ id, char }] theo đúng thứ tự đã chọn

  // ── State riêng cho Matching ──
  const [matchLeft, setMatchLeft] = useState([]); // [{ key, text }]
  const [matchRight, setMatchRight] = useState([]); // [{ key, text }]
  const [selectedLeftKey, setSelectedLeftKey] = useState(null);
  const [matchedPairs, setMatchedPairs] = useState([]); // [{ leftKey, rightKey }]

  const startedAtRef = useRef(null);
  const timerRef = useRef(null);
  const submittedRef = useRef(false); // chặn double-submit (vd: auto-submit matching + bấm nút cùng lúc)
  const [myScore, setMyScore] = useState(null); // THÊM MỚI

useEffect(() => {
    (async () => {
      try {
        const res = await fetchWithAuth(API.eventById(eventId));
        const body = await res.json();
        if (!res.ok) throw new Error(body.message || 'Could not load event');
        setEvent(body.data);

        // THÊM MỚI — kiểm tra đã chơi chưa trước khi cho vào DISPLAY_MODE
        const scoreRes = await fetchWithAuth(API.myEventScore(eventId));
        const scoreBody = await scoreRes.json();
        if (scoreRes.ok && scoreBody.data.hasPlayed) {
          setMyScore(scoreBody.data);
          setPhase(PHASE.ALREADY_PLAYED);
          return;
        }

        setPhase(PHASE.DISPLAY_MODE);
      } catch (err) {
        setErrorMsg(err.message);
        setPhase(PHASE.ERROR);
      }
    })();
  }, [eventId]);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetchWithAuth(API.eventById(eventId));
        const body = await res.json();
        if (!res.ok) throw new Error(body.message || 'Could not load event');
        setEvent(body.data);
        setPhase(PHASE.DISPLAY_MODE);
      } catch (err) {
        setErrorMsg(err.message);
        setPhase(PHASE.ERROR);
      }
    })();
  }, [eventId]);

  const startQuestion = (index) => {
    const q = event.questions[index];
    if (!q) {
      setPhase(PHASE.DONE);
      return;
    }
    setTimeLeft(q.timeLimitSeconds);
    startedAtRef.current = Date.now();
    submittedRef.current = false;
    setPhase(PHASE.QUESTION);

    if (event.gameType === 'unscramble') {
      const letters = q.word.split('').map((char, i) => ({
        id: `${i}-${char}-${Math.random().toString(36).slice(2)}`,
        char,
      }));
      setScrambleTiles(shuffleArray(letters));
      setAnswerTiles([]);
    } else if (event.gameType === 'matching') {
      setMatchLeft(shuffleArray(q.pairs.map((p, i) => ({ key: `L${i}`, text: p.left }))));
      setMatchRight(shuffleArray(q.pairs.map((p, i) => ({ key: `R${i}`, text: p.right }))));
      setSelectedLeftKey(null);
      setMatchedPairs([]);
    }

    clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          submitCurrentAnswer(); // hết giờ — nộp bất kỳ đáp án nào đang có (có thể rỗng)
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handleConfirmDisplayMode = async () => {
    try {
      const res = await fetchWithAuth(API.setEventDisplayMode(eventId), {
        method: 'POST',
        body: JSON.stringify({ displayMode, nickname }),
      });
      const body = await res.json();
      if (!res.ok && body.code !== undefined && res.status !== 409) {
        throw new Error(body.message || 'Could not save display preference');
      }
      startQuestion(0);
    } catch (err) {
      setErrorMsg(err.message);
      setPhase(PHASE.ERROR);
    }
  };

  // payloadOverride cho phép quiz nộp NGAY khi bấm 1 lựa chọn, thay vì đọc từ state
  // (vì setState là async, đọc state ngay sau khi click có thể chưa kịp cập nhật).
  const submitCurrentAnswer = async (payloadOverride) => {
    if (submittedRef.current) return;
    submittedRef.current = true;
    clearInterval(timerRef.current);

    const question = event.questions[qIndex];
    const timeTakenMs = Date.now() - startedAtRef.current;
    const body = { questionId: question._id, timeTakenMs };

    if (event.gameType === 'unscramble') {
      body.submittedWord = payloadOverride?.submittedWord ?? answerTiles.map((t) => t.char).join('');
    } else if (event.gameType === 'matching') {
      body.submittedPairs =
        payloadOverride?.submittedPairs ??
        matchedPairs.map((mp) => ({
          left: matchLeft.find((x) => x.key === mp.leftKey)?.text ?? '',
          right: matchRight.find((x) => x.key === mp.rightKey)?.text ?? '',
        }));
    } else {
      // quiz — mặc định -1 (coi như không chọn / hết giờ)
      body.selectedIndex = payloadOverride?.selectedIndex ?? -1;
    }

    try {
      const res = await fetchWithAuth(API.submitEventAnswer(eventId), {
        method: 'POST',
        body: JSON.stringify(body),
      });
      const resBody = await res.json();

      if (!res.ok) {
        if (res.status === 409) {
          goNext();
          return;
        }
        throw new Error(resBody.message || 'Could not submit answer');
      }

      setLastResult(resBody.data);
      setSessionScore((s) => s + resBody.data.pointsEarned);
      setPhase(PHASE.ANSWERED);
    } catch (err) {
      setErrorMsg(err.message);
      setPhase(PHASE.ERROR);
    }
  };

  // ── Unscramble helpers ──
  const pickTile = (tileId) => {
    const tile = scrambleTiles.find((t) => t.id === tileId);
    if (!tile || tile.used) return;
    setScrambleTiles((tiles) => tiles.map((t) => (t.id === tileId ? { ...t, used: true } : t)));
    setAnswerTiles((tiles) => [...tiles, { id: tile.id, char: tile.char }]);
  };

  const returnTileFromSlot = (slotIndex) => {
    const tile = answerTiles[slotIndex];
    if (!tile) return;
    setAnswerTiles((tiles) => tiles.filter((_, i) => i !== slotIndex));
    setScrambleTiles((tiles) => tiles.map((t) => (t.id === tile.id ? { ...t, used: false } : t)));
  };

  // ── Matching helpers ──
  const handleLeftClick = (key) => {
    setSelectedLeftKey((cur) => (cur === key ? null : key));
  };

  const handleRightClick = (rightKey) => {
    if (!selectedLeftKey) return;
    setMatchedPairs((pairs) => [...pairs, { leftKey: selectedLeftKey, rightKey }]);
    setSelectedLeftKey(null);
  };

  const unmatchPair = (leftKey) => {
    setMatchedPairs((pairs) => pairs.filter((p) => p.leftKey !== leftKey));
  };

  // Tự nộp khi đã nối đủ hết số cặp
  useEffect(() => {
    if (
      phase === PHASE.QUESTION &&
      event?.gameType === 'matching' &&
      matchLeft.length > 0 &&
      matchedPairs.length === matchLeft.length
    ) {
      submitCurrentAnswer();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [matchedPairs, matchLeft, phase]);

  const goNext = () => {
    const next = qIndex + 1;
    setQIndex(next);
    if (next >= event.questions.length) {
      setPhase(PHASE.DONE);
      setLeaderboardKey((k) => k + 1);
    } else {
      startQuestion(next);
    }
  };

  useEffect(() => () => clearInterval(timerRef.current), []);

  if (phase === PHASE.LOADING) return <div className={styles.state}>Loading event...</div>;
  if (phase === PHASE.ERROR) return <div className={`${styles.state} ${styles.stateError}`}>{errorMsg}</div>;

  let phaseContent = null;

  if (phase === PHASE.DISPLAY_MODE) {
    phaseContent = (
      <div className={styles.modeCard}>
        <span className={styles.eyebrow}>{event.title}</span>
        <h2>Bạn muốn hiển thị tên thế nào trên bảng xếp hạng?</h2>
        <p className={styles.hint}>Option này sẽ được khóa sau khi bạn bắt đầu chơi.</p>

        <div className={styles.modeOptions}>
          {[
            { value: 'realname', label: 'Account name' },
            { value: 'nickname', label: 'Nickname' },
            { value: 'anonymous', label: 'Anonymous' },
          ].map((opt) => (
            <button
              key={opt.value}
              className={styles.modeOption}
              data-active={displayMode === opt.value}
              onClick={() => setDisplayMode(opt.value)}
            >
              {opt.label}
            </button>
          ))}
        </div>

        {displayMode === 'nickname' && (
          <input
            className={styles.nicknameInput}
            placeholder="Enter your nickname"
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            maxLength={24}
          />
        )}

        <button
          className={styles.primaryBtn}
          onClick={handleConfirmDisplayMode}
          disabled={displayMode === 'nickname' && !nickname.trim()}
        >
          Start chơi
        </button>
      </div>
    );
  } else if (phase === PHASE.QUESTION) {
    const question = event.questions[qIndex];
    const pct = (timeLeft / question.timeLimitSeconds) * 100;

    const header = (
      <>
        <div className={styles.playHeader}>
          <span>Question {qIndex + 1}/{event.questions.length}</span>
          <span className={styles.sessionScore}>{sessionScore} đ</span>
        </div>
        <div className={styles.timerTrack}>
          <div className={styles.timerFill} style={{ width: `${pct}%` }} data-urgent={timeLeft <= 5} />
        </div>
      </>
    );

    if (event.gameType === 'unscramble') {
      const totalLen = question.word.length;
      const filledCount = answerTiles.length;

      phaseContent = (
        <>
          {header}
          <div className={styles.questionCard}>
            {question.hint && <p className={styles.hintText}>Gợi ý: {question.hint}</p>}

            <div className={styles.answerSlots}>
              {Array.from({ length: totalLen }).map((_, i) => {
                const tile = answerTiles[i];
                return (
                  <button
                    // key đổi theo tile.id (thay vì cố định theo i) để React coi đây
                    // là 1 phần tử MỚI mỗi lần ô được điền chữ khác — nhờ vậy CSS
                    // animation "slotFill" được trigger lại từ đầu mỗi lần, thay vì
                    // chỉ chạy đúng 1 lần lúc mount.
                    key={tile ? `filled-${i}-${tile.id}` : `empty-${i}`}
                    type="button"
                    className={styles.answerSlot}
                    data-filled={Boolean(tile)}
                    disabled={!tile}
                    onClick={() => returnTileFromSlot(i)}
                  >
                    {tile ? tile.char : ''}
                  </button>
                );
              })}
            </div>

            <div className={styles.tileBank}>
              {scrambleTiles.map((tile) => (
                <button
                  key={tile.id}
                  type="button"
                  className={styles.letterTile}
                  disabled={tile.used}
                  onClick={() => pickTile(tile.id)}
                >
                  {tile.char}
                </button>
              ))}
            </div>

            <button
              className={styles.primaryBtn}
              onClick={() => submitCurrentAnswer()}
              disabled={filledCount !== totalLen}
            >
              Submit answer
            </button>
          </div>
        </>
      );
    } else if (event.gameType === 'matching') {
      phaseContent = (
        <>
          {header}
          <div className={styles.questionCard}>
            <p className={styles.hintText}>Chọn 1 mục bên trái rồi chọn mục tương ứng bên phải</p>

            <div className={styles.matchGrid}>
              <div className={styles.matchCol}>
                {matchLeft.map((item) => {
                  const matched = matchedPairs.some((mp) => mp.leftKey === item.key);
                  return (
                    <button
                      key={item.key}
                      type="button"
                      className={styles.matchItem}
                      data-selected={selectedLeftKey === item.key}
                      data-matched={matched}
                      disabled={matched}
                      onClick={() => (matched ? unmatchPair(item.key) : handleLeftClick(item.key))}
                    >
                      {item.text}
                    </button>
                  );
                })}
              </div>
              <div className={styles.matchCol}>
                {matchRight.map((item) => {
                  const matched = matchedPairs.some((mp) => mp.rightKey === item.key);
                  return (
                    <button
                      key={item.key}
                      type="button"
                      className={styles.matchItem}
                      data-matched={matched}
                      disabled={matched || !selectedLeftKey}
                      onClick={() => handleRightClick(item.key)}
                    >
                      {item.text}
                    </button>
                  );
                })}
              </div>
            </div>

            <button
              className={styles.primaryBtn}
              onClick={() => submitCurrentAnswer()}
              disabled={matchedPairs.length === 0}
            >
              Nộp {matchedPairs.length}/{matchLeft.length} cặp
            </button>
          </div>
        </>
      );
    } else {
      phaseContent = (
        <>
          {header}
          <div className={styles.questionCard}>
            <h2>{question.questionText}</h2>
            <div className={styles.options}>
              {question.options.map((opt, i) => (
                <button
                  key={i}
                  className={styles.optionBtn}
                  onClick={() => submitCurrentAnswer({ selectedIndex: i })}
                >
                  <span className={styles.optionLetter}>{String.fromCharCode(65 + i)}</span>
                  {opt}
                </button>
              ))}
            </div>
          </div>
        </>
      );
    }
  } else if (phase === PHASE.ANSWERED) {
    phaseContent = (
      <div className={styles.resultCard} data-correct={lastResult.isCorrect}>
        <span className={styles.resultIcon}>{lastResult.isCorrect ? '✓' : '✕'}</span>
        <h2>{lastResult.isCorrect ? 'Correct!' : 'Incorrect'}</h2>
        <p>+{lastResult.pointsEarned} điểm{lastResult.currentStreak > 1 ? ` · Streak x${lastResult.currentStreak}` : ''}</p>
        <button className={styles.primaryBtn} onClick={goNext}>
          {qIndex + 1 >= event.questions.length ? 'Xem results' : 'Question tiếp theo'}
        </button>
      </div>
    );
  } else if (phase === PHASE.DONE) {
    phaseContent = (
      <div className={styles.doneCard}>
        <span className={styles.eyebrow}>Complete</span>
        <h2>Bạn ghi được {sessionScore} điểm trong lượt này</h2>
        <Link to="/events" className={styles.secondaryBtn}>← Back to events</Link>
      </div>
    );
  } else if (phase === PHASE.ALREADY_PLAYED) {
      phaseContent = (
        <div className={styles.doneCard}>
          <span className={styles.eyebrow}>Đã hoàn thành</span>
          <h2>Bạn đã chơi sự kiện này rồi — {myScore.totalScore} điểm</h2>
          <Link to="/events" className={styles.secondaryBtn}>← Back to events</Link>
        </div>
      );
  }

  return (
    <div className={styles.wrap}>
      <EventLeaderboard eventId={eventId} highlightRefreshKey={leaderboardKey} />
      {phaseContent}
    </div>
  );
}

export default EventPlay;