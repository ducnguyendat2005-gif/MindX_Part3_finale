import React, { useState } from 'react';
import { Star, MoreHorizontal, ChevronLeft, ChevronRight } from 'lucide-react';
import './MyReviewTab.scss';

export default function MyReviewsTab() {
  // TODO: thay bằng fetchWithAuth(API.myReviews) khi backend có route GET reviews theo user
  const [reviews] = useState([
    {
      id: 1,
      courseName: "Beginner's Guide to Design",
      rating: 5,
      review:
        "I was initially apprehensive, having no prior design experience. But the instructor, John Doe, did an amazing job of breaking down complex concepts into easily digestible modules. The video lectures were engaging, and the real-world examples really helped solidify my understanding.",
    },
    {
      id: 2,
      courseName: "Beginner's Guide to Design",
      rating: 5,
      review:
        "I was initially apprehensive, having no prior design experience. But the instructor, John Doe, did an amazing job of breaking down complex concepts into easily digestible modules. The video lectures were engaging, and the real-world examples really helped solidify my understanding.",
    },
    {
      id: 3,
      courseName: "Beginner's Guide to Design",
      rating: 5,
      review:
        "I was initially apprehensive, having no prior design experience. But the instructor, John Doe, did an amazing job of breaking down complex concepts into easily digestible modules. The video lectures were engaging, and the real-world examples really helped solidify my understanding.",
    },
  ]);

  const [openMenuId, setOpenMenuId] = useState(null);
  const [page, setPage] = useState(1);
  const totalPages = 3;

  return (
    <div className="reviews-tab">
      <h1 className="reviews-tab__header">
        Reviews <span className="reviews-tab__count">({reviews.length})</span>
      </h1>

      <div className="reviews-tab__list">
        {reviews.map((r) => (
          <div className="review-card" key={r.id}>
            <div className="review-card__menu-wrapper">
              <button
                className="review-card__menu-btn"
                onClick={() => setOpenMenuId(openMenuId === r.id ? null : r.id)}
                aria-label="More options"
              >
                <MoreHorizontal size={18} />
              </button>
              {openMenuId === r.id && (
                <div className="review-card__menu">
                  <button className="review-card__menu-item">Edit</button>
                  <button className="review-card__menu-item review-card__menu-item--danger">Delete</button>
                </div>
              )}
            </div>

            <p className="review-card__row">
              <span className="review-card__label">Course Name:</span>
              <span className="review-card__value">{r.courseName}</span>
            </p>

            <p className="review-card__row">
              <span className="review-card__label">Rating:</span>
              <span className="review-card__stars">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    size={16}
                    fill={i < r.rating ? '#FBBF24' : 'none'}
                    stroke={i < r.rating ? '#FBBF24' : '#D1D5DB'}
                  />
                ))}
              </span>
            </p>

            <p className="review-card__row review-card__row--review">
              <span className="review-card__label">Review:</span>
              <span className="review-card__value">{r.review}</span>
            </p>
          </div>
        ))}
      </div>

      <div className="pagination">
        <button
          className="pagination__arrow"
          onClick={() => setPage((p) => Math.max(1, p - 1))}
          disabled={page === 1}
        >
          <ChevronLeft className="pagination__arrow-icon" />
        </button>
        {[...Array(totalPages)].map((_, i) => {
          const n = i + 1;
          return (
            <button
              key={n}
              className={`pagination__page ${page === n ? 'pagination__page--active' : ''}`}
              onClick={() => setPage(n)}
            >
              {n}
            </button>
          );
        })}
        <button
          className="pagination__arrow"
          onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
          disabled={page === totalPages}
        >
          <ChevronRight className="pagination__arrow-icon" />
        </button>
      </div>
    </div>
  );
}