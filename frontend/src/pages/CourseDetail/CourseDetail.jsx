import styles from "./CourseDetail.module.scss";
import CourseCard from "../../components/CourseCard/CourseCard";
import { useParams } from "react-router-dom";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { API } from '../../config/api.js'
import CourseImg from "../../assets/CourseDetail/image 4.png";
import greystar from "../../assets/CourseDetail/Star 3 (1).png";
import yellowstar from "../../assets/CourseDetail/Star 3.png";
import smolAva from "../../assets/CourseDetail/Ellipse 5.png";
import bigava from "../../assets/CourseDetail/Ellipse 4 (1).png";
import starRating from "../../assets/CourseDetail/Rating.png";
import globe from "../../assets/CourseDetail/Icon (1).png";
import sideArrow from "../../assets/CourseDetail/Vector.png";
import medal from "../../assets/CourseDetail/Icon (2).png";
import play from "../../assets/CourseDetail/play.png";
import graduation from "../../assets/CourseDetail/graduation-hat-02.png";
import facebook from "../../assets/facebook.png";
import github from "../../assets/github.png";
import google from "../../assets/google.jpg";
import microsoft from "../../assets/microsoft.png";
import twitter from "../../assets/twitter.png";

const scrollToTop = () => {
  window.scrollTo({ top: 0, behavior: 'smooth' });
};

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

const sameCourse = ({data,course}) => {
  let fil1 = data.filter(element => element.category === course.category)
  let fil2 = fil1.filter(e => e.level === course.level)
  return fil2
}

const saleCount = (promotionalPrice,originalPrice) => {
  return Math.round((1 - promotionalPrice / originalPrice) * 100)
}

const buildReviewStats = (reviews = []) => {
  const total = reviews.length;
  if (total === 0) {
    return { averageRating: 0, totalReviews: 0, ratingBreakdown: { 5:0,4:0,3:0,2:0,1:0 } };
  }
  const sum = reviews.reduce((acc, r) => acc + r.rating, 0);
  const counts = { 5:0,4:0,3:0,2:0,1:0 };
  reviews.forEach(r => { counts[r.rating] = (counts[r.rating] || 0) + 1; });
  const ratingBreakdown = {};
  Object.keys(counts).forEach(star => {
    ratingBreakdown[`${star}_star`] = `${Math.round((counts[star] / total) * 100)}%`;
  });
  return { averageRating: (sum / total).toFixed(1), totalReviews: total, ratingBreakdown };
};



