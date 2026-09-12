import { ArrowRight } from 'lucide-react';
import { motion } from "framer-motion";
import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';
import { API, tokenStorage, fetchWithAuth } from '../../config/api.js';
import './SignIn.scss';
import { useLanguage } from '../../context/LanguageContext.jsx';

export default function SignInPage() {
  const { t } = useLanguage();
  const [loginError, setLoginError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const getOAuthError = (message) => {
    const normalized = String(message || '').toLowerCase();
    if (normalized.includes('session expired')) return { key: 'auth.oauthSessionExpired' };
    if (normalized.includes('cancelled')) return { key: 'auth.oauthCancelled' };
    if (normalized.includes('not configured')) return { key: 'auth.oauthUnavailable' };
    return { key: 'auth.oauthFailed' };
  };

  const getErrorMessage = (error) => (error?.key ? t(error.key) : error?.message || '');

  useEffect(() => {
    const oauthError = searchParams.get('oauthError');
    if (oauthError) setLoginError(getOAuthError(oauthError));
  }, [searchParams]);

  const handleSocialLogin = (provider) => {
    window.location.assign(API.oauthStart(provider));
  };

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
          setLoginError({ key: 'auth.accountSuspended' });
          return;
        }
        setLoginError({ key: 'auth.invalidCredentials' });
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
          setLoginError({ key: 'auth.accountSuspended' });
          return;
        }
        setLoginError({ key: 'auth.invalidCredentials' });
      }
    } catch (err) {
      setLoginError({ key: 'auth.invalidCredentials' });
    } finally {
      setSubmitting(false);
    }
  };

  const clearError = () => {
    setLoginError(null);
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
            <h1>{t('auth.signInTitle')}</h1>
          </div>

          <form className="signin-form" onSubmit={(e) => handleSignin(e)}>
            <div className="signin-form-group">
              <label>{t('auth.usernameOrEmail')}</label>
              <input
                type="text"
                name="identifier"
                autoComplete="username"
                placeholder={t('auth.usernamePlaceholder')}
                value={identifier}
                onChange={(e) => { setIdentifier(e.target.value); if (e.target.value) clearError(); }}
                style={{ borderColor: loginError ? 'red' : '', outlineColor: loginError ? 'red' : '' }}
              />
            </div>

            <div className="signin-form-group">
              <label>{t('auth.password')}</label>
              <input
                type="password"
                placeholder={t('auth.passwordPlaceholder')}
                onChange={(e) => { setPassword(e.target.value); if (e.target.value) clearError(); }}
                style={{ borderColor: loginError ? 'red' : '', outlineColor: loginError ? 'red' : '' }}
              />
            </div>

            {loginError && <p className="signin-error">{getErrorMessage(loginError)}</p>}

            <button type="submit" className="signin-btn" disabled={submitting}>
              {submitting ? t('auth.signingIn') : t('auth.signIn')}
              <ArrowRight className="btn-icon" />
            </button>
          </form>

          <div className="divider">
            <span>{t('auth.signInWith')}</span>
          </div>

          <div className="social-buttons">
            <button type="button" className="social-btn" onClick={() => handleSocialLogin('facebook')}>
              <img src="https://www.svgrepo.com/show/475647/facebook-color.svg" alt="Facebook" />
              <span className="social-btn__label social-btn__label--facebook">Facebook</span>
            </button>
            <button type="button" className="social-btn" onClick={() => handleSocialLogin('google')}>
              <img src="https://www.svgrepo.com/show/475656/google-color.svg" alt="Google" />
              <span className="social-btn__label social-btn__label--google">Google</span>
            </button>
            <button type="button" className="social-btn" onClick={() => handleSocialLogin('microsoft')}>
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
