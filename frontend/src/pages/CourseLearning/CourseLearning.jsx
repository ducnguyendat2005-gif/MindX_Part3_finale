import { useState, useEffect, useMemo, useRef } from "react";
import styles from "./CourseLearning.module.scss";
import { useLocation,useParams } from "react-router-dom";
import greystar from "../../assets/CourseDetail/Star 3 (1).png";
import yellowstar from "../../assets/CourseDetail/Star 3.png";
import bigava from "../../assets/CourseDetail/Ellipse 4 (1).png";
import medal from "../../assets/CourseDetail/Icon (2).png";
import play from "../../assets/CourseDetail/play.png";
import graduation from "../../assets/CourseDetail/graduation-hat-02.png";
import CourseCard from '../../components/CourseCard/CourseCard.jsx'
import vid from '../../assets/Java GUI intro ⭐【5 minutes】 - (1080p).mp4'
import vidrecord from '../../assets/video-recorder.png'
import { API, fetchWithAuth } from '../../config/api.js'

// ==================== SUB-COMPONENTS ====================

function CourseSection({ section, activeLesson, completedLessons, isLessonLocked, onSelect, quizStatus, onSelectQuiz }) {
  const [expanded, setExpanded] = useState(section.defaultExpanded);

  return (
    <div className={styles.courseCompletionSection}>
      <div className={styles.courseCompletionSectionHeader} onClick={() => setExpanded(p => !p)}>
        <div className={`${styles.courseCompletionSectionToggle} ${expanded ? styles.courseCompletionSectionToggleExpanded : ""}`}>
          <div className={styles.courseCompletionArrow}></div>
        </div>
        <div className={styles.courseCompletionSectionTitle}>{section.title}</div>
      </div>

      <div className={`${styles.courseCompletionLessons} ${expanded ? styles.courseCompletionLessonsExpanded : ""}`}>
        {section.lessons.map((lesson) => (
          <Lesson
            key={lesson.storageId}
            lesson={lesson}
            isActive={activeLesson === lesson.storageId}
            isCompleted={completedLessons.has(lesson.storageId)}
            isLocked={isLessonLocked(lesson.storageId)}
            onSelect={onSelect}
          />
        ))}

        {section.quiz && (
          <QuizNavItem
            quiz={section.quiz}
            status={quizStatus}
            onSelect={() => onSelectQuiz(section)}
          />
        )}
      </div>
    </div>
  );
}

const SyllabusSection = ({ course }) => {
  const [openIndexes, setOpenIndexes] = useState(new Set());

  const totalLessons = course.syllabus.reduce(
    (acc, s) => acc + s.lessons,
    0,
  );
  const totalSections = course.syllabus.length;

  const handleToggle = (index) => {
    setOpenIndexes((prev) => {
      const next = new Set(prev);
      if (next.has(index)) {
        next.delete(index);
      } else {
        next.add(index);
      }
      return next;
    });
  };
  const totalHour = (data) => {
    let sum = 0;
    for (let i of data.syllabus.map((s) => s.duration)) {
      sum += parseInt(i);
    }
    return sum;
  };
  return (
    <div className={styles.syllabusDetails}>
      <div className={styles.syllabusHeader}>
        <p className={styles.syllabusTitle}>Syllabus</p>
        <p className={styles.syllabusSummary}>
          {totalSections} sections &nbsp;·&nbsp; {totalLessons} lessons
          &nbsp;·&nbsp; {totalHour(course)} hours total
        </p>
      </div>

      <div className={styles.tableOfContent}>
        {course.syllabus.map((item, index) => (
          <SyllabusItem
            key={index}
            item={item}
            index={index}
            isOpen={openIndexes.has(index)}
            onToggle={handleToggle}
          />
        ))}
      </div>
    </div>
  );
};

