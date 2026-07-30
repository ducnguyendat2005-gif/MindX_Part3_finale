// src/components/SignUp/BasicInfoForm.jsx
import { ArrowRight } from 'lucide-react';
import { motion } from 'motion/react';
import { useState } from 'react';
import { API } from '../../config/api.js';   // ← thêm dòng này
import './BasicInfoForm.module.scss'

export default function BasicInfoForm({ onNext }) {
  const [Fname, setFname] = useState('');
  const [Lname, setLname] = useState('');
  const [Username, setUsername] = useState('');
  const [checkingEmail, setCheckingEmail] = useState(false); 
  const [Email, setEmail] = useState('');
  const [pass, setpass] = useState('');
  const [Repass, setRepass] = useState('');
  const [errors, setErrors] = useState({});

  const clearError = (field) => {
    setErrors((prev) => ({ ...prev, [field]: false }));
  };

  const handleContinue = async () => {
    const newErrors = {};
    if (!Fname) newErrors.Fname = 'Please fill this field';
    if (!Lname) newErrors.Lname = 'Please fill this field';
    if (!Username) newErrors.Username = 'Please fill this field';
    if (!Email) newErrors.Email = 'Please fill this field';
    if (!pass) newErrors.pass = 'Please fill this field';
    if (!Repass) newErrors.Repass = 'Please fill this field';
    else if (pass !== Repass) newErrors.Repass = 'Passwords do not match';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    setCheckingEmail(true);
    try {
      const res = await fetch(API.checkDuplicateEmail, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: Email }), // chú ý key "email" viết thường, khớp với req.body ở backend
    });

    if (!res.ok) {
      const result = await res.json();
      setErrors({ Email: result.message || 'Email existed please try others' });
      return;
    }

    onNext({ Fname, Lname, Username, Email, pass });
  } catch {
    setErrors({ Email: 'Không thể kiểm tra email lúc này' });
  } finally {
    setCheckingEmail(false);
  }

    // Không gọi API register ở đây nữa — chỉ đẩy data lên component cha
  };

  const inputStyle = (field) => ({
    borderColor: errors[field] ? 'red' : '',
    outlineColor: errors[field] ? 'red' : '',
  });

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -100 }}
      transition={{ duration: 0.4 }}
      className="signup-form-inner"
    >
      <div className="signup-heading">
        <h1>Create Your Account</h1>
      </div>

      <form className="signup-form" onSubmit={(e) => { e.preventDefault(); handleContinue(); }}>
        <div className="form-row">
          <div className="signup-field">
            <label>Full Name</label>
            <input
              style={inputStyle('Fname')}
              value={Fname}
              onChange={(e) => { setFname(e.target.value); if (e.target.value) clearError('Fname'); }}
              type="text"
              placeholder="First Name"
            />
            {errors.Fname && <p style={{ color: 'red', fontSize: '12px', margin: 0 }}>{errors.Fname}</p>}
          </div>

          <div className="signup-field signup-field--no-label">
            <input
              style={inputStyle('Lname')}
              value={Lname}
              onChange={(e) => { setLname(e.target.value); if (e.target.value) clearError('Lname'); }}
              type="text"
              placeholder="Last Name"
            />
            {errors.Lname && <p style={{ color: 'red', fontSize: '12px', margin: 0 }}>{errors.Lname}</p>}
          </div>
        </div>

        <div className="signup-field">
          <label>Username</label>
          <input
            style={inputStyle('Username')}
            value={Username}
            onChange={(e) => { setUsername(e.target.value); if (e.target.value) clearError('Username'); }}
            type="text"
            placeholder="Username"
          />
          {errors.Username && <p style={{ color: 'red', fontSize: '12px', margin: 0 }}>{errors.Username}</p>}
        </div>

        <div className="signup-field">
          <label>Email</label>
          <input
            style={inputStyle('Email')}
            value={Email}
            onChange={(e) => { setEmail(e.target.value); if (e.target.value) clearError('Email'); }}
            type="email"
            placeholder="Email ID"
          />
          {errors.Email && <p style={{ color: 'red', fontSize: '12px', margin: 0 }}>{errors.Email}</p>}
        </div>

        <div className="form-row">
          <div className="signup-field">
            <label>Password</label>
            <input
              style={inputStyle('pass')}
              value={pass}
              onChange={(e) => { setpass(e.target.value); if (e.target.value) clearError('pass'); }}
              type="password"
              placeholder="Enter Password"
            />
            {errors.pass && <p style={{ color: 'red', fontSize: '12px', margin: 0 }}>{errors.pass}</p>}
          </div>

          <div className="signup-field">
            <label>Confirm Password</label>
            <input
              style={inputStyle('Repass')}
              value={Repass}
              onChange={(e) => { setRepass(e.target.value); if (e.target.value) clearError('Repass'); }}
              type="password"
              placeholder="Confirm Password"
            />
            {errors.Repass && <p style={{ color: 'red', fontSize: '12px', margin: 0 }}>{errors.Repass}</p>}
          </div>
        </div>

        <button type="submit" className="signup-btn">
          Continue
          <ArrowRight className="btn-icon" />
        </button>
      </form>

      <div className="divider">
        <span>Sign up with</span>
      </div>

      <div className="social-buttons">
        <button className="social-btn" type="button">
          <img src="https://www.svgrepo.com/show/475647/facebook-color.svg" alt="Facebook" />
          <span className="social-btn__label social-btn__label--facebook">Facebook</span>
        </button>
        <button className="social-btn" type="button">
          <img src="https://www.svgrepo.com/show/475656/google-color.svg" alt="Google" />
          <span className="social-btn__label social-btn__label--google">Google</span>
        </button>
        <button className="social-btn" type="button">
          <img src="https://www.svgrepo.com/show/448239/microsoft.svg" alt="Microsoft" />
          <span className="social-btn__label social-btn__label--microsoft">Microsoft</span>
        </button>
      </div>
    </motion.div>
  );
}
