// src/components/SignUp/TeacherExtraForm.jsx
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { motion } from 'motion/react';
import { useState } from 'react';
import './TeacherExtraForm.scss';

export default function TeacherExtraForm({ onSubmit, onBack }) {
  const [expertise, setExpertise] = useState('');
  const [experienceYears, setExperienceYears] = useState('');
  const [bio, setBio] = useState('');
  const [portfolioFiles, setPortfolioFiles] = useState([]); // ← đổi từ portfolioUrl (string) sang mảng File
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  const clearError = (field) => setErrors((prev) => ({ ...prev, [field]: false }));

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);

    if (files.length > 3) {
      setErrors((prev) => ({ ...prev, portfolioFiles: 'Can only choose 3 files' }));
      return;
    }

    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png'];
    const invalid = files.find((f) => !allowedTypes.includes(f.type));
    if (invalid) {
      setErrors((prev) => ({ ...prev, portfolioFiles: 'Accept only PDF, JPG or PNG' }));
      return;
    }

    clearError('portfolioFiles');
    setPortfolioFiles(files);
  };

  const removeFile = (index) => {
    setPortfolioFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    const newErrors = {};
    if (!expertise.trim()) newErrors.expertise = 'Vui lòng nhập chuyên môn của bạn';
    if (experienceYears === '') {
      newErrors.experienceYears = 'Vui lòng nhập số năm kinh nghiệm';
    } else if (Number.isNaN(Number(experienceYears)) || Number(experienceYears) < 0) {
      newErrors.experienceYears = 'Số năm kinh nghiệm phải từ 0 trở lên';
    }
    if (!bio.trim()) newErrors.bio = 'Vui lòng giới thiệu ngắn về bản thân';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setSubmitting(true);
    await onSubmit({ expertise: expertise.trim(), experienceYears: Number(experienceYears), bio: bio.trim(), portfolioFiles });
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
        <h1>Instructor Profile</h1>
        <p>This information will be displayed publicly on your course page.</p>
      </div>

      <div className="teacher-form-field">
        <label>Teaching Expertise</label>
        <input
          style={{ borderColor: errors.expertise ? 'red' : '' }}
          value={expertise}
          onChange={(e) => { setExpertise(e.target.value); if (e.target.value) clearError('expertise'); }}
          type="text"
          placeholder="EX: Frontend Development, UI/UX Design..."
        />
        {errors.expertise && <p className="teacher-form-error">{errors.expertise}</p>}
      </div>

      <div className="teacher-form-field">
        <label>Years of Experience</label>
        <input
          style={{ borderColor: errors.experienceYears ? 'red' : '' }}
          value={experienceYears}
          onChange={(e) => { setExperienceYears(e.target.value); if (e.target.value) clearError('experienceYears'); }}
          type="number"
          min="0"
          placeholder="EX: 5"
        />
        {errors.experienceYears && <p className="teacher-form-error">{errors.experienceYears}</p>}
      </div>

      <div className="teacher-form-field">
        <label>Biography / About Me</label>
        <textarea
          style={{ borderColor: errors.bio ? 'red' : '' }}
          value={bio}
          onChange={(e) => { setBio(e.target.value); if (e.target.value) clearError('bio'); }}
          placeholder="Share your teaching experience, outstanding achievements..."
          rows={4}
        />
        {errors.bio && <p className="teacher-form-error">{errors.bio}</p>}
      </div>

      <div className="teacher-form-field">
        <label>Portfolio / CV / Certificate (maximum 3 files, PDFs or pictures)</label>

        <label className="custom-file-btn">
          Choose Files
          <input
            type="file"
            multiple
            accept=".pdf,.jpg,.jpeg,.png"
            onChange={handleFileChange}
            style={{ display: 'none' }}
          />
        </label>
        <span className="file-count-text">
          {portfolioFiles.length > 0 ? `${portfolioFiles.length} file(s) selected` : 'No file chosen'}
        </span>

        {errors.portfolioFiles && <p className="teacher-form-error">{errors.portfolioFiles}</p>}

        {portfolioFiles.length > 0 && (
          <ul className="teacher-form-filelist">
            {portfolioFiles.map((file, idx) => (
              <li key={idx}>
                <span className="file-name">{file.name}</span>
                <button type="button" className="file-remove-btn" onClick={() => removeFile(idx)}>✕</button>
              </li>
            ))}
          </ul>
        )}
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