const CourseDetail = () => {
  const { id } = useParams(); 
  const [allCourse, setAllCourse] = useState([]);
  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('description');
  const [user,setUser] = useState(null);
  const [added, setAdded] = useState(false);
  const isOwned = user?.myCourses?.some(c => String(c._id) === String(id)) ?? false;
  const [showToast, setShowToast] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const loadUser = () => {
      const stored = localStorage.getItem('loggedInUser');
      setUser(stored ? JSON.parse(stored) : null);
    };
    loadUser();
    window.addEventListener('userUpdated', loadUser);
    return () => window.removeEventListener('userUpdated', loadUser);
  }, []);

  const handleAddtoCart = () => {
    const existing = JSON.parse(localStorage.getItem('insideCarts') || '[]');
    const alreadyInCart = existing.some(item => item._id === course._id);
    if (alreadyInCart) {
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
      return;
    }
    const updated = [...existing, course];
    localStorage.setItem('insideCarts', JSON.stringify(updated));
    window.dispatchEvent(new Event('cartUpdated'));
    setAdded(true);
  };

  const handleBuynow = () => {
    if (!user) {
      navigate('/sign-in');
      return;
    }
    navigate(`/home/course-page/${id}/buynow`, {
      state: { course: [course] }  // cart: [course]truyền thẳng 1 course
    });
  };

  useEffect(() => {
  const fetchCourse = async () => {
    try {
      const response = await fetch(API.courseById(id));
      const result = await response.json();
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
  fetch(API.courses)
    .then(res => res.json())
    .then(result => setAllCourse(result.data))
    .catch(err => console.error(err))
}, [])

  

  if (loading) return <p>Đang tải...</p>;
  if (!course) return <p>Không tìm thấy khóa học</p>;
  const reviewStats = buildReviewStats(course.reviews);

  const hasDiscount =
    course.promotionalPrice &&
    course.promotionalPrice > 0 &&
    course.promotionalPrice < course.price;
  return (
    <>
      {showToast && (
        <div style={{
          position: 'fixed',
          top: '24px',
          right: '24px',
          zIndex: 9999,
          backgroundColor: '#1e293b',
          color: '#fff',
          padding: '14px 20px',
          borderRadius: '10px',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          boxShadow: '0 4px 16px rgba(0,0,0,0.25)',
          animation: 'fadeIn 0.3s ease',
        }}>
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <circle cx="10" cy="10" r="10" fill="#f59e0b" />
            <path d="M10 6v4M10 13h.01" stroke="#fff" strokeWidth="1.8"
              strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <span>Course already in cart!</span>
        </div>
      )}

      <div className={styles.background}></div>
      <div className={styles.background2}></div>

      <div className={styles.mainPage}>
        <div className={styles.course}>
          <div className={styles.link}>
            <a onClick={() => navigate('/home')}>Home</a>
            <img src={sideArrow} alt="arrow" />
            <a onClick={() => navigate('/course-page')}>Categories</a>
            <img src={sideArrow} alt="arrow" />
            <a>{course.title}</a>
          </div>

          <div className={styles.mainTitle}>
            <p>{course.title}</p>
            <p>
              {course.shortDescription}
            </p>
            <div className={styles.ratingNDetails}>
              <p style={{ color: "#fcad03" }}>{course.rating}</p>
              <img src={yellowstar} alt="rating" />
              <p>({course.reviews?.length ?? 0} reviews)</p>
              <div></div>
              <p>{course.hours} Total Hours. {course.lectures} Lectures. All levels</p>
            </div>
            <div className={styles.teacherDetails}>
              <img src={smolAva} alt="avatar" />
              <p>Created by</p>
              <p>{course.instructorId?.name}</p>
            </div>
            <div className={styles.availLanguage}>
              <img src={globe} alt="language" />
              {<p>{course.languages.join(', ')}</p>}
            </div>
          </div>

          <div className={styles.teacherNBuy}>
            <div className={styles.teacherInfo}>
              <img src={CourseImg} alt="course thumbnail" />
              <div className={styles.price}>
                {hasDiscount ? (
                  <>
                    <p>${course.promotionalPrice}</p>
                    <p style={{ textDecoration: "line-through", color: "lightgrey" }}>
                      ${course.price}
                    </p>
                    <p style={{ color: "#16A34A" }}>
                      {saleCount(course.promotionalPrice, course.price)}% OFF!
                    </p>
                  </>
                ) : (
                  <p>${course.price}</p>
                )}
              </div>

              {isOwned ? (
                <button
                  onClick={() => navigate('/mycoursespage')}
                  className={styles.learnNowButton}
                >
                  🎓 Learn Now
                </button>
              ) : (
                <>
                  <button
                    onClick={() => user ? handleAddtoCart() : navigate('/sign-in')}
                    className={`${styles.addToCartButton} ${added ? styles.addToCartAdded : ''}`}
                  >
                    {added ? (
                      <>
                        <span className={styles.checkIcon}>
                          <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                            <circle cx="9" cy="9" r="9" fill="#16a34a" />
                            <path d="M5 9.5l3 3 5-5.5" stroke="#fff" strokeWidth="1.8"
                              strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        </span>
                        Added to Cart
                      </>
                    ) : 'Add To Cart'}
                  </button>
                  <button onClick={() => handleBuynow()} className={styles.buyNowButton}>
                    Buy Now
                  </button>
                </>
              )}

              <div className={styles.tnbSl}></div>
              <div className={styles.shareInfo}>
                <p>Share</p>
                <div className={styles.shareGroup}>
                  <a href="#" className={styles.sharedButton1}>
                    <img src={facebook} alt="Facebook" />
                  </a>
                  <a href="#" className={styles.sharedButton2}>
                    <img src={github} alt="GitHub" />
                  </a>
                  <a href="#" className={styles.sharedButton3}>
                    <img src={google} alt="Google" />
                  </a>
                  <a href="#" className={styles.sharedButton4}>
                    <img src={twitter} alt="X" />
                  </a>
                  <a href="#" className={styles.sharedButton5}>
                    <img src={microsoft} alt="Windows" />
                  </a>
                </div>
              </div>
            </div>
          </div>

          <div className={styles.courseNavbar}>
            {['description', 'instructor', 'syllabus', 'reviews'].map((tab) => (
              <button
                key={tab}
                className={`${styles.navBtn} ${activeTab === tab ? styles.navBtnActive : ''}`}
                onClick={() => setActiveTab(tab)}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </div>

          <div className={styles.sepLine1}></div>
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
                <p>
                  {course.instructorId?.bio}
                </p>
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
            </div>

          </div>{/* end tabTrack */}
          </div>{/* end contWrapper */}
      </div>

        <div className={styles.courses}>
          <h2 className={styles.divTitle}>More Courses Like This</h2>
          <div className={styles.courseList}>
            {sameCourse({ data: allCourse, course: course }).map((data) =>
            <div key={data._id} onClick={() => window.location.reload()}> 
            <CourseCard
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
};

export default CourseDetail;