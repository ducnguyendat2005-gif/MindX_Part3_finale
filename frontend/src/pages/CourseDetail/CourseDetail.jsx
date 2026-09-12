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
import { normalizeCartItem } from "../../utils/pricing.js";
import { useLanguage } from "../../context/LanguageContext.jsx";

const WISHLIST_KEY = 'wishlistedCourses';

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

const SyllabusItem = ({ item, index, isOpen, onToggle }) => {
  const { t } = useLanguage();
  return (
  <div className={`${styles.tocCard} ${isOpen ? styles.tocCardOpen : ""}`}>
    <button className={styles.tocHeader} onClick={() => onToggle(index)}>
      <div className={styles.tocLeft}>
        <span className={styles.tocIndex}>
          {String(index + 1).padStart(2, "0")}
        </span>
        <span className={styles.tocTitle}>{item.title}</span>
      </div>
      <div className={styles.tocRight}>
        <span className={styles.tocMeta}>{item.lessons} {t('detail.lessons')}</span>
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
};

const SyllabusSection = ({ course }) => {
  const { t } = useLanguage();
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
        <p className={styles.syllabusTitle}>{t('detail.syllabus')}</p>
        <p className={styles.syllabusSummary}>
          {totalSections} {t('detail.sections')} &nbsp;·&nbsp; {totalLessons} {t('detail.lessons')}
          &nbsp;·&nbsp; {totalHour(course)} {t('detail.hoursTotal')}
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
    return {
      averageRating: '0.0',
      totalReviews: 0,
      ratingBreakdown: {
        '5_star': '0%',
        '4_star': '0%',
        '3_star': '0%',
        '2_star': '0%',
        '1_star': '0%',
      },
    };
  }
  const sum = reviews.reduce((acc, r) => acc + Number(r.rating || 0), 0);
  const counts = { 5:0,4:0,3:0,2:0,1:0 };
  reviews.forEach(r => { counts[r.rating] = (counts[r.rating] || 0) + 1; });
  const ratingBreakdown = {};
  Object.keys(counts).forEach(star => {
    ratingBreakdown[`${star}_star`] = `${Math.round((counts[star] / total) * 100)}%`;
  });
  return { averageRating: (sum / total).toFixed(1), totalReviews: total, ratingBreakdown };
};

const formatReviewDate = (value) => {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '' : date.toLocaleDateString('vi-VN');
};



