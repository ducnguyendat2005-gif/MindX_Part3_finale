import { useState, useEffect, useMemo } from "react";
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

function CourseSection({ section, activeLesson, onSelect }) {
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
            onSelect={onSelect}
          />
        ))}
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
function Lesson({ lesson, isActive, onSelect }) {
  const storageKey = `lesson_completed_${lesson.storageId}`;
  const [completed, setCompleted] = useState(() => {
    return localStorage.getItem(storageKey) === 'true';
  });

  const handleClick = () => {
    const next = !completed;
    setCompleted(next);
    localStorage.setItem(storageKey, String(next));
    onSelect(lesson.storageId);
  };

  const lessonClass = [
    styles.courseCompletionLesson,
    completed ? styles.courseCompletionLessonCompleted : "",
    isActive && !completed ? styles.courseCompletionLessonCurrent : "",
  ].filter(Boolean).join(" ");

  return (
    <div className={lessonClass} onClick={handleClick}>
      <div className={styles.courseCompletionLessonLeft}>
        <div className={styles.courseCompletionCheckbox}>
          <span className={styles.courseCompletionCheckmark}>{completed ? "✓" : ""}</span>
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

// Chuyển syllabus từ data.json sang format sections
function buildSections(syllabus = [], courseId = '') {
  return syllabus.map((sec, secIndex) => ({
    id: secIndex + 1,
    title: sec.title,
    defaultExpanded: secIndex === 0,
    lessons: sec.items.map((item, i) => ({
      id: i + 1,
      storageId: `${courseId}_sec${secIndex}_les${i}`,
      title: item,
      duration: sec.duration || "1 hour",
      current: secIndex === 0 && i === 0,
    })),
  }));
}

function CourseCompletion({ syllabus, courseId }) {
  const sections = useMemo(() => buildSections(syllabus, courseId), [syllabus, courseId]);
  const firstLesson = sections[0]?.lessons[0]?.storageId ?? null;
  const [activeLesson, setActiveLesson] = useState(firstLesson);

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
          onSelect={setActiveLesson}
        />
      ))}
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
        {loading ? 'Đang gửi...' : 'Gửi đánh giá'}
      </button>
    </div>
  );
}
// ==================== MAIN PAGE ====================
export default function CourseLearning() {
  const [allCourse, setAllCourse] = useState([]);
  const [activeNav, setActiveNav] = useState("Details");
  const [activeTab, setActiveTab] = useState('description');
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
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCourse = async () => {
      try {
        const res = await fetch(API.courseById(id));
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

  const handleReviewPosted = (newReview) => {
  setCourse(prev => ({
    ...prev,
    reviews: [newReview, ...(prev.reviews ?? [])],
  }));
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
            <CourseCompletion syllabus={syllabus} courseId={String(course._id)} />
          </div>

          {/* Video */}
          <div className={styles.cVid}>
            <video width="95%" height="95%" controls poster="thumbnail.jpg">
              <source src={vid} type="video/mp4" />
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
                <ReviewForm courseId={course._id} onReviewPosted={handleReviewPosted} />
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
                        <p>
                          {i.comment}
                        </p>
                      </div>
                    ))}
                  </div>
  
                  <button id="more-reviews">View more Reviews</button>
                </div>
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
        
      </div>

      
    </>
  );
}