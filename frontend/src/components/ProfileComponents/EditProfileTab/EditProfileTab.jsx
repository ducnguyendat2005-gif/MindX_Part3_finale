import React, { useRef, useState } from 'react';
import { X, Image as ImageIcon, Lock, CheckCircle2 } from 'lucide-react';
import './EditProfileTab.scss';

export default function EditProfileTab({
  form,
  handleChange,
  preview,
  handleAvatarFileChange, // (file) => void — mình đổi từ handleUploadImage sang nhận file thật
  handleSaveProfile,
  saving,
  onClose,
  onCancel,
  // password change props
  passwordForm,
  handlePasswordChange,
  handleSavePassword,
  savingPassword,
  passwordError,
  passwordSuccess
}) {
  const fileInputRef = useRef(null);
  const [localPreview, setLocalPreview] = useState(null);

  const onPickFile = () => fileInputRef.current?.click();

  const onFileSelected = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // preview tạm ở client trước khi upload lên Cloudinary
    const objectUrl = URL.createObjectURL(file);
    setLocalPreview(objectUrl);

    handleAvatarFileChange?.(file);
  };

  const displayPreview = localPreview || preview;

  return (
    <>
      {/* Basic info form */}
      <section className="profile-card-info">
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
          <label>Learning goal</label>
          <input
            type="text"
            placeholder="Label"
            value={form.learningGoal}
            onChange={handleChange('learningGoal')}
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
          <label>Level</label>
          <select value={form.level} onChange={handleChange('level')}>
            <option value="">Select level</option>
            <option value="Beginner">Beginner</option>
            <option value="Intermediate">Intermediate</option>
            <option value="Advanced">Advanced</option>
            <option value="Expert">Expert</option>
          </select>
        </div>
      </section>

      {/* Avatar card */}
      <section className="profile-card-ava">
        <h3 className="profile-card__title">Avatar</h3>
        <div className="image-preview image-preview--avatar">
          {displayPreview ? (
            <img src={displayPreview} alt="Avatar preview" className="image-preview__img" />
          ) : (
            <ImageIcon className="image-preview__placeholder" />
          )}
        </div>

        <div className="profile-card__field">
          <label>Đổi ảnh đại diện</label>
          <div className="image-upload-row">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/png, image/jpeg, image/webp"
              onChange={onFileSelected}
              hidden
            />
            <button className="btn btn--secondary" onClick={onPickFile} type="button">
              Chọn ảnh
            </button>
            {localPreview && (
              <span className="image-upload-row__hint">
                Ảnh mới sẽ được lưu khi bạn bấm "Save changes"
              </span>
            )}
          </div>
        </div>

        <div className="form-actions">
          <button className="btn btn--ghost" onClick={onCancel} type="button">
            Cancel
          </button>
          <button
            className="btn btn--primary"
            onClick={handleSaveProfile}
            disabled={saving}
            type="button"
          >
            {saving ? 'Saving...' : 'Save changes'}
          </button>
        </div>
      </section>

      {/* Change password card */}
      <section className="profile-card-pass">
        <h3 className="profile-card__title">
          <Lock size={16} className="profile-card__title-icon" />
          Đổi mật khẩu
        </h3>

        <div className="profile-card__field">
          <label>Password hiện tại</label>
          <input
            type="password"
            placeholder="Nhập mật khẩu hiện tại"
            value={passwordForm.currentPassword}
            onChange={handlePasswordChange('currentPassword')}
          />
        </div>

        <div className="profile-card__row">
          <div className="profile-card__field">
            <label>Password mới</label>
            <input
              type="password"
              placeholder="Nhập mật khẩu mới"
              value={passwordForm.newPassword}
              onChange={handlePasswordChange('newPassword')}
            />
          </div>
          <div className="profile-card__field">
            <label>Xác nhận mật khẩu mới</label>
            <input
              type="password"
              placeholder="Nhập lại mật khẩu mới"
              value={passwordForm.confirmPassword}
              onChange={handlePasswordChange('confirmPassword')}
            />
          </div>
        </div>

        {passwordError && (
          <p className="profile-card__error">{passwordError}</p>
        )}
        {passwordSuccess && (
          <p className="profile-card__success">
            <CheckCircle2 size={16} />
            {passwordSuccess}
          </p>
        )}

        <div className="form-actions">
          <button
            className="btn btn--primary"
            onClick={handleSavePassword}
            disabled={savingPassword}
            type="button"
          >
            {savingPassword ? 'Đang đổi...' : 'Đổi mật khẩu'}
          </button>
        </div>
      </section>
    </>
  );
}