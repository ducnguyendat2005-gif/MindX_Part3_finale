import React from 'react';
import { Share2, Plus } from 'lucide-react';
import './Sidebar.scss';

const NAV_ITEMS = [
  { key: 'profile', label: 'Profile' },
  { key: 'courses', label: 'My Courses' },
  { key: 'teachers', label: 'Teachers' },
  { key: 'message', label: 'Message' },
  { key: 'reviews', label: 'My Reviews' },
];

export default function Sidebar({ user, activeTab, setActiveTab, onCreateCourse }) {
  const isTeacher = user?.role === 'teacher' || user?.Role === 'teacher';

  return (
    <aside className="profile-page__sidebar">
      <div className="sidebar__profile-card">
        <div className="sidebar__avatar-wrapper">
          <img
            src={user?.avatar || "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=facearea&facepad=2&w=256&h=256&q=80"}
            alt={user?.Username ?? 'Avatar'}
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
        {NAV_ITEMS.map((item) => (
          <button
            key={item.key}
            type="button"
            className={`sidebar__nav-item ${activeTab === item.key ? 'sidebar__nav-item--active' : ''}`}
            onClick={() => setActiveTab(item.key)}
          >
            {item.label}
          </button>
        ))}
      </nav>

      {isTeacher && (
        <button
          type="button"
          className="sidebar__create-course-btn"
          onClick={onCreateCourse}
        >
          <Plus className="sidebar__create-course-icon" size={16} />
          Create Course
        </button>
      )}
    </aside>
  );
}