import React, { useState } from 'react';
import { Share2, X, Image as ImageIcon } from 'lucide-react';
import { Link } from 'react-router-dom';
import './Profilepage.scss';

export default function ProfilePage() {
  const [user] = useState(() => {
    const stored = localStorage.getItem('loggedInUser');
    return stored ? JSON.parse(stored) : null;
  });

  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    headline: '',
    description: '',
    language: '',
    imageUrl: '',
    website: '',
    twitter: '',
    linkedin: '',
    youtube: '',
    facebook: '',
  });

  const [preview, setPreview] = useState(null);

  const handleChange = (field) => (e) =>
    setForm((prev) => ({ ...prev, [field]: e.target.value }));

  const handleUploadImage = () => {
    if (form.imageUrl) setPreview(form.imageUrl);
  };

  const handleSaveImage = () => {
    // TODO: call API to persist avatar
    console.log('Save image:', preview);
  };

  return (
    <div className="profile-page">
      <div className="profile-page__inner">

        {/* Sidebar (giống MyCoursesPage) */}
        <aside className="profile-page__sidebar">
          <div className="sidebar__profile-card">
            <div className="sidebar__avatar-wrapper">
              <img
                src={preview || "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=facearea&facepad=2&w=256&h=256&q=80"}
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
            <Link to="/profile" className="sidebar__nav-item sidebar__nav-item--active">Profile</Link>
            <Link to="/mycoursespage" className="sidebar__nav-item">My Courses</Link>
            <a href="#" className="sidebar__nav-item">Teachers</a>
            <Link to="/message" className="sidebar__nav-item">Message</Link>
            <Link to="/myreviews" className="sidebar__nav-item">My Reviews</Link>
          </nav>
        </aside>

        {/* Main content */}
        <main className="profile-page__main">

          {/* Basic info card */}
          <section className="profile-card">
            <button
              className="profile-card__close"
              onClick={() => window.history.back()}
              aria-label="Close"
            >
              <X size={16} />
            </button>

            <div className="profile-card__row">
              <div className="profile-card__field">
                <label>First Name</label>
                <input
                  type="text"
                  placeholder="Label"
                  value={form.firstName}
                  onChange={handleChange('firstName')}
                />
              </div>
              <div className="profile-card__field">
                <label>Last Name</label>
                <input
                  type="text"
                  placeholder="Label"
                  value={form.lastName}
                  onChange={handleChange('lastName')}
                />
              </div>
            </div>

            <div className="profile-card__field">
              <label>Headline</label>
              <input
                type="text"
                placeholder="Label"
                value={form.headline}
                onChange={handleChange('headline')}
              />
            </div>

            <div className="profile-card__field">
              <label>Description</label>
              <textarea
                placeholder="Label"
                rows={4}
                value={form.description}
                onChange={handleChange('description')}
              />
            </div>

            <div className="profile-card__field">
              <label>Language</label>
              <select value={form.language} onChange={handleChange('language')}>
                <option value="">Label</option>
                <option value="vi">Tiếng Việt</option>
                <option value="en">English</option>
              </select>
            </div>
          </section>

          {/* Image preview card */}
          <section className="profile-card">
            <h3 className="profile-card__title">Image Preview</h3>
            <div className="image-preview">
              {preview ? (
                <img src={preview} alt="Preview" className="image-preview__img" />
              ) : (
                <ImageIcon className="image-preview__placeholder" />
              )}
            </div>

            <div className="profile-card__field">
              <label>Add/Change Image</label>
              <div className="image-upload-row">
                <input
                  type="text"
                  placeholder="Label"
                  value={form.imageUrl}
                  onChange={handleChange('imageUrl')}
                />
                <button className="btn btn--secondary" onClick={handleUploadImage}>
                  Upload Image
                </button>
              </div>
            </div>

            <button className="btn btn--primary" onClick={handleSaveImage}>
              Save Image
            </button>
          </section>

          {/* Links card */}
          <section className="profile-card">
            <h3 className="profile-card__title">Links</h3>

            <div className="profile-card__field">
              <label>Website</label>
              <input type="text" placeholder="Label" value={form.website} onChange={handleChange('website')} />
            </div>

            <div className="profile-card__field">
              <label>X (Formerly Twitter)</label>
              <input type="text" placeholder="Label" value={form.twitter} onChange={handleChange('twitter')} />
            </div>

            <div className="profile-card__field">
              <label>LinkedIn</label>
              <input type="text" placeholder="Label" value={form.linkedin} onChange={handleChange('linkedin')} />
            </div>

            <div className="profile-card__field">
              <label>Youtube</label>
              <input type="text" placeholder="Label" value={form.youtube} onChange={handleChange('youtube')} />
            </div>

            <div className="profile-card__field">
              <label>Facebook</label>
              <input type="text" placeholder="Label" value={form.facebook} onChange={handleChange('facebook')} />
            </div>
          </section>

        </main>
      </div>
    </div>
  );
}