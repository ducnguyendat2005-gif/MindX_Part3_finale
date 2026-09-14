import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import CourseCard from '../../components/CourseCard/CourseCard';
import { useLanguage } from '../../context/LanguageContext.jsx';
import styles from './Wishlist.module.scss';
import { readUserCollection, writeUserCollection } from '../../utils/userStorage.js';

const getCourseId = (course) => course?._id || course?.id;

export default function Wishlist() {
  const [wishlist, setWishlist] = useState([]);
  const navigate = useNavigate();
  const { t } = useLanguage();

  useEffect(() => {
    const syncWishlist = () => setWishlist(readUserCollection('wishlistedCourses'));
    syncWishlist();

    window.addEventListener('wishlistUpdated', syncWishlist);
    window.addEventListener('userUpdated', syncWishlist);
     return () => {
     window.removeEventListener('wishlistUpdated', syncWishlist);
     window.removeEventListener('userUpdated', syncWishlist);
   };
  }, []);

  const handleRemove = (courseId) => {
    const updated = wishlist.filter((course) => String(getCourseId(course)) !== String(courseId));
    writeUserCollection('wishlistedCourses', updated);
    setWishlist(updated);
    window.dispatchEvent(new Event('wishlistUpdated'));
  };

  return (
    <div className={styles.wishlistPage}>
      <div className={styles.wishlistHeader}>
        <h1>{t('wishlist.title')}</h1>
        <p>{t(wishlist.length === 1 ? 'wishlist.count.one' : 'wishlist.count.many', { count: wishlist.length })}</p>
      </div>

      {wishlist.length === 0 ? (
        <div className={styles.emptyState}>
          <p>{t('wishlist.empty')}</p>
          <button onClick={() => navigate('/course-page')} className={styles.browseButton}>
            {t('wishlist.browse')}
          </button>
        </div>
      ) : (
        <div className={styles.courseGrid}>
          {wishlist.map((course) => (
            <div key={getCourseId(course)} className={styles.courseCardWrapper}>
              <CourseCard
                id={getCourseId(course)}
                thumbnail={course.thumbnail || course.image || course.cover || course?.courseImage}
                title={course.title}
                instructor={course.instructorId?.name || course.instructor || course.author}
                rating={course.rating ?? 0}
                ratingCount={course.reviews?.length ?? course.ratingCount ?? 0}
                duration={course.duration || `${course.hours ?? 0} Total Hours`}
                category={course.category || course.level || 'General'}
                promotionalPrice={course.promotionalPrice ?? course.price}
                originalPrice={course.price ?? course.originalPrice ?? 0}
              />
              <button className={styles.removeButton} onClick={() => handleRemove(getCourseId(course))}>
                {t('wishlist.remove')}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