const SyllabusItem = ({ item, index, isOpen, onToggle }) => (
  <div className={`${styles.tocCard} ${isOpen ? styles.tocCardOpen : ""}`}>
    <button className={styles.tocHeader} onClick={() => onToggle(index)}>
      <div className={styles.tocLeft}>
        <span className={styles.tocIndex}>
          {String(index + 1).padStart(2, "0")}
        </span>
        <span className={styles.tocTitle}>{item.title}</span>
      </div>
      <div className={styles.tocRight}>
        <span className={styles.tocMeta}>{item.lessons} Lessons</span>
        <span className={styles.tocDot} />
        <span className={styles.tocMeta}>{item.duration}</span>
        <ChevronIcon open={isOpen} />
      </div>
    </button>

    <div className={`${styles.tocBody} ${isOpen ? styles.tocBodyOpen : ""}`}>
      <ul className={styles.lessonList}>
        {item.items.map((lesson, i) => (
          <li key={i} className={styles.lessonItem}>
            <span className={styles.lessonIcon}>
              <PlayIcon />
            </span>
            <span>{lesson}</span>
          </li>
        ))}
      </ul>
    </div>
  </div>
);

const ChevronIcon = ({ open }) => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 16 16"
    fill="none"
    className={`${styles.chevron} ${open ? styles.chevronOpen : ""}`}
  >
    <path
      d="M4 6l4 4 4-4"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const PlayIcon = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
    <circle cx="7" cy="7" r="6.25" stroke="currentColor" strokeWidth="1.25" />
    <path d="M5.5 4.8l4 2.2-4 2.2V4.8z" fill="currentColor" />
  </svg>
);

const QuizIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
    <rect x="4" y="3" width="16" height="18" rx="2" stroke="currentColor" strokeWidth="1.8"/>
    <path d="M9 3h6a1 1 0 0 1 1 1v1a1 1 0 0 1-1 1H9a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1z" 
      fill="currentColor" stroke="currentColor" strokeWidth="1.8"/>
    <path d="M8.5 13l2 2 4-4.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
    <line x1="8" y1="17" x2="16" y2="17" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
  </svg>
);

function Lesson({ lesson, isActive, isCompleted, isLocked, onSelect }) {
  const handleClick = () => {
    if (isLocked) return; // không cho chọn lesson chưa mở khóa
    onSelect(lesson);
  };

  const lessonClass = [
    styles.courseCompletionLesson,
    isCompleted ? styles.courseCompletionLessonCompleted : "",
    isActive ? styles.courseCompletionLessonCurrent : "",   // bỏ "&& !isCompleted"
    isLocked ? styles.courseCompletionLessonLocked : "",
  ].filter(Boolean).join(" ");

  return (
    <div className={lessonClass} onClick={handleClick}>
      <div className={styles.courseCompletionLessonLeft}>
        <div className={styles.courseCompletionCheckbox}>
          <span className={styles.courseCompletionCheckmark}>
            {isCompleted ? "✓" : isLocked ? (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                <rect x="5" y="11" width="14" height="9" rx="2" stroke="currentColor" strokeWidth="2"/>
                <path d="M8 11V7a4 4 0 0 1 8 0v4" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              </svg>
            ) : ""}
          </span>
        </div>
        <div className={styles.courseCompletionLessonInfo}>
          <span className={styles.courseCompletionLessonNumber}>{lesson.id}.</span>
          <span className={styles.courseCompletionLessonTitle}>{lesson.title}</span>
        </div>
      </div>
      <div className={styles.courseCompletionLessonDuration}>
        <img src={vidrecord} alt="video" className={styles.courseCompletionPlayIcon} />
        <span>{lesson.duration}</span>
      </div>
    </div>
  );
}

function QuizNavItem({ quiz, status, onSelect }) {
  const isLocked = status === 'locked';

  const handleClick = () => {
    if (isLocked) return;
    onSelect();
  };

  const itemClass = [
    styles.courseCompletionLesson,
    status === 'passed' ? styles.courseCompletionLessonCompleted : "",
    isLocked ? styles.courseCompletionLessonLocked : "",
  ].filter(Boolean).join(" ");

  return (
    <div className={itemClass} onClick={handleClick}>
      <div className={styles.courseCompletionLessonLeft}>
        <div className={styles.courseCompletionCheckbox}>
          <span className={styles.courseCompletionCheckmark}>
            {status === 'passed' ? "✓" : isLocked ? (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                <rect x="5" y="11" width="14" height="9" rx="2" stroke="currentColor" strokeWidth="2"/>
                <path d="M8 11V7a4 4 0 0 1 8 0v4" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              </svg>
            ) : "?"}
          </span>
        </div>
        <div className={styles.courseCompletionLessonInfo}>
          <span className={styles.courseCompletionLessonTitle}>
            <span className={styles.quizIcon}><QuizIcon /></span>
            {quiz.title}
            {status === 'failed' && (
              <span className={styles.quizFailedTag}>Chưa đạt</span>
            )}
          </span>
        </div>
      </div>
      <div className={styles.courseCompletionLessonDuration}>
        <span>{quiz.questions.length} câu</span>
      </div>
    </div>
  );
}

// Chuyển syllabus từ data.json sang format sections
function buildSections(syllabus = [], courseId = '') {
  return syllabus.map((sec, secIndex) => ({
    id: secIndex + 1,
    sectionId: sec._id || null,   // THÊM MỚI — cần để gọi submitQuizAttempt & khóa section
    quiz: sec.quiz || null,       // THÊM MỚI
    title: sec.title,
    defaultExpanded: secIndex === 0,
    lessons: (sec.lessonDetails?.length
      ? sec.lessonDetails
      : (sec.items || []).map((title) => ({ title, duration: sec.duration })))
      .map((item, i) => ({
      id: i + 1,
      storageId: item._id || `${courseId}_sec${secIndex}_les${i}`,
      title: item.title,
      duration: item.duration || sec.duration || "1 hour",
      videoUrl: item.videoUrl || '',
      current: secIndex === 0 && i === 0,
      })),
  }));
}

function CourseCompletion({ syllabus, courseId, completedLessons, activeLessonId, onSelectLesson, quizAttempts = [], onSelectQuiz }) {
  const sections = useMemo(() => buildSections(syllabus, courseId), [syllabus, courseId]);
  const firstLesson = sections[0]?.lessons[0]?.storageId ?? null;
  const [activeLesson, setActiveLesson] = useState(firstLesson);

  useEffect(() => {
    if (activeLessonId && activeLessonId !== activeLesson) {
      setActiveLesson(activeLessonId);
    }
  }, [activeLessonId]);

  const flatLessons = useMemo(
    () => sections.flatMap(sec => sec.lessons),
    [sections]
  );

  const passedSectionIds = useMemo(
    () => new Set(quizAttempts.filter(a => a.passed).map(a => String(a.sectionId))),
    [quizAttempts]
  );

  // THÊM MỚI — section nào đã có attempt (dù pass hay fail), để phân biệt "chưa làm" và "làm rồi nhưng fail"
  const attemptedSectionIds = useMemo(
    () => new Set(quizAttempts.map(a => String(a.sectionId))),
    [quizAttempts]
  );

  const isLessonLocked = (storageId) => {
    const idx = flatLessons.findIndex(l => l.storageId === storageId);
    if (idx <= 0) return false;
    const prevLesson = flatLessons[idx - 1];
    if (!completedLessons.has(prevLesson.storageId)) return true;

    const currentSectionIndex = sections.findIndex(s => s.lessons[0]?.storageId === storageId);
    if (currentSectionIndex > 0) {
      const prevSection = sections[currentSectionIndex - 1];
      if (prevSection?.quiz && !passedSectionIds.has(String(prevSection.sectionId))) {
        return true;
      }
    }
    return false;
  };

  // THÊM MỚI — tính trạng thái hiển thị cho quiz row: locked / available / passed / failed
  const getQuizStatus = (section) => {
    const allLessonsDone = section.lessons.every(l => completedLessons.has(l.storageId));
    if (!allLessonsDone) return 'locked';
    if (passedSectionIds.has(String(section.sectionId))) return 'passed';
    if (attemptedSectionIds.has(String(section.sectionId))) return 'failed';
    return 'available';
  };

  return (
    <div className={styles.courseCompletion}>
      <div className={styles.courseCompletionHeader}>
        <h1 className={styles.courseCompletionTitle}>Course Completion</h1>
      </div>
      {sections.map((section) => (
        <CourseSection
          key={section.id}
          section={section}
          activeLesson={activeLesson}
          completedLessons={completedLessons}
          isLessonLocked={isLessonLocked}
          onSelect={(lesson) => {
            if (isLessonLocked(lesson.storageId)) return;
            setActiveLesson(lesson.storageId);
            onSelectLesson?.(lesson);
          }}
          quizStatus={section.quiz ? getQuizStatus(section) : null}
          onSelectQuiz={onSelectQuiz}
        />
      ))}
    </div>
  );
}

function QuizModal({ section, courseId, onClose, onPassed }) {
  const quiz = section.quiz;
  const [answers, setAnswers] = useState(Array(quiz.questions.length).fill(null));
  const [result, setResult] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSelect = (qIndex, optIndex) => {
    setAnswers((prev) => prev.map((a, i) => (i === qIndex ? optIndex : a)));
  };

  const handleSubmit = async () => {
    if (answers.some((a) => a === null)) {
      setError('Vui lòng trả lời tất cả câu hỏi.');
      return;
    }
    setSubmitting(true);
    setError('');
    try {
      const res = await fetchWithAuth(API.submitQuizAttempt(courseId), {
        method: 'POST',
        body: JSON.stringify({ sectionId: section.sectionId, answers }),
      });
      const body = await res.json();
      if (!res.ok) {
        setError(body.message || 'Nộp bài thất bại');
        return;
      }
      setResult(body.data);
      if (body.data.passed) onPassed?.();
    } catch (err) {
      setError('Không kết nối được server');
    } finally {
      setSubmitting(false);
    }
  };

  const handleRetry = () => {
    setResult(null);
    setAnswers(Array(quiz.questions.length).fill(null));
    setError('');
  };

  return (
    <div className={styles.quizOverlay}>
      <div className={styles.quizModal}>
        <div className={styles.quizHeader}>
          <h2>{quiz.title}</h2>
          <button
            onClick={onClose}
            aria-label="Đóng"
            className={styles.quizCloseBtn}
          >
            ×
          </button>
        </div>

        {!result ? (
          <>
            {quiz.questions.map((q, qIndex) => (
              <div key={qIndex} className={styles.quizQuestion}>
                <p>{qIndex + 1}. {q.question}</p>
                {q.options.map((opt, optIndex) => (
                  <label key={optIndex} className={styles.quizOption}>
                    <input
                      type="radio"
                      name={`q-${qIndex}`}
                      checked={answers[qIndex] === optIndex}
                      onChange={() => handleSelect(qIndex, optIndex)}
                    />
                    {opt}
                  </label>
                ))}
              </div>
            ))}
            {error && <p className={styles.quizError}>{error}</p>}
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className={styles.quizSubmitBtn}
            >
              {submitting ? 'Đang nộp...' : 'Nộp bài'}
            </button>
          </>
        ) : (
          <div>
            <p className={styles.quizResultScore}>
              Điểm: {result.score}% ({result.correctCount}/{result.totalQuestions} đúng)
            </p>
            <p className={result.passed ? styles.quizResultPass : styles.quizResultFail}>
              {result.passed ? '✅ Bạn đã đạt!' : `❌ Chưa đạt (cần ${result.passingScore}%)`}
            </p>

            {result.review.map((r, i) => (
              <div key={i} className={styles.quizReviewItem}>
                <p className={styles.quizReviewQuestion}>{i + 1}. {r.question}</p>
                <p className={r.selectedIndex === r.correctIndex ? styles.quizAnswerCorrect : styles.quizAnswerWrong}>
                  Bạn chọn: {r.options[r.selectedIndex]}
                </p>
                {r.selectedIndex !== r.correctIndex && (
                  <p className={styles.quizAnswerCorrect}>Đáp án đúng: {r.options[r.correctIndex]}</p>
                )}
                {r.explanation && <p className={styles.quizExplanation}>{r.explanation}</p>}
              </div>
            ))}

            <div className={styles.quizActions}>
              {result.passed ? (
                <button onClick={onClose} className={styles.quizContinueBtn}>
                  Tiếp tục học
                </button>
              ) : (
                <button onClick={handleRetry} className={styles.quizRetryBtn}>
                  Làm lại
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

const navButtons = [
  { label: "Details",    tab: "description" },
  { label: "Instructor", tab: "instructor"  },
  { label: "Courses",    tab: "syllabus"    },
  { label: "Reviews",    tab: "reviews"     },
];

function CourseNavbar({ activeNav, setActiveNav, setActiveTab }) {
  return (
    <div className={styles.courseNavbar}>
      {navButtons.map(({ label, tab }) => (
        <div key={label} className={styles.navBarButton}>
          <button
            className={`${styles.navBtn} ${activeNav === label ? styles.navBtnActive : ""}`}
            onClick={() => { setActiveNav(label); setActiveTab(tab); }}
          >
            {label}
          </button>
        </div>
      ))}
    </div>
  );
}

const sameCourse = ({data,course}) => {
  let fil1 = data.filter(element => element.category === course.category)
  let fil2 = fil1.filter(e => e.level === course.level)
  return fil2
}

const buildReviewStats = (reviews) => {
  const list = Array.isArray(reviews) ? reviews : [];
  const total = list.length;
  if (total === 0) {
    return { averageRating: 0, totalReviews: 0, ratingBreakdown: { 5:0,4:0,3:0,2:0,1:0 } };
  }
  const sum = list.reduce((acc, r) => acc + r.rating, 0);
  const counts = { 5:0,4:0,3:0,2:0,1:0 };
  list.forEach(r => { counts[r.rating] = (counts[r.rating] || 0) + 1; });
  const ratingBreakdown = {};
  Object.keys(counts).forEach(star => {
    ratingBreakdown[`${star}_star`] = `${Math.round((counts[star] / total) * 100)}%`;
  });
  return { averageRating: (sum / total).toFixed(1), totalReviews: total, ratingBreakdown };
};

function ReviewForm({ courseId, onReviewPosted }) {
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    if (!comment.trim()) {
      setError('Please write your reviews here');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const res = await fetchWithAuth(API.postReview(courseId), {
        method: 'POST',
        body: JSON.stringify({ rating, comment }),
      });
      const result = await res.json();

      if (!res.ok) {
        setError(result.message || 'Error,please try again');
        return;
      }

      setComment('');
      setRating(5);
      onReviewPosted(result.data);
    } catch (err) {
      setError('Cant connect server');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.reviewForm}>
      <p>Leave your comments here</p>
      {error && <p style={{ color: 'red' }}>{error}</p>}
      <select value={rating} onChange={(e) => setRating(Number(e.target.value))}>
        {[5, 4, 3, 2, 1].map((n) => (
          <option key={n} value={n}>{n} star</option>
        ))}
      </select>
      <textarea
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        placeholder="Your comment here"
        rows={4}
      />
      <button onClick={handleSubmit} disabled={loading}>
        {loading ? 'Sending...' : 'Send ratings'}
      </button>
    </div>
  );
}
function LearnerReviewsShowcase({ course, reviewStats }) {
  const breakdown = [5, 4, 3, 2, 1].map((n) => ({
    stars: n,
    percent: reviewStats.ratingBreakdown[`${n}_star`] || "0%",
  }));

  const formatDate = (d) => {
    const date = new Date(d);
    return isNaN(date) ? "" : date.toLocaleDateString("vi-VN");
  };

  return (
    <div className={styles.lrSection}>
      <h2 className={styles.lrHeading}>Learner Reviews</h2>

      <div className={styles.lrBody}>
        {/* Left: rating summary */}
        <div className={styles.lrSummary}>
          <div className={styles.lrScoreRow}>
            <img src={yellowstar} alt="star" className={styles.lrStarIcon} />
            <span className={styles.lrScore}>{reviewStats.averageRating}</span>
          </div>
          <p className={styles.lrTotal}>
            {reviewStats.totalReviews.toLocaleString("vi-VN")} reviews
          </p>

          {breakdown.map(({ stars, percent }) => (
            <div key={stars} className={styles.lrBarRow}>
              <div className={styles.lrBarStars}>
                {Array.from({ length: 5 }).map((_, i) => (
                  <img
                    key={i}
                    src={i < stars ? yellowstar : greystar}
                    alt="star"
                    className={styles.lrBarStarIcon}
                  />
                ))}
              </div>
              <span className={styles.lrBarPercent}>{percent}</span>
            </div>
          ))}
        </div>

        {/* Right: individual review cards */}
        <div className={styles.lrList}>
          {course.reviews.map((r) => (
            <div key={r._id} className={styles.lrCard}>
              <img src={bigava} alt={r.name} className={styles.lrAvatar} />
              <div className={styles.lrCardContent}>
                <div className={styles.lrCardTop}>
                  <span className={styles.lrName}>{r.name}</span>
                  <span className={styles.lrRatingBadge}>
                    <img src={yellowstar} alt="star" className={styles.lrBarStarIcon} />
                    {r.rating}
                  </span>
                  <span className={styles.lrDate}>Reviewed on {formatDate(r.createdAt)}</span>
                </div>
                <p className={styles.lrComment}>{r.comment}</p>
              </div>
            </div>
          ))}

          <button className={styles.lrMoreBtn}>View more Reviews</button>
        </div>
      </div>
    </div>
  );
}

function LearnerReviews({ course, reviewStats, onReviewPosted, showForm = true }) {
  return (
    <div className={styles.reviews}>
      <p>Learner Reviews</p>
      <div className={styles.stars}>
        <div className={styles.starReview}>
          <img src={yellowstar} alt="star" />
          <p>{reviewStats.averageRating}</p>
          <p>{reviewStats.totalReviews.toLocaleString('vi-VN')} reviews</p>
        </div>
        <div className={styles.star5}>
          <img src={yellowstar} alt="star" />
          <img src={yellowstar} alt="star" />
          <img src={yellowstar} alt="star" />
          <img src={yellowstar} alt="star" />
          <img src={yellowstar} alt="star" />
          <p>{reviewStats.ratingBreakdown["5_star"]}</p>
        </div>
        <div className={styles.star4}>
          <img src={yellowstar} alt="star" />
          <img src={yellowstar} alt="star" />
          <img src={yellowstar} alt="star" />
          <img src={yellowstar} alt="star" />
          <img src={greystar} alt="star" />
          <p>{reviewStats.ratingBreakdown["4_star"]}</p>
        </div>
        <div className={styles.star3}>
          <img src={yellowstar} alt="star" />
          <img src={yellowstar} alt="star" />
          <img src={yellowstar} alt="star" />
          <img src={greystar} alt="star" />
          <img src={greystar} alt="star" />
          <p>{reviewStats.ratingBreakdown["3_star"]}</p>
        </div>
        <div className={styles.star2}>
          <img src={yellowstar} alt="star" />
          <img src={yellowstar} alt="star" />
          <img src={greystar} alt="star" />
          <img src={greystar} alt="star" />
          <img src={greystar} alt="star" />
          <p>{reviewStats.ratingBreakdown["2_star"]}</p>
        </div>
        <div className={styles.star1}>
          <img src={yellowstar} alt="star" />
          <img src={greystar} alt="star" />
          <img src={greystar} alt="star" />
          <img src={greystar} alt="star" />
          <img src={greystar} alt="star" />
          <p>{reviewStats.ratingBreakdown["1_star"]}</p>
        </div>
      </div>
      {showForm && <ReviewForm courseId={course._id} onReviewPosted={onReviewPosted} />}
      <div className={styles.review}>
        {course.reviews.map((i) => (
          <div key={i._id} className={styles.reviewCard}>
            <div className={styles.ava}>
              <img src={bigava} alt="avatar" />
              <p>{i.name}</p>
            </div>
            <div className={styles.starRating}>
              <img src={yellowstar} alt="star" />
              <p>{i.rating}</p>
            </div>
            <p>Reviewed on {new Date(i.createdAt).toLocaleDateString('vi-VN')}</p>
            <p>{i.comment}</p>
          </div>
        ))}
      </div>
      <button id="more-reviews">View more Reviews</button>
    </div>
  );
}

// ==================== MAIN PAGE ====================
export default function CourseLearning() {
  const [allCourse, setAllCourse] = useState([]);
  const [activeNav, setActiveNav] = useState("Details");
  const [activeTab, setActiveTab] = useState('description');
  const videoRef = useRef(null);
  const furthestTime = useRef(0); 
  const location = useLocation();

  useEffect(() => {
    fetch(API.courses)
      .then(res => res.json())
      .then(result => setAllCourse(result.data))
      .catch(err => console.error(err))
  }, [])

  // Nhận data từ Link state (truyền từ MyCoursePage)
  const { id } = useParams();
  const [course, setCourse] = useState(null);
  const [activeLesson, setActiveLesson] = useState(null);
  const [completedLessons, setCompletedLessons] = useState(new Set());
    const [quizAttempts, setQuizAttempts] = useState([]); // THÊM MỚI
  const [activeQuiz, setActiveQuiz] = useState(null); 

  useEffect(() => {
    furthestTime.current = 0;
    if (videoRef.current) {
      videoRef.current.load(); // ép trình duyệt load lại <source> mới
    }
  }, [activeLesson?.storageId]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCourse = async () => {
      try {
        const storedUser = JSON.parse(localStorage.getItem('loggedInUser') || '{}');
        const courseEndpoint = storedUser.role === 'teacher'
          ? API.teachingCourseById(id)
          : API.courseById(id);
        const res = storedUser.role === 'teacher'
          ? await fetchWithAuth(courseEndpoint)
          : await fetch(courseEndpoint);
        const result = await res.json();
        setCourse(result.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchCourse();
  }, [id]);

  useEffect(() => {
    if (!course?._id) return;
    const loadProgress = async () => {
      try {
        const res = await fetchWithAuth(API.getProgress(course._id));
        if (!res.ok) return; // vd 404 khi giáo viên preview, chưa mua khóa học → bỏ qua
        const result = await res.json();
        setCompletedLessons(new Set(result.data.completedLessons.map(String)));
        setQuizAttempts(result.data.quizAttempts ?? []);
      } catch (err) {
        console.error('Không tải được tiến trình:', err);
      }
    };
    loadProgress();
  }, [course?._id]);

  const handleReviewPosted = (newReview) => {
  setCourse(prev => ({
    ...prev,
    reviews: [newReview, ...(prev.reviews ?? [])],
  }));
};
  const handleTimeUpdate = () => {
    const video = videoRef.current;
    if (!video) return;
    if (video.currentTime > furthestTime.current) {
      furthestTime.current = video.currentTime;
    }
  };

  const handleSeeking = () => {
    const video = videoRef.current;
    if (!video) return;
    if (video.currentTime > furthestTime.current + 1) {
      video.currentTime = furthestTime.current;
    }
  };

    const learningSections = useMemo(() => { // THÊM MỚI — dùng chung cho cả auto-advance lẫn tìm section chứa lesson
    if (!course?.syllabus) return [];
    return buildSections(course.syllabus, String(course._id));
  }, [course]);

  const flatLessonsForAutoAdvance = useMemo(
    () => learningSections.flatMap(sec => sec.lessons),
    [learningSections]
  );

  const handleEnded = async () => {
    if (!activeLesson?.storageId || !course?._id) return;
    try {
      const res = await fetchWithAuth(API.updateProgress(course._id), {
        method: 'PUT',
        body: JSON.stringify({ lessonId: activeLesson.storageId }),
      });
      if (!res.ok) return;

      setCompletedLessons(prev => new Set(prev).add(activeLesson.storageId));

      const currentIndex = flatLessonsForAutoAdvance.findIndex(
        l => l.storageId === activeLesson.storageId
      );
      const nextLesson = flatLessonsForAutoAdvance[currentIndex + 1];
      if (nextLesson) {
        setActiveLesson(nextLesson);
      }
    } catch (err) {
      console.error('Cập nhật tiến trình thất bại:', err);
    }
  };

  // THÊM MỚI — đóng modal quiz sau khi pass, tự chuyển sang lesson kế tiếp
  const handleQuizClosed = () => {
    setActiveQuiz(null);
  };

  // THÊM MỚI — được gọi khi học viên bấm vào quiz row trong sidebar
  const handleSelectQuiz = (section) => {
    setActiveQuiz({ section });
  };

  // THÊM MỚI — cập nhật quizAttempts ngay khi pass (optimistic), để sidebar mở khóa mà không cần load lại trang
  const handleQuizPassed = (sectionId) => {
    setQuizAttempts(prev => [...prev, { sectionId, passed: true, score: 100 }]);
  };
  if (loading) return <p style={{ padding: "2rem", color: "#94a3b8" }}>Đang tải...</p>;
  if (!course) return <p style={{ padding: "2rem", color: "#94a3b8" }}>Không tìm thấy dữ liệu khoá học.</p>;

  // Shortcut — course đã flatten, không còn field "details" lồng nữa
  const instructor = course.instructorId ?? {};
  const syllabus = course.syllabus ?? [];
  const reviewStats = buildReviewStats(course.reviews);

  return (
    <>
      <div className={styles.background}></div>
      

      <div className={styles.mainPage}>
        <div className={styles.course}>

          {/* Title — lấy từ course.title */}
          <div className={styles.title}>
            <p>{course.title}</p>
          </div>

          {/* Sidebar: Course Completion — dùng syllabus thực */}
          <div className={styles.courseCom}>
            <CourseCompletion
              syllabus={syllabus}
              courseId={String(course._id)}
              completedLessons={completedLessons}
              activeLessonId={activeLesson?.storageId}
              onSelectLesson={setActiveLesson}
              quizAttempts={quizAttempts}
              onSelectQuiz={handleSelectQuiz}
            />
          </div>

          {/* Video */}
          <div className={styles.cVid}>
            <video
              ref={videoRef}
              width="95%"
              height="95%"
              controls
              controlsList="nodownload"
              poster={course.thumbnail || 'thumbnail.jpg'}
              onTimeUpdate={handleTimeUpdate}
              onSeeking={handleSeeking}
              onEnded={handleEnded}
            >
              <source
                src={activeLesson?.videoUrl || course.promotionalVideo || vid}
                type={activeLesson?.videoUrl?.endsWith('.webm') ? 'video/webm' : 'video/mp4'}
              />
              Trình duyệt của bạn không hỗ trợ thẻ video.
            </video>
          </div>

          {/* Nav */}
          <CourseNavbar activeNav={activeNav} setActiveNav={setActiveNav} setActiveTab={setActiveTab} />

          {/* Separator 1 */}
          <div className={styles.sepLine1}></div>

          {/* Course Description — lấy từ details */}
          <div className={styles.contWrapper}>
              <div
                className={styles.tabTrack}
                style={{ transform: `translateX(-${['description','instructor','syllabus','reviews'].indexOf(activeTab) * 25}%)` }}
              >
  
              {/* Description Tab */}
              <div className={styles.tabSlide}>
                <div className={styles.courseDes}>
                  <p>Course Description</p>
                  <p>
                    {course.courseDescription}
                  </p>
                  <p>Certification</p>
                  <p>
                    {course.certification}
                  </p>
                </div>
              </div>
  
              {/* Instructor Tab */}
              <div className={styles.tabSlide}>
                <div className={styles.instructorDetails}>
                  <p>{course.instructorId?.name}</p>
                    <p>{course.instructorId?.title}</p>
                    <div className={styles.instructorProfile}>
                      <img src={bigava} alt="instructor" />
                      <p>{course.instructorId?.totalReviews} Reviews</p>
                      <img id="medal" src={medal} alt="medal" />
                      <img src={play} alt="play" />
                      <img src={graduation} alt="grad" />
                      <p>{course.instructorId?.totalStudents} Students</p>
                      <p>{course.instructorId?.totalCourses} Courses</p>
                    </div>
                    <p>{course.instructorId?.bio}</p>
                </div>
              </div>
  
              {/* Syllabus Tab */}
              <div className={styles.tabSlide}>
                <SyllabusSection course={course}></SyllabusSection>
              </div>
  
              {/* Reviews Tab */}
              <div className={styles.tabSlide}>
                <LearnerReviews
                  course={course}
                  reviewStats={reviewStats}
                  onReviewPosted={handleReviewPosted}
                />
              </div>
  
            </div>{/* end tabTrack */}
            </div>{/* end contWrapper */}
        </div>

        <div className={styles.courses}>
          <h2 className={styles.divTitle}>More Courses Like This</h2>
          <div className={styles.courseList}>
            {sameCourse({ data: allCourse, course: course }).map((data) =>
            <div key={data.id} onClick={() => window.location.reload()}> 
            <CourseCard
              key={data._id}
              id={data._id}
              title={data.title}
              instructor={data.instructorId?.name}
              rating={data.rating}
              ratingCount={data.reviews?.length ?? 0}
              duration={`${data.hours} Total Hours. ${data.lectures} Lectures. ${data.level}`}
              category={data.category}
              price={`$${data.price}`}
              >

            </CourseCard>
            </div>)}
          </div>
        </div>

        {/* Learner Reviews — luôn hiển thị, không phụ thuộc tab */}
        <div className={styles.reviewsStandalone}>
          <LearnerReviewsShowcase course={course} reviewStats={reviewStats} />
        </div>

      </div>

            {activeQuiz && (
        <QuizModal
          section={activeQuiz.section}
          courseId={course._id}
          onClose={handleQuizClosed}
          onPassed={() => handleQuizPassed(activeQuiz.section.sectionId)}
        />
      )}
    </>
  );
}
