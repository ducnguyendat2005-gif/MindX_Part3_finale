import React, { useState } from 'react';
import { Share2, Star, MoreHorizontal, ChevronLeft, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import './Myreviewspage.scss';

export default function MyReviewsPage() {
  const [user] = useState(() => {
    const stored = localStorage.getItem('loggedInUser');
    return stored ? JSON.parse(stored) : null;
  });

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
    <div className="reviews-page">
      <div className="reviews-page__inner">

        {/* Sidebar (giống MyCoursesPage / ProfilePage) */}
        <aside className="reviews-page__sidebar">
          <div className="sidebar__profile-card">
            <div className="sidebar__avatar-wrapper">
              <img
                src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=facearea&facepad=2&w=256&h=256&q=80"
                alt={user?.Username ?? 'John Doe'}
                className="sidebar__avatar"
                referrerPolicy="no-referrer"
              />
            </div>
            <h2 className="sidebar__name">{user?.Username ?? 'John Doe'}</h2>
            <button className="sidebar__share-btn">
              Share Profile <Share2 className="sidebar__share-icon" />
            </button>
          </div>
          <nav className="sidebar__nav">
            <Link to="/profile" className="sidebar__nav-item">Profile</Link>
            <Link to="/mycoursespage" className="sidebar__nav-item">My Courses</Link>
            <a href="#" className="sidebar__nav-item">Teachers</a>
            <a href="#" className="sidebar__nav-item">Message</a>
            <Link to="/myreviews" className="sidebar__nav-item sidebar__nav-item--active">My Reviews</Link>
          </nav>
        </aside>

        {/* Main content */}
        <main className="reviews-page__main">
          <h1 className="reviews-header">
            Reviews <span className="reviews-header__count">({reviews.length})</span>
          </h1>

          <div className="reviews-list">
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

          {/* Pagination */}
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
        </main>

      </div>
    </div>
  );
}