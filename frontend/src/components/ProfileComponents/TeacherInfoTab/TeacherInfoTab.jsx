import React, { useState } from 'react';
import { FileText, GraduationCap, Star, Users, BookOpen, MessageSquare, X } from 'lucide-react';
import styles from './TeacherInfoTab.module.scss';

export default function TeacherInfoTab({ instructorInfo, onEdit }) {
  const [previewUrl, setPreviewUrl] = useState(null);

  if (!instructorInfo) {
    return (
      <section className={styles.teacherInfoCard}>
        <p className={styles.emptyHint}>Chưa có thông tin giảng viên.</p>
      </section>
    );
  }

  const {
    title,
    bio,
    yearsOfExperience,
    rating,
    totalStudents,
    totalCourses,
    totalReviews,
    portfolioUrl = [],
  } = instructorInfo;

  return (  
    <section className={styles.teacherInfoCard}>
      <div className={styles.topBox}>
        <div className={styles.header}>
          <h3 className={styles.title}>
            <GraduationCap size={16} className={styles.titleIcon} />
            Thông tin giảng viên
          </h3>
        </div>

        <div className={styles.stats}>
          <div className={styles.statItem}>
            <Star size={16} />
            <span className={styles.statValue}>{rating ?? 0}</span>
            <span className={styles.statLabel}>Rating</span>
          </div>
          <div className={styles.statItem}>
            <Users size={16} />
            <span className={styles.statValue}>{totalStudents ?? 0}</span>
            <span className={styles.statLabel}>Students</span>
          </div>
          <div className={styles.statItem}>
            <BookOpen size={16} />
            <span className={styles.statValue}>{totalCourses ?? 0}</span>
            <span className={styles.statLabel}>Courses</span>
          </div>
          <div className={styles.statItem}>
            <MessageSquare size={16} />
            <span className={styles.statValue}>{totalReviews ?? 0}</span>
            <span className={styles.statLabel}>Reviews</span>
          </div>
        </div>
      </div>

      <div className={styles.bottomBox}>
        <div className={styles.fieldsRow}>
          <div className={styles.field}>
            <label>Chức danh / chuyên môn</label>
            <p>{title || '—'}</p>
          </div>

          <div className={styles.field}>
            <label>Số năm kinh nghiệm</label>
            <p>{yearsOfExperience ?? 0} năm</p>
          </div>
        </div>

        <div className={styles.field}>
          <label>Giới thiệu bản thân</label>
          <p>{bio || '—'}</p>
        </div>

        <div className={styles.field}>
          <label>Portfolio đã nộp</label>
          {portfolioUrl.length > 0 ? (
            <ul className={styles.portfolioList}>
              {portfolioUrl.map((url) => (
                <li key={url}>
                  <FileText size={14} />
                  <button
                    type="button"
                    className={styles.fileLink}
                    onClick={() => setPreviewUrl(url)}
                  >
                    {url.split('/').pop()}
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <p>Chưa có file portfolio nào.</p>
          )}
        </div>
      <div className={styles.bottomHeader}>
        <button className={styles.editLink} onClick={onEdit} type="button">
          Edit
        </button>
      </div>
      </div>

      {/* Modal xem PDF ngay trong trang */}
      {previewUrl && (
        <div className={styles.pdfOverlay} onClick={() => setPreviewUrl(null)}>
          <div className={styles.pdfModal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.pdfModalHeader}>
              <span>{previewUrl.split('/').pop()}</span>
              <div className={styles.pdfModalActions}>
                <a href={previewUrl} target="_blank" rel="noreferrer" className={styles.pdfOpenTab}>
                  Mở tab mới
                </a>
                <button
                  className={styles.pdfClose}
                  onClick={() => setPreviewUrl(null)}
                  aria-label="Close"
                  type="button"
                >
                  <X size={16} />
                </button>
              </div>
            </div>
            <iframe
              src={previewUrl}
              title="Portfolio preview"
              className={styles.pdfFrame}
            />
          </div>
        </div>
      )}
    </section>
  );
}