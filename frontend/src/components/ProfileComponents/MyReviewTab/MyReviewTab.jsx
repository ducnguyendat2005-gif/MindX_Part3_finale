import React, { useState, useEffect } from 'react';
import { Star, MoreHorizontal, ChevronLeft, ChevronRight } from 'lucide-react';
import { API, fetchWithAuth } from '../../../config/api';
import './MyReviewTab.scss';

const PAGE_SIZE = 5;

export default function MyReviewsTab() {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [openMenuId, setOpenMenuId] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({ rating: 0, comment: '' });
  const [saving, setSaving] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const [page, setPage] = useState(1);

  // ── Fetch reviews của user hiện tại ──
  useEffect(() => {
    let ignore = false;

    const loadReviews = async () => {
      try {
        setLoading(true);
        const res = await fetchWithAuth(API.myReviews);
        const body = await res.json();

        if (!res.ok) throw new Error(body.message || 'Không thể tải review');
        if (!ignore) setReviews(body.data || []);
      } catch (err) {
        if (!ignore) setError(err.message);
      } finally {
        if (!ignore) setLoading(false);
      }
    };

    loadReviews();
    return () => { ignore = true; };
  }, []);

  // ── Start edit ──
  const handleStartEdit = (review) => {
    setEditingId(review._id);
    setEditForm({ rating: review.rating, comment: review.comment });
    setOpenMenuId(null);
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditForm({ rating: 0, comment: '' });
  };

  // ── Lưu edit — gọi PUT /account/review/:id ──
  const handleSaveEdit = async (reviewId) => {
    try {
      setSaving(true);
      const res = await fetchWithAuth(API.updateReview(reviewId), {
        method: 'PUT',
        body: JSON.stringify({
          rating: editForm.rating,
          comment: editForm.comment,
        }),
      });
      const body = await res.json();

      if (!res.ok) throw new Error(body.message || 'Cập nhật thất bại');

      // Cập nhật lại đúng review trong state, không cần fetch lại toàn bộ
      setReviews((prev) =>
        prev.map((r) => (r._id === reviewId ? body.data : r))
      );
      setEditingId(null);
    } catch (err) {
      // Hiển thị lỗi ngay tại chỗ thay vì mất context của card đang sửa
      alert(err.message);
    } finally {
      setSaving(false);
    }
  };
  // ── Delete review ──

  const handleConfirmDelete = async () => {
    const reviewId = deleteConfirmId;
    try {
      setDeleting(true);
      const res = await fetchWithAuth(API.deleteReview(reviewId), {
        method: 'DELETE',
      });
      const body = await res.json();

      if (!res.ok) throw new Error(body.message || 'Delete thất bại');

      setReviews((prev) => prev.filter((r) => r._id !== reviewId));
    } catch (err) {
      alert(err.message);
    } finally {
      setDeleting(false);
      setDeleteConfirmId(null);
    }
  };

  const handleAskDelete = (reviewId) => {
    setDeleteConfirmId(reviewId);
    setOpenMenuId(null);
  };

  const totalPages = Math.max(1, Math.ceil(reviews.length / PAGE_SIZE));
  const pagedReviews = reviews.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  if (loading) {
    return <div className="reviews-page reviews-page--state">Đang tải review...</div>;
  }

  if (error) {
    return (
      <div className="reviews-page reviews-page--state reviews-page--error">
        Có lỗi xảy ra: {error}
      </div>
    );
  }

  return (
    <div className="reviews-page">
      <h1 className="reviews-header">
        Reviews <span className="reviews-header__count">({reviews.length})</span>
      </h1>

      {reviews.length === 0 && (
        <p className="reviews-list__empty">Bạn chưa viết review nào.</p>
      )}

      <div className="reviews-list">
        {pagedReviews.map((r) => {
          const isEditing = editingId === r._id;

          return (
            <div className="review-card" key={r._id}>
              {!isEditing && (
                <div className="review-card__menu-wrapper">
                  <button
                    className="review-card__menu-btn"
                    onClick={() => setOpenMenuId(openMenuId === r._id ? null : r._id)}
                    aria-label="More options"
                  >
                    <MoreHorizontal size={18} />
                  </button>
                  {openMenuId === r._id && (
                    <div className="review-card__menu">
                      <button
                        className="review-card__menu-item"
                        onClick={() => handleStartEdit(r)}
                      >
                        Edit
                      </button>
                      <button
                        className="review-card__menu-item review-card__menu-item--danger"
                        onClick={() => handleAskDelete(r._id)}
                      >
                        Delete
                      </button>
                    </div>
                  )}
                </div>
              )}

              <p className="review-card__row">
                <span className="review-card__label">Course Name:</span>
                <span className="review-card__value">{r.courseId?.title || '(Course deleted)'}</span>
              </p>

              <p className="review-card__row">
                <span className="review-card__label">Rating:</span>
                <span className="review-card__stars">
                  {[...Array(5)].map((_, i) => {
                    const filled = isEditing
                      ? i < editForm.rating
                      : i < r.rating;

                    return (
                      <Star
                        key={i}
                        size={18}
                        fill={filled ? '#FBBF24' : 'none'}
                        stroke={filled ? '#FBBF24' : '#D1D5DB'}
                        onClick={
                          isEditing
                            ? () => setEditForm((f) => ({ ...f, rating: i + 1 }))
                            : undefined
                        }
                        style={isEditing ? { cursor: 'pointer' } : undefined}
                      />
                    );
                  })}
                </span>
              </p>

              <p className="review-card__row review-card__row--review">
                <span className="review-card__label">Review:</span>
                {isEditing ? (
                  <textarea
                    className="review-card__edit-textarea"
                    value={editForm.comment}
                    onChange={(e) =>
                      setEditForm((f) => ({ ...f, comment: e.target.value }))
                    }
                    rows={4}
                  />
                ) : (
                  <span className="review-card__value">{r.comment}</span>
                )}
              </p>

              {isEditing && (
                <div className="review-card__edit-actions">
                  <button
                    className="review-card__btn review-card__btn--cancel"
                    onClick={handleCancelEdit}
                    disabled={saving}
                  >
                    Cancel
                  </button>
                  <button
                    className="review-card__btn review-card__btn--save"
                    onClick={() => handleSaveEdit(r._id)}
                    disabled={saving || !editForm.comment.trim() || editForm.rating === 0}
                  >
                    {saving ? 'Saving...' : 'Save'}
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {reviews.length > PAGE_SIZE && (
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
      )}
      {deleteConfirmId && (
        <div className="confirm-modal-overlay" onClick={() => setDeleteConfirmId(null)}>
          <div className="confirm-modal" onClick={(e) => e.stopPropagation()}>
            <h3 className="confirm-modal__title">Delete review</h3>
            <p className="confirm-modal__message">
              Bạn có chắc muốn xóa review này? Hành động này không thể hoàn tác.
            </p>
            <div className="confirm-modal__actions">
              <button
                className="confirm-modal__btn confirm-modal__btn--cancel"
                onClick={() => setDeleteConfirmId(null)}
                disabled={deleting}
              >
                Hủy
              </button>
              <button
                className="confirm-modal__btn confirm-modal__btn--confirm"
                onClick={handleConfirmDelete}
                disabled={deleting}
              >
                {deleting ? 'Đang xóa...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}