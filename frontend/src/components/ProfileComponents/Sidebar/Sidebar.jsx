import React from 'react';
import { Share2, Plus } from 'lucide-react';
import './Sidebar.scss';
import { useLanguage } from '../../../context/LanguageContext.jsx';

const BASE_NAV_ITEMS = [
  { key: 'profile', labelKey: 'profile.profile' },
  { key: 'courses', labelKey: 'profile.myCourses' },
  { key: 'teachers', labelKey: 'profile.teachers' },
  { key: 'students', labelKey: 'profile.students' },
  { key: 'message', labelKey: 'profile.message' },
  { key: 'reviews', labelKey: 'profile.myReviews' },
];

export default function Sidebar({ user, activeTab, setActiveTab, onCreateCourse }) {
  const { t } = useLanguage();
  const isTeacher = user?.role === 'teacher' || user?.Role === 'teacher';
  const navItems = isTeacher
    ? [{ key: 'teacherInfo', labelKey: 'profile.profile' }, ...BASE_NAV_ITEMS.slice(1)]
    : BASE_NAV_ITEMS;

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
          {t('profile.share')} <Share2 className="sidebar__share-icon" />
        </button>
      </div>

      <nav className="sidebar__nav">
        {navItems.map((item) => (
          <button
            key={item.key}
            type="button"
            className={`sidebar__nav-item ${
              activeTab === item.key || (item.key === 'teacherInfo' && activeTab === 'teacherEdit')
                ? 'sidebar__nav-item--active'
                : ''
            }`}
            onClick={() => setActiveTab(item.key)}
          >
            {t(item.labelKey)}
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
          {t('profile.createCourse')}
        </button>
      )}
    </aside>
  );
}
