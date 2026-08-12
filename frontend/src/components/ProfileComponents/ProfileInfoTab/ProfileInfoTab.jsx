import React from 'react';
import './ProfileInfoTab.scss';

export default function ProfileInfoTab({ user, myCourses, onEdit }) {
  const totalHours = myCourses.reduce((s, c) => s + (c.hours ?? 0), 0);
  const totalLectures = myCourses.reduce((s, c) => s + (c.lectures ?? 0), 0);

  return (
    <>
      {/* Stats */}
      <section className="profile-card profile-card--stats">
        <div className="stats-row">
          <div className="stat-item">
            <span className="stat-item__num">{myCourses.length}</span>
            <span className="stat-item__label">Courses enrolled</span>
          </div>
          <div className="stat-item">
            <span className="stat-item__num">{totalHours}h</span>
            <span className="stat-item__label">Total hours</span>
          </div>
          <div className="stat-item">
            <span className="stat-item__num">{totalLectures}</span>
            <span className="stat-item__label">Total lectures</span>
          </div>
        </div>
      </section>

      {/* Personal info */}
      <section className="profile-card">
        <div className="profile-card__header">
          <h3 className="profile-card__title">Personal information</h3>
          <button className="profile-card__edit-link" onClick={onEdit}>
            Edit
          </button>
        </div>
        <div className="info-grid">
          {[
            { label: 'First name', value: user.Fname },
            { label: 'Last name', value: user.Lname },
            { label: 'Username', value: user.Username },
            { label: 'Email', value: user.Email },
            { label: 'Learning goal', value: user.learningGoal || '—' },
            { label: 'Level', value: user.level || '—' },
          ].map(f => (
            <div key={f.label} className="info-field">
              <span className="info-field__label">{f.label}</span>
              <span className="info-field__value">{f.value}</span>
            </div>
          ))}
        </div>
        {user.description && (
          <div className="info-field" style={{ marginTop: '1rem' }}>
            <span className="info-field__label">Description</span>
            <span className="info-field__value">{user.description}</span>
          </div>
        )}
      </section>
    </>
  );
}
