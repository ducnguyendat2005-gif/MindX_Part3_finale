import { ArrowRight } from 'lucide-react';
import { motion } from "framer-motion";
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';
import { API, tokenStorage, fetchWithAuth } from '../../config/api.js';
import './SignIn.scss';

export default function SignInPage() {
  const [loginError, setLoginError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  const handleSignin = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const res = await fetch(API.login, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier, password }),
      });

      if (!res.ok) {
        const errorResult = await res.json().catch(() => ({}));
        if (errorResult.code === 'ACCOUNT_SUSPENDED') {
          tokenStorage.clear();
          window.alert('không thể đăng nhập vì tài khoản này đang tạm khoá');
          navigate('/signin', { replace: true });
          return;
        }
        setLoginError('Wrong username/email or password');
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
        tokenStorage.setUser(merged, ATtoken);

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
        const profileError = await profileRes.clone().json().catch(() => ({}));
        tokenStorage.clear();
        if (profileError.code === 'ACCOUNT_SUSPENDED') {
          window.alert('không thể đăng nhập vì tài khoản này đang tạm khoá');
          navigate('/signin', { replace: true });
          return;
        }
        setLoginError('Wrong username/email or password');
      }
    } catch (err) {
      setLoginError('Wrong username/email or password');
    } finally {
      setSubmitting(false);
    }
  };

  const clearError = () => {
    setLoginError('');
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
            <div className="signin-form-group">
              <label>Username or Email</label>
              <input
                type="text"
                name="identifier"
                autoComplete="username"
                placeholder="Username or Email ID"
                value={identifier}
                onChange={(e) => { setIdentifier(e.target.value); if (e.target.value) clearError(); }}
                style={{ borderColor: loginError ? 'red' : '', outlineColor: loginError ? 'red' : '' }}
              />
            </div>

            <div className="signin-form-group">
              <label>Password</label>
              <input
                type="password"
                placeholder="Enter Password"
                onChange={(e) => { setPassword(e.target.value); if (e.target.value) clearError(); }}
                style={{ borderColor: loginError ? 'red' : '', outlineColor: loginError ? 'red' : '' }}
              />
            </div>

            {loginError && <p className="signin-error">{loginError}</p>}

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
