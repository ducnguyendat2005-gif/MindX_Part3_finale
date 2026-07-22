import React from 'react'
import styles from './CourseCard.module.scss'
import image from '../../assets/Rectangle 1080.png'
import { Link } from "react-router-dom";

// StarRating.jsx
const StarRating = ({ rating, maxStars = 5 }) => {
  const fullStars = Math.floor(rating);
  const hasHalf = rating - fullStars >= 0.5;
  const emptyStars = maxStars - fullStars - (hasHalf ? 1 : 0);
  

  return (
    <div className={styles.stars}>
      {Array.from({ length: fullStars }, (_, i) => (
        <span key={`full-${i}`} className={styles.starFilled}>★</span>
      ))}

      {hasHalf && (
        <span className={styles.starHalf}>★</span>
      )}

      {Array.from({ length: emptyStars }, (_, i) => (
        <span key={`empty-${i}`} className={styles.starEmpty}>★</span>
      ))}
    </div>
  );
};

// CourseCard.jsx
const CourseCard = ({
  thumbnail = image,
  title,
  instructor,
  rating,
  ratingCount,
  duration,
  category,
  price,          // giữ lại nếu chỗ khác vẫn đang dùng dạng cũ
  promotionalPrice,
  originalPrice,
  id
}) => {
  const hasDiscount =
    promotionalPrice != null &&
    originalPrice != null &&
    promotionalPrice > 0 &&
    promotionalPrice < originalPrice;

  const saleCount = (promo, original) =>
    Math.round((1 - promo / original) * 100);

  return (
    <Link to={`/home/course-page/${id}`} style={{ textDecoration: "none", color: "inherit" }}>
      <div className={styles.CourCard}>
        <img src={thumbnail} alt="course thumbnail" />
        <p className={styles.title}>{title}</p>
        <p className={styles.instructor}>By {instructor}</p>
        <div className={styles.rtin}>
          <p>{rating}</p>
          <StarRating rating={rating} />
          <p>({ratingCount})</p>
        </div>
        <p>{duration}</p>
        <p>#{category}</p>

        {hasDiscount ? (
          <div className={styles.priceRow}>
            <p className={styles.newPrice}>${promotionalPrice}</p>
            <p className={styles.oldPrice}>${originalPrice}</p>
            <p className={styles.offBadge}>{saleCount(promotionalPrice, originalPrice)}% OFF!</p>
          </div>
        ) : (
          <p className={styles.newPrice}>${originalPrice}</p>
        )}
      </div>
    </Link>
  );
};

export default CourseCard