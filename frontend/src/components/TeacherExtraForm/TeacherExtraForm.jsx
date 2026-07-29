// src/components/SignUp/TeacherExtraForm.jsx
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { motion } from 'motion/react';
import { useState } from 'react';
import './TeacherExtraForm.scss';

export default function TeacherExtraForm({ onSubmit, onBack }) {
  const [expertise, setExpertise] = useState('');
  const [experienceYears, setExperienceYears] = useState('');
  const [bio, setBio] = useState('');
  const [portfolioUrl, setPortfolioUrl] = useState('');
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  const clearError = (field) => setErrors((prev) => ({ ...prev, [field]: false }));

  const handleSubmit = async () => {
    const newErrors = {};
    if (!expertise) newErrors.expertise = 'Vui lòng nhập chuyên môn của bạn';
    if (!experienceYears) newErrors.experienceYears = 'Vui lòng nhập số năm kinh nghiệm';
    if (!bio) newErrors.bio = 'Vui lòng giới thiệu ngắn về bản thân';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setSubmitting(true);
    await onSubmit({ expertise, experienceYears: Number(experienceYears), bio, portfolioUrl });
    setSubmitting(false);
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 100 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -100 }}
      transition={{ duration: 0.4 }}
      className="teacher-form-inner"
    >
      <div className="teacher-form-heading">
        <h1>Hồ sơ giảng viên</h1>
        <p>Thông tin này sẽ hiển thị công khai trên trang khóa học của bạn</p>
      </div>

      <div className="teacher-form-field">
        <label>Chuyên môn giảng dạy</label>
        <input
          style={{ borderColor: errors.expertise ? 'red' : '' }}
          value={expertise}
          onChange={(e) => { setExpertise(e.target.value); if (e.target.value) clearError('expertise'); }}
          type="text"
          placeholder="VD: Frontend Development, UI/UX Design..."
        />
        {errors.expertise && <p className="teacher-form-error">{errors.expertise}</p>}
      </div>

      <div className="teacher-form-field">
        <label>Số năm kinh nghiệm</label>
        <input
          style={{ borderColor: errors.experienceYears ? 'red' : '' }}
          value={experienceYears}
          onChange={(e) => { setExperienceYears(e.target.value); if (e.target.value) clearError('experienceYears'); }}
          type="number"
          min="0"
          placeholder="VD: 5"
        />
        {errors.experienceYears && <p className="teacher-form-error">{errors.experienceYears}</p>}
      </div>

      <div className="teacher-form-field">
        <label>Giới thiệu bản thân</label>
        <textarea
          style={{ borderColor: errors.bio ? 'red' : '' }}
          value={bio}
          onChange={(e) => { setBio(e.target.value); if (e.target.value) clearError('bio'); }}
          placeholder="Chia sẻ kinh nghiệm giảng dạy, thành tích nổi bật..."
          rows={4}
        />
        {errors.bio && <p className="teacher-form-error">{errors.bio}</p>}
      </div>

      <div className="teacher-form-field">
        <label>Link portfolio / CV (không bắt buộc)</label>
        <input
          value={portfolioUrl}
          onChange={(e) => setPortfolioUrl(e.target.value)}
          type="url"
          placeholder="https://..."
        />
      </div>

      <div className="extra-form-actions">
        <button type="button" className="back-btn" onClick={onBack}>
          <ArrowLeft className="btn-icon" />
          Quay lại
        </button>
        <button type="button" className="signup-btn" onClick={handleSubmit} disabled={submitting}>
          {submitting ? 'Đang tạo...' : 'Hoàn tất'}
          <ArrowRight className="btn-icon" />
        </button>
      </div>
    </motion.div>
  );
}