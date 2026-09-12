import { ArrowRight } from 'lucide-react';
import { motion } from 'motion/react';
import { useState } from 'react';
import { API } from '../../config/api.js';
import './BasicInfoForm.module.scss';
import { useLanguage } from '../../context/LanguageContext.jsx';

export default function BasicInfoForm({ onNext }) {
  const { t } = useLanguage();
  const [Fname, setFname] = useState('');
  const [Lname, setLname] = useState('');
  const [Username, setUsername] = useState('');
  const [checkingEmail, setCheckingEmail] = useState(false);
  const [Email, setEmail] = useState('');
  const [pass, setpass] = useState('');
  const [Repass, setRepass] = useState('');
  const [errors, setErrors] = useState({});

  const handleSocialSignup = (provider) => {
    window.location.assign(API.oauthStart(provider));
  };

  const clearError = (field) => {
    setErrors((prev) => ({ ...prev, [field]: false }));
  };

  const errorMessage = (error) => (error?.startsWith('auth.') ? t(error) : error);

  const handleContinue = async () => {
    const newErrors = {};
    if (!Fname) newErrors.Fname = 'auth.required';
    if (!Lname) newErrors.Lname = 'auth.required';
    if (!Username) newErrors.Username = 'auth.required';
    if (!Email) newErrors.Email = 'auth.required';
    if (!pass) newErrors.pass = 'auth.required';
    if (!Repass) newErrors.Repass = 'auth.required';
    else if (pass !== Repass) newErrors.Repass = 'auth.passwordMismatch';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setCheckingEmail(true);
    try {
      const res = await fetch(API.checkDuplicateEmail, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: Username.trim(),
          email: Email.trim(),
        }),
      });

      if (!res.ok) {
        const result = await res.json();
        const duplicateErrors = {};
        if (result.duplicateUsername || result.errors?.Username) {
          duplicateErrors.Username = 'auth.usernameTaken';
        }
        if (result.duplicateEmail || result.errors?.Email) {
          duplicateErrors.Email = 'auth.emailTaken';
        }
        setErrors(
          Object.keys(duplicateErrors).length > 0
            ? duplicateErrors
            : { Email: 'auth.registrationCheckFailed' },
        );
        return;
      }

      onNext({
        Fname: Fname.trim(),
        Lname: Lname.trim(),
        Username: Username.trim(),
        Email: Email.trim(),
        pass,
      });
    } catch {
      setErrors({ Email: 'auth.registrationCheckFailed' });
    } finally {
      setCheckingEmail(false);
    }
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
        <h1>{t('auth.createAccount')}</h1>
      </div>

      <form
        className="signup-form"
        onSubmit={(e) => { e.preventDefault(); handleContinue(); }}
        autoComplete="off"
      >
        <div className="form-row">
          <div className="signup-field">
            <label>{t('auth.fullName')}</label>
            <input
              style={inputStyle('Fname')}
              value={Fname}
              onChange={(e) => { setFname(e.target.value); if (e.target.value) clearError('Fname'); }}
              type="text"
              name="firstName"
              autoComplete="given-name"
              placeholder={t('auth.firstName')}
            />
            {errors.Fname && <p className="signup-field-error">{errorMessage(errors.Fname)}</p>}
          </div>

          <div className="signup-field signup-field--no-label">
            <input
              style={inputStyle('Lname')}
              value={Lname}
              onChange={(e) => { setLname(e.target.value); if (e.target.value) clearError('Lname'); }}
              type="text"
              name="lastName"
              autoComplete="family-name"
              placeholder={t('auth.lastName')}
            />
            {errors.Lname && <p className="signup-field-error">{errorMessage(errors.Lname)}</p>}
          </div>
        </div>

        <div className="signup-field">
          <label>{t('auth.username')}</label>
          <input
            style={inputStyle('Username')}
            value={Username}
            onChange={(e) => { setUsername(e.target.value); if (e.target.value) clearError('Username'); }}
            type="text"
            name="signup-username"
            autoComplete="off"
            placeholder={t('auth.username')}
          />
          {errors.Username && <p className="signup-field-error">{errorMessage(errors.Username)}</p>}
        </div>

        <div className="signup-field">
          <label>Email</label>
          <input
            style={inputStyle('Email')}
            value={Email}
            onChange={(e) => { setEmail(e.target.value); if (e.target.value) clearError('Email'); }}
            type="email"
            name="signup-email"
            autoComplete="email"
            placeholder={t('auth.emailId')}
          />
          {errors.Email && <p className="signup-field-error">{errorMessage(errors.Email)}</p>}
        </div>

        <div className="form-row">
          <div className="signup-field">
            <label>{t('auth.password')}</label>
            <input
              style={inputStyle('pass')}
              value={pass}
              onChange={(e) => { setpass(e.target.value); if (e.target.value) clearError('pass'); }}
              type="password"
              name="new-password"
              autoComplete="new-password"
              placeholder={t('auth.passwordPlaceholder')}
            />
            {errors.pass && <p className="signup-field-error">{errorMessage(errors.pass)}</p>}
          </div>

          <div className="signup-field">
            <label>{t('auth.confirmPassword')}</label>
            <input
              style={inputStyle('Repass')}
              value={Repass}
              onChange={(e) => { setRepass(e.target.value); if (e.target.value) clearError('Repass'); }}
              type="password"
              name="confirm-password"
              autoComplete="new-password"
              placeholder={t('auth.confirmPassword')}
            />
            {errors.Repass && <p className="signup-field-error">{errorMessage(errors.Repass)}</p>}
          </div>
        </div>

        <button type="submit" className="signup-btn" disabled={checkingEmail}>
          {checkingEmail ? t('auth.checking') : t('auth.continue')}
          {!checkingEmail && <ArrowRight className="btn-icon" />}
        </button>
      </form>

      <div className="divider">
        <span>{t('auth.signUpWith')}</span>
      </div>

      <div className="social-buttons">
        <button className="social-btn" type="button" onClick={() => handleSocialSignup('facebook')}>
          <img src="https://www.svgrepo.com/show/475647/facebook-color.svg" alt="Facebook" />
          <span className="social-btn__label social-btn__label--facebook">Facebook</span>
        </button>
        <button className="social-btn" type="button" onClick={() => handleSocialSignup('google')}>
          <img src="https://www.svgrepo.com/show/475656/google-color.svg" alt="Google" />
          <span className="social-btn__label social-btn__label--google">Google</span>
        </button>
        <button className="social-btn" type="button" onClick={() => handleSocialSignup('microsoft')}>
          <img src="https://www.svgrepo.com/show/448239/microsoft.svg" alt="Microsoft" />
          <span className="social-btn__label social-btn__label--microsoft">Microsoft</span>
        </button>
      </div>
    </motion.div>
  );
}