const CourseDetail = () => {
  const { t } = useLanguage();
  const { id } = useParams(); 
  const [allCourse, setAllCourse] = useState([]);
  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('description');
  const [user, setUser] = useState(null);
  const [added, setAdded] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [showAllReviews, setShowAllReviews] = useState(false);
  const navigate = useNavigate();

const isOwned = user?.myCourses?.some(c => c && String(c._id) === String(id)) ?? false;

  useEffect(() => {
    const loadUser = () => {
      const stored = localStorage.getItem('loggedInUser');
      setUser(stored ? JSON.parse(stored) : null);
    };
    loadUser();
    window.addEventListener('userUpdated', loadUser);
    return () => window.removeEventListener('userUpdated', loadUser);
  }, []);

  useEffect(() => {
    const savedList = JSON.parse(localStorage.getItem(WISHLIST_KEY) || '[]');
    setIsFavorite(savedList.some((item) => String(item._id) === String(id)));
  }, [id]);

  const handleAddtoCart = () => {
    const existing = JSON.parse(localStorage.getItem('insideCarts') || '[]');
    const alreadyInCart = existing.some(item => String(item._id || item.id) === String(course._id));
    if (alreadyInCart) {
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
      return;
    }
    const updated = [...existing, normalizeCartItem(course)];
    localStorage.setItem('insideCarts', JSON.stringify(updated));
    window.dispatchEvent(new Event('cartUpdated'));
    setAdded(true);
  };

  const handleToggleWishlist = () => {
    if (!user) {
      navigate('/signin');
      return;
    }

    const existing = JSON.parse(localStorage.getItem(WISHLIST_KEY) || '[]');
    const alreadySaved = existing.some((item) => String(item._id) === String(course._id));

    let updated;
    if (alreadySaved) {
      updated = existing.filter((item) => String(item._id) !== String(course._id));
      setIsFavorite(false);
    } else {
      updated = [...existing, course];
      setIsFavorite(true);
    }

    localStorage.setItem(WISHLIST_KEY, JSON.stringify(updated));
    window.dispatchEvent(new Event('wishlistUpdated'));
  };

  const handleBuynow = () => {
    if (!user) {
      navigate('/signin');
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

  

  if (loading) return <p>{t('learning.loading')}</p>;
  if (!course) return <p>{t('learning.notFound')}</p>;
  const courseReviews = Array.isArray(course.reviews) ? course.reviews : [];
  const reviewStats = buildReviewStats(courseReviews);

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
          <span>{t('detail.alreadyInCart')}</span>
        </div>
      )}

      <div className={styles.background}></div>
      <div className={styles.background2}></div>

      <div className={styles.mainPage}>
        <div className={styles.course}>
          <div className={styles.link}>
            <a onClick={() => navigate('/home')}>{t('detail.home')}</a>
            <img src={sideArrow} alt="arrow" />
            <a onClick={() => navigate('/course-page')}>{t('header.categories')}</a>
            <img src={sideArrow} alt="arrow" />
            <a>{course.title}</a>
          </div>

          <div className={styles.mainTitle}>
            <p>{course.title}</p>
            <p>
              {course.shortDescription}
            </p>
            <div className={styles.ratingNDetails}>
              <p style={{ color: "#fcad03" }}>{reviewStats.averageRating}</p>
              <img src={yellowstar} alt="rating" />
              <p>({t('detail.reviewCount', { count: reviewStats.totalReviews })})</p>
              <div></div>
              <p>{course.hours} {t('course.totalHours')}. {course.lectures} {t('course.lectures')}. {t('detail.allLevels')}</p>
            </div>
            <div className={styles.teacherDetails}>
               <img
                 src={course.instructorId?.thumbnail || smolAva}
                 alt="avatar"
                 style={{width:'40px',height:'40px', borderRadius: '50%' }}
               />
              <p>{t('detail.createdBy')}</p>
              <p>{course.instructorId?.name}</p>
            </div>
            <div className={styles.availLanguage}>
              <img src={globe} alt="language" />
              {<p>{course.languages.join(', ')}</p>}
            </div>
          </div>

          <div className={styles.teacherNBuy}>
            <div className={styles.teacherInfo}>
               {course.promotionalVideo ? (
                 <video
                   src={course.promotionalVideo}
                   poster={course.thumbnail || CourseImg}
                   controls
                   style={{ width: '100%', height: '200px', objectFit: 'cover', borderRadius: '14px' }}
                 />
               ) : (
                 <img src={course.thumbnail || CourseImg} alt="course thumbnail" />
               )}
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
                  onClick={() => navigate(`/mycoursespage/${id}`)}
                  className={styles.learnNowButton}
                >
                  🎓 {t('detail.learnNow')}
                </button>
              ) : (
                <>
                  <button
                    onClick={() => user ? handleAddtoCart() : navigate('/signin')}
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
                        {t('detail.addedToCart')}
                      </>
                    ) : t('detail.addToCart')}
                  </button>
                  <button onClick={() => handleBuynow()} className={styles.buyNowButton}>
                    {t('detail.buyNow')}
                  </button>
                  <button onClick={handleToggleWishlist} className={`${styles.wishlistButton} ${isFavorite ? styles.favorited : ''}`}>
                    <span className={styles.heartIcon} aria-hidden="true">{isFavorite ? '♥' : '♡'}</span>
                    {isFavorite ? t('detail.saved') : t('detail.addWishlist')}
                  </button>
                </>
              )}

              <div className={styles.tnbSl}></div>
              <div className={styles.shareInfo}>
                <p>{t('detail.share')}</p>
                <div className={styles.shareGroup}>
                  <a href="https://www.facebook.com/facebook/" className={styles.sharedButton1}>
                    <img src={facebook} alt="Facebook" />
                  </a>
                  <a href="https://github.com/" className={styles.sharedButton2}>
                    <img src={github} alt="GitHub" />
                  </a>
                  <a href="https://www.google.com/" className={styles.sharedButton3}>
                    <img src={google} alt="Google" />
                  </a>
                  <a href="https://x.com/?lang=vi" className={styles.sharedButton4}>
                    <img src={twitter} alt="X" />
                  </a>
                  <a href="https://www.microsoft.com/vi-vn" className={styles.sharedButton5}>
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
                {t(`detail.${tab}`)}
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
                <p>{t('detail.courseDescription')}</p>
                <p>
                  {course.courseDescription}
                </p>
                <p>{t('detail.certification')}</p>
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
                   <img
                     src={course.instructorId?.thumbnail || bigava}
                     alt="instructor"
                     style={{width:'120px',height:'120px', borderRadius: '50%' }}
                   />
                  <p>{course.instructorId?.totalReviews} {t('detail.reviews')}</p>
                  <img id="medal" src={medal} alt="medal" />
                  <img src={play} alt="play" />
                  <img src={graduation} alt="grad" />
                  <p>{course.instructorId?.totalStudents} {t('detail.students')}</p>
                  <p>{course.instructorId?.totalCourses} {t('detail.courses')}</p>
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
                <p>{t('detail.learnerReviews')}</p>
                <div className={styles.stars}>
                  <div className={styles.starReview}>
                    <img src={yellowstar} alt="star" />
                    <p>{reviewStats.averageRating}</p>
                    <p>{t('detail.reviewCount', { count: reviewStats.totalReviews.toLocaleString('vi-VN') })}</p>
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
                  {courseReviews.slice(0, showAllReviews ? undefined : 2).map((i) => (
                    <div key={i._id} className={styles.reviewCard}>
                      <div className={styles.ava}>
                        <img src={bigava} alt="avatar" />
                        <p>{i.name}</p>
                      </div>
                      <div className={styles.starRating}>
                        <img src={yellowstar} alt="star" />
                        <p>{i.rating}</p>
                      </div>
                      <p>{t('learning.reviewedOn')} {formatReviewDate(i.createdAt)}</p>
                      <p>{i.comment}</p>
                    </div>
                  ))}
                </div>

                {courseReviews.length > 2 && (
                  <button
                    type="button"
                    className={styles.moreReviewsButton}
                    onClick={() => setShowAllReviews((current) => !current)}
                    aria-expanded={showAllReviews}
                  >
                    {showAllReviews ? t('detail.viewLessReviews') : t('detail.viewMoreReviews')}
                  </button>
                )}
              </div>
            </div>

          </div>{/* end tabTrack */}
          </div>{/* end contWrapper */}
      </div>

        <div className={styles.courses}>
          <h2 className={styles.divTitle}>{t('detail.moreCourses')}</h2>
          <div className={styles.courseList}>
            {sameCourse({ data: allCourse, course: course }).map((data) =>
            <div key={data._id} onClick={() => window.location.reload()}> 
            <CourseCard
              key={data.id ?? data._id}
              id={data.id ?? data._id}
              title={data.title}
              instructor={data.instructorId?.name}
              rating={data.rating}
              ratingCount={data.reviews?.length ?? 0}
              duration={`${data.hours} ${t('course.totalHours')}. ${data.lectures} ${data.level}`}
              category={data.category}
              promotionalPrice={data.promotionalPrice}
              originalPrice={data.price}
              thumbnail={data.thumbnail}
              />
            </div>)}
          </div>
        </div>
      </div>
    </>
  );
};

export default CourseDetail;
