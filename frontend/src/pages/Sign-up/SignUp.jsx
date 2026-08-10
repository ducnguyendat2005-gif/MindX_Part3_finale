// src/pages/SignUp/SignUpPage.jsx
import { AnimatePresence, motion } from 'motion/react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import BasicInfoForm from '../../components/BasicInfoForm/BasicInfoForm.jsx';
import RoleSelect from '../../components/RoleSelect/RoleSelect.jsx';
import ExtraForm from '../../components/ExtraForm.jsx';
import { API } from '../../config/api.js';
import './SignUp.scss';

export default function SignUpPage() {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({});
  const [submitError, setSubmitError] = useState('');
  const navigate = useNavigate();

  const updateData = (data) => setFormData((prev) => ({ ...prev, ...data }));

  const handleFinalSubmit = async (extraData) => {
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

      const result = await res.json();

      if (!res.ok) {
        setSubmitError(result.message || 'Đăng ký thất bại');
        setStep(1);
        return;
      }

      navigate('/signin');
    } catch {
      setSubmitError('Không thể kết nối tới máy chủ');
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
                onNext={(data) => { updateData(data); setStep(2); }}
              />
            )}
            {step === 2 && (
              <RoleSelect
                key="role"
                onSelect={(role) => {
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
          {submitError && <p className="signup-error">{submitError}</p>}
        </div>
      </div>
    </div>
  );
}