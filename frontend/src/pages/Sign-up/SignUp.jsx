import { ArrowRight } from 'lucide-react';
import { motion } from 'motion/react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { API } from '../../config/api.js';
import './SignUp.scss';

export default function SignUpPage() {
  const [Fname, setFname] = useState('');
  const [Lname, setLname] = useState('');
  const [Username, setUsername] = useState('');
  const [Email, setEmail] = useState('');
  const [pass, setpass] = useState('');
  const [Repass, setRepass] = useState('');
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();

  const clearError = (field) => {
    setErrors((prev) => ({ ...prev, [field]: false }));
  };

  const handleSignUp = async () => {
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

    setSubmitting(true);
    try {
      // Backend validateReg middleware tự kiểm tra trùng Email,
      // không cần tự GET kiểm tra trước như bản json-server cũ.
      const res = await fetch(API.register, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ Fname, Lname, Username, Email, pass }),
      });

      const result = await res.json();

      if (!res.ok) {
        // errorHandler trả { message, success: false }
        setErrors({ Email: result.message || 'Đăng ký thất bại' });
        return;
      }

      navigate('/signin');
    } catch (err) {
      setErrors({ Email: 'Không thể kết nối tới máy chủ' });
    } finally {
      setSubmitting(false);
    }
  };

  // Style động cho từng input
  const inputStyle = (field) => ({
    borderColor: errors[field] ? 'red' : '',
    outlineColor: errors[field] ? 'red' : '',
  });

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

      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.6 }}
        className="signup-form-panel"
      >
        <div className="signup-form-inner">
          <div className="signup-heading">
            <h1>Create Your Account</h1>
          </div>

          <form className="signup-form" onSubmit={(e) => { e.preventDefault(); handleSignUp(); }}>
            <div className="form-row">
              <div className="form-group">
                <label>Full Name</label>
                <input
                  style={inputStyle('Fname')}
                  onChange={(e) => { setFname(e.target.value); if (e.target.value) clearError('Fname'); }}
                  type="text"
                  placeholder="First Name"
                />
                {errors.Fname && <p style={{ color: 'red', fontSize: '12px', margin: 0 }}>{errors.Fname}</p>}
              </div>

              <div className="form-group form-group--no-label">
                <input
                  style={inputStyle('Lname')}
                  onChange={(e) => { setLname(e.target.value); if (e.target.value) clearError('Lname'); }}
                  type="text"
                  placeholder="Last Name"
                />
                {errors.Lname && <p style={{ color: 'red', fontSize: '12px', margin: 0 }}>{errors.Lname}</p>}
              </div>
            </div>

            <div className="form-group">
              <label>Username</label>
              <input
                style={inputStyle('Username')}
                onChange={(e) => { setUsername(e.target.value); if (e.target.value) clearError('Username'); }}
                type="text"
                placeholder="Username"
              />
              {errors.Username && <p style={{ color: 'red', fontSize: '12px', margin: 0 }}>{errors.Username}</p>}
            </div>

            <div className="form-group">
              <label>Email</label>
              <input
                style={inputStyle('Email')}
                onChange={(e) => { setEmail(e.target.value); if (e.target.value) clearError('Email'); }}
                type="email"
                placeholder="Email ID"
              />
              {errors.Email && <p style={{ color: 'red', fontSize: '12px', margin: 0 }}>{errors.Email}</p>}
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Password</label>
                <input
                  style={inputStyle('pass')}
                  onChange={(e) => { setpass(e.target.value); if (e.target.value) clearError('pass'); }}
                  type="password"
                  placeholder="Enter Password"
                />
                {errors.pass && <p style={{ color: 'red', fontSize: '12px', margin: 0 }}>{errors.pass}</p>}
              </div>

              <div className="form-group">
                <label>Confirm Password</label>
                <input
                  style={inputStyle('Repass')}
                  onChange={(e) => { setRepass(e.target.value); if (e.target.value) clearError('Repass'); }}
                  type="password"
                  placeholder="Confirm Password"
                />
                {errors.Repass && <p style={{ color: 'red', fontSize: '12px', margin: 0 }}>{errors.Repass}</p>}
              </div>
            </div>

            <button type="submit" className="signup-btn" disabled={submitting}>
              {submitting ? 'Creating...' : 'Create Account'}
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
        </div>
      </motion.div>
    </div>
  );
}