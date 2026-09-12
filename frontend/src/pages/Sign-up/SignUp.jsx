// src/pages/SignUp/SignUpPage.jsx
import { AnimatePresence, motion } from 'motion/react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import BasicInfoForm from '../../components/BasicInfoForm/BasicInfoForm.jsx';
import RoleSelect from '../../components/RoleSelect/RoleSelect.jsx';
import ExtraForm from '../../components/ExtraForm.jsx';
import { API } from '../../config/api.js';
import './SignUp.scss';
import { useLanguage } from '../../context/LanguageContext.jsx';

export default function SignUpPage() {
  const { t } = useLanguage();
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({});
  const [submitError, setSubmitError] = useState(null);
  const navigate = useNavigate();

  const updateData = (data) => setFormData((prev) => ({ ...prev, ...data }));

  const handleFinalSubmit = async (extraData) => {
    setSubmitError(null);
    const fullData = { ...formData, ...extraData };
    const isTeacher = fullData.role === 'teacher';
    const endpoint = isTeacher ? API.registerTeacher : API.register;

    try {
      let res;

      if (isTeacher) {
        // ── Teacher: dùng FormData vì có kèm file ──
        const fd = new FormData();
        fd.append('Fname', fullData.Fname);
        fd.append('Lname', fullData.Lname);
        fd.append('Username', fullData.Username);
        fd.append('Email', fullData.Email);
        fd.append('pass', fullData.pass);
        fd.append('expertise', fullData.expertise);
        fd.append('experienceYears', fullData.experienceYears);
        fd.append('bio', fullData.bio);

        // portfolioFiles là mảng File[] từ TeacherExtraForm
        if (fullData.portfolioFiles && fullData.portfolioFiles.length > 0) {
          fullData.portfolioFiles.forEach((file) => {
            fd.append('portfolioFiles', file); // key phải khớp multer .array('portfolioFiles', 3)
          });
        }

        res = await fetch(endpoint, {
          method: 'POST',
          body: fd, // KHÔNG set Content-Type, browser tự set kèm boundary
        });
      } else {
        // ── Student: giữ nguyên JSON như cũ ──
        res = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(fullData),
        });
      }

      const result = await res.json().catch(() => ({}));

      if (!res.ok) {
        const duplicateUsername = Boolean(result.duplicateUsername || result.errors?.Username);
        const duplicateEmail = Boolean(result.duplicateEmail || result.errors?.Email);
        const errorKey = duplicateUsername && duplicateEmail
          ? 'auth.usernameEmailTaken'
          : duplicateUsername
            ? 'auth.usernameTaken'
            : duplicateEmail
              ? 'auth.emailTaken'
              : 'auth.registrationFailed';
        setSubmitError({ key: errorKey });
        // Giữ nguyên form Instructor Profile để người dùng chỉ cần sửa lỗi.
        setStep(3);
        return;
      }

      navigate('/signin');
    } catch {
      setSubmitError({ key: 'auth.connectionFailed' });
    }
  };

  return (
    <div className="signup-wrapper">
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.6 }}
        className="signup-image-panel"
      >
        <img
          src="https://images.unsplash.com/photo-1497633762265-9d179a990aa6?auto=format&fit=crop&q=80&w=1000"
          alt="Learning"
          referrerPolicy="no-referrer"
        />
        <div className="signup-image-overlay" />
      </motion.div>

      <div className="signup-form-panel">
        <div className="signup-form-inner">
          <AnimatePresence mode="wait">
            {step === 1 && (
              <BasicInfoForm
                key="basic"
                onNext={(data) => { setSubmitError(null); updateData(data); setStep(2); }}
              />
            )}
            {step === 2 && (
              <RoleSelect
                key="role"
                onSelect={(role) => {
                  setSubmitError(null);
                  updateData({ role });
                  setStep(3);
                }}
              />
            )}
            {step === 3 && (
              <ExtraForm
                key="extra"
                role={formData.role}
                onBack={() => setStep(2)}
                onSubmit={(extraData) => handleFinalSubmit(extraData)}
              />
            )}
          </AnimatePresence>
          {submitError && (
            <p className="signup-error">
              {submitError.key ? t(submitError.key) : submitError.message}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
