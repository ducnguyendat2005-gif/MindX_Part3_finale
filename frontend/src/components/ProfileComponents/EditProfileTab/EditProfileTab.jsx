import React from 'react';
import { X, Image as ImageIcon } from 'lucide-react';
import './EditProfileTab.scss';

export default function EditProfileTab({
  form,
  handleChange,
  preview,
  handleUploadImage,
  handleSaveProfile,
  saving,
  onClose,
  onCancel,
}) {
  return (
    <>
      {/* Basic info form */}
      <section className="profile-card">
        <button
          className="profile-card__close"
          onClick={onClose}
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

        <div className="form-actions">
          <button className="btn btn--ghost" onClick={onCancel}>
            Cancel
          </button>
          <button className="btn btn--primary" onClick={handleSaveProfile} disabled={saving}>
            {saving ? 'Đang lưu...' : 'Save changes'}
          </button>
        </div>
      </section>
    </>
  );
}
