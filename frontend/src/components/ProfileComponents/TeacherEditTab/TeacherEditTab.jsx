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
          Thông tin giảng viên
        </h3>

        <div className={styles.profileCardField}>
          <label>Chức danh / chuyên môn</label>
          <input
            type="text"
            placeholder="VD: Senior Full-stack Instructor"
            value={form.title}
            onChange={handleChange('title')}
          />
        </div>

        <div className={styles.profileCardField}>
          <label>Giới thiệu bản thân</label>
          <textarea
            placeholder="Kinh nghiệm, chuyên môn giảng dạy..."
            rows={4}
            value={form.bio}
            onChange={handleChange('bio')}
          />
        </div>

        <div className={styles.profileCardField}>
          <label>Số năm kinh nghiệm</label>
          <input
            type="number"
            min={0}
            value={form.yearsOfExperience}
            onChange={handleChange('yearsOfExperience')}
          />
        </div>

        <div className={styles.profileCardField}>
          <label>Portfolio đã nộp</label>
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
            <p className={styles.profileCardHint}>Chưa có file portfolio nào.</p>
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
            {saving ? 'Đang lưu...' : 'Save changes'}
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
          <label>Đổi ảnh đại diện</label>
          <div className={styles.imageUploadRow}>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/png, image/jpeg, image/webp"
              onChange={onFileSelected}
              hidden
            />
            <button className={`${styles.btn} ${styles.btnSecondary}`} onClick={onPickFile} type="button">
              Chọn ảnh
            </button>
            {localPreview && (
              <span className={styles.imageUploadRowHint}>
                Ảnh mới sẽ được lưu khi bạn bấm "Save changes"
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
            {savingAvatar ? 'Đang lưu...' : 'Save changes'}
          </button>
        </div>
      </section>

      {/* Change password card */}
      <section className={styles.profileCardPass}>
        <h3 className={styles.profileCardTitle}>
          <Lock size={16} className={styles.profileCardTitleIcon} />
          Đổi mật khẩu
        </h3>

        <div className={styles.profileCardField}>
          <label>Mật khẩu hiện tại</label>
          <input
            type="password"
            placeholder="Nhập mật khẩu hiện tại"
            value={passwordForm.currentPassword}
            onChange={handlePasswordChange('currentPassword')}
          />
        </div>

        <div className={styles.profileCardRow}>
          <div className={styles.profileCardField}>
            <label>Mật khẩu mới</label>
            <input
              type="password"
              placeholder="Nhập mật khẩu mới"
              value={passwordForm.newPassword}
              onChange={handlePasswordChange('newPassword')}
            />
          </div>
          <div className={styles.profileCardField}>
            <label>Xác nhận mật khẩu mới</label>
            <input
              type="password"
              placeholder="Nhập lại mật khẩu mới"
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