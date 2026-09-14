import React, { useRef, useState } from 'react';
import { X, FileText, GraduationCap, Image as ImageIcon, Lock, CheckCircle2 } from 'lucide-react';
import styles from './TeacherEditTab.module.scss';

export default function TeacherEditTab({
  form,
  handleChange,
  existingPortfolio,
  handleSaveInstructor,
  saving,
  onClose,
  onCancel,
  preview,
  handleAvatarFileChange,
  handleSaveProfile,
  savingAvatar,
  passwordForm,
  handlePasswordChange,
  handleSavePassword,
  savingPassword,
  passwordError,
  passwordSuccess,
}) {
  const fileInputRef = useRef(null);
  const [localPreview, setLocalPreview] = useState(null);

  const onPickFile = () => fileInputRef.current?.click();

  const onFileSelected = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const objectUrl = URL.createObjectURL(file);
    setLocalPreview(objectUrl);
    handleAvatarFileChange?.(file);
  };

  const displayPreview = localPreview || preview;

  return (
    <>
      {/* Teacher info form */}
      <section className={`${styles.profileCardTeacher} ${styles.profileCardInfo}`}>
        <button
          className={styles.profileCardClose}
          onClick={onClose}
          aria-label="Close"
        >
          <X size={16} />
        </button>

        <h3 className={styles.profileCardTitle}>
          <GraduationCap size={16} className={styles.profileCardTitleIcon} />
          Instructor Profile
        </h3>

        <div className={styles.profileCardField}>
          <label>Job Title / Expertise</label>
          <input
            type="text"
            placeholder="VD: Senior Full-stack Instructor"
            value={form.title}
            onChange={handleChange('title')}
          />
        </div>

        <div className={styles.profileCardField}>
          <label>About Me</label>
          <textarea
            placeholder="Kinh nghiệm, chuyên môn giảng dạy..."
            rows={4}
            value={form.bio}
            onChange={handleChange('bio')}
          />
        </div>

        <div className={styles.profileCardField}>
          <label>Years of Experience</label>
          <input
            type="number"
            min={0}
            value={form.yearsOfExperience}
            onChange={handleChange('yearsOfExperience')}
          />
        </div>

        <div className={styles.profileCardField}>
          <label>Submitted Portfolios</label>
          {existingPortfolio?.length > 0 ? (
            <ul className={styles.portfolioFileList}>
              {existingPortfolio.map((url) => (
                <li key={url}>
                  <FileText size={14} />
                  <a href={url} target="_blank" rel="noreferrer">
                    {url.split('/').pop()}
                  </a>
                </li>
              ))}
            </ul>
          ) : (
            <p className={styles.profileCardHint}>There is no Portfolios</p>
          )}
        </div>

        <div className={styles.formActions}>
          <button className={`${styles.btn} ${styles.btnGhost}`} onClick={onCancel} type="button">
            Cancel
          </button>
          <button
            className={`${styles.btn} ${styles.btnPrimary}`}
            onClick={handleSaveInstructor}
            disabled={saving}
            type="button"
          >
            {saving ? 'Saving...' : 'Save changes'}
          </button>
        </div>
      </section>

      {/* Avatar card */}
      <section className={styles.profileCardAva}>
        <h3 className={styles.profileCardTitle}>Avatar</h3>
        <div className={`${styles.imagePreview} ${styles.imagePreviewAvatar}`}>
          {displayPreview ? (
            <img src={displayPreview} alt="Avatar preview" className={styles.imagePreviewImg} />
          ) : (
            <ImageIcon className={styles.imagePreviewPlaceholder} />
          )}
        </div>

        <div className={styles.profileCardField}>
          <label>Change Avatar</label>
          <div className={styles.imageUploadRow}>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/png, image/jpeg, image/webp"
              onChange={onFileSelected}
              hidden
            />
            <button className={`${styles.btn} ${styles.btnSecondary}`} onClick={onPickFile} type="button">
              Browse File
            </button>
            {localPreview && (
              <span className={styles.imageUploadRowHint}>
                Your new photo will be saved when you click "Save changes"
              </span>
            )}
          </div>
        </div>

        <div className={styles.formActions}>
          <button className={`${styles.btn} ${styles.btnGhost}`} onClick={onCancel} type="button">
            Cancel
          </button>
          <button
            className={`${styles.btn} ${styles.btnPrimary}`}
            onClick={handleSaveProfile}
            disabled={savingAvatar}
            type="button"
          >
            {savingAvatar ? 'Saving...' : 'Save changes'}
          </button>
        </div>
      </section>

      {/* Change password card */}
      <section className={styles.profileCardPass}>
        <h3 className={styles.profileCardTitle}>
          <Lock size={16} className={styles.profileCardTitleIcon} />
          Change Password
        </h3>

        <div className={styles.profileCardField}>
          <label>Your Current Password</label>
          <input
            type="password"
            placeholder="Enter current password"
            value={passwordForm.currentPassword}
            onChange={handlePasswordChange('currentPassword')}
          />
        </div>

        <div className={styles.profileCardRow}>
          <div className={styles.profileCardField}>
            <label>New Password</label>
            <input
              type="password"
              placeholder="Enter new password"
              value={passwordForm.newPassword}
              onChange={handlePasswordChange('newPassword')}
            />
          </div>
          <div className={styles.profileCardField}>
            <label>Confirm New Password</label>
            <input
              type="password"
              placeholder="Re-enter new password"
              value={passwordForm.confirmPassword}
              onChange={handlePasswordChange('confirmPassword')}
            />
          </div>
        </div>

        {passwordError && <p className={styles.profileCardError}>{passwordError}</p>}
        {passwordSuccess && (
          <p className={styles.profileCardSuccess}>
            <CheckCircle2 size={16} />
            {passwordSuccess}
          </p>
        )}

        <div className={styles.formActions}>
          <button
            className={`${styles.btn} ${styles.btnPrimary}`}
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