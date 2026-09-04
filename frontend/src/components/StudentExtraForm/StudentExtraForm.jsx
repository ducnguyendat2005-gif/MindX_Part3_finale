// src/components/SignUp/StudentExtraForm.jsx
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { motion } from 'motion/react';
import { useState } from 'react';
import './StudentExtraForm.scss';

const CATEGORIES = [
  'development', 'design', 'marketing', 'data-science',
  'physics', 'mathematics', 'languages', 'astrology',
];

const LEVELS = ['Beginner', 'Intermediate', 'Advanced', 'Expert'];

export default function StudentExtraForm({ onSubmit, onBack }) {
  const [interests, setInterests] = useState([]);
  const [level, setLevel] = useState('');
  const [learningGoal, setLearningGoal] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const toggleInterest = (cat) => {
    setInterests((prev) =>
      prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat]
    );
  };

  const handleSubmit = async () => {
    if (interests.length === 0) {
      setError('Chọn ít nhất 1 lĩnh vực bạn quan tâm');
      return;
    }
    if (!level) {
      setError('Chọn trình độ hiện tại của bạn');
      return;
    }
    setError('');
    setSubmitting(true);
    await onSubmit({ interests, level, learningGoal });
    setSubmitting(false);
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 100 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -100 }}
      transition={{ duration: 0.4 }}
      className="extra-form-inner"
    >
      <div className="extra-form-heading">
        <h1>Cho mình biết thêm về bạn</h1>
        <p>Giúp Byway gợi ý khóa học phù hợp hơn với bạn</p>
      </div>

      <div className="extra-form-field">
        <label>Bạn quan tâm lĩnh vực nào?</label>
        <div className="chip-group">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              type="button"
              className={`chip ${interests.includes(cat) ? 'chip--active' : ''}`}
              onClick={() => toggleInterest(cat)}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      <div className="extra-form-field">
        <label>Trình độ hiện tại</label>
        <div className="chip-group">
          {LEVELS.map((lv) => (
            <button
              key={lv}
              type="button"
              className={`chip ${level === lv ? 'chip--active' : ''}`}
              onClick={() => setLevel(lv)}
            >
              {lv}
            </button>
          ))}
        </div>
      </div>

      <div className="extra-form-field">
        <label>Mục tiêu học tập (không bắt buộc)</label>
        <textarea
          value={learningGoal}
          onChange={(e) => setLearningGoal(e.target.value)}   // ← đổi theo
          placeholder="Empty"
          rows={3}
        />
      </div>

      {error && <p className="extra-form-error">{error}</p>}

      <div className="extra-form-actions">
        <button type="button" className="back-btn" onClick={onBack}>
          <ArrowLeft className="btn-icon" />
          Back
        </button>
        <button type="button" className="signup-btn" onClick={handleSubmit} disabled={submitting}>
          {submitting ? 'Creating...' : 'Finish'}
          <ArrowRight className="btn-icon" />
        </button>
      </div>
    </motion.div>
  );
}