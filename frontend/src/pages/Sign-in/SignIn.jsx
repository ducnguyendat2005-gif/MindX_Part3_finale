import { ArrowRight } from 'lucide-react';
import { motion } from "framer-motion";
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';
import { API, tokenStorage, fetchWithAuth } from '../../config/api.js';
import './SignIn.scss';

export default function SignInPage() {
  const [loginError, setLoginError] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  const handleSignin = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const res = await fetch(API.login, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      if (!res.ok) {
        setLoginError(true);
        return;
      }

      const result = await res.json();
      const { ATtoken, RTtoken } = result.data;
      tokenStorage.set(ATtoken, RTtoken);

      const profileRes = await fetchWithAuth(API.myprofile);
      if (profileRes.ok) {
        const profileResult = await profileRes.json();
        const merged = {
          ...profileResult.user,
          myCourses: (profileResult.courses || []).map(e => e.courseId),
        };
        localStorage.setItem('loggedInUser', JSON.stringify(merged));
        window.dispatchEvent(new Event('userUpdated'));

        // Decode Access Token để lấy role
        let role = null;
        try {
          const decoded = jwtDecode(ATtoken);
          role = decoded.role;
        } catch (decodeErr) {
          console.error('Không thể decode token:', decodeErr);
        }

        navigate(role === 'admin' ? '/admin' : '/');
      } else {
        tokenStorage.clear();
        setLoginError(true);
      }
    } catch (err) {
      setLoginError(true);
    } finally {
      setSubmitting(false);
    }
  };

  const clearError = () => {
    setLoginError(false);
  };


  return (
    <div className="signin-wrapper">
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.6 }}
        className="signin-form-panel"
      >
        <div className="signin-form-inner">
          <div className="signin-heading">
            <h1>Sign in to your account</h1>
          </div>

          <form className="signin-form" onSubmit={(e) => handleSignin(e)}>
            <div className="form-group">
              <label>Email</label>
              <input
                type="text"
                placeholder="Username or Email ID"
                onChange={(e) => { setEmail(e.target.value); if (e.target.value) clearError(); }}
                style={{ borderColor: loginError ? 'red' : '', outlineColor: loginError ? 'red' : '' }}
              />
              {loginError && <p style={{ fontSize: "14px", color: "red" }}>Wrong email or password</p>}
            </div>

            <div className="form-group">
              <label>Password</label>
              <input
                type="password"
                placeholder="Enter Password"
                onChange={(e) => { setPassword(e.target.value); if (e.target.value) clearError(); }}
                style={{ borderColor: loginError ? 'red' : '', outlineColor: loginError ? 'red' : '' }}
              />
              {loginError && <p style={{ fontSize: "14px", color: "red" }}>Wrong email or password</p>}
            </div>

            <button type="submit" className="signin-btn" disabled={submitting}>
              {submitting ? 'Signing in...' : 'Sign In'}
              <ArrowRight className="btn-icon" />
            </button>
          </form>

          <div className="divider">
            <span>Sign in with</span>
          </div>

          <div className="social-buttons">
            <button className="social-btn">
              <img src="https://www.svgrepo.com/show/475647/facebook-color.svg" alt="Facebook" />
              <span className="social-btn__label social-btn__label--facebook">Facebook</span>
            </button>
            <button className="social-btn">
              <img src="https://www.svgrepo.com/show/475656/google-color.svg" alt="Google" />
              <span className="social-btn__label social-btn__label--google">Google</span>
            </button>
            <button className="social-btn">
              <img src="https://www.svgrepo.com/show/448239/microsoft.svg" alt="Microsoft" />
              <span className="social-btn__label social-btn__label--microsoft">Microsoft</span>
            </button>
          </div>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.6 }}
        className="signin-image-panel"
      >
        <img
          src="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&q=80&w=1000"
          alt="Collaboration"
          referrerPolicy="no-referrer"
        />
        <div className="signin-image-overlay" />
      </motion.div>
    </div>
  );
}