import React, { useEffect, useState } from 'react';
import { ArrowLeft, BookOpen, GraduationCap, Share2, Star, Users } from 'lucide-react';
import { Link, useParams } from 'react-router-dom';
import { API } from '../../config/api.js';
import { useLanguage } from '../../context/LanguageContext.jsx';
import './PublicProfile.scss';

const DEFAULT_AVATAR = 'https://cdn-icons-png.flaticon.com/512/149/149071.png';

export default function PublicProfile() {
  const { username } = useParams();
  const { t } = useLanguage();
  const [profile, setProfile] = useState(null);
  const [status, setStatus] = useState('loading');
  const [shared, setShared] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const loadProfile = async () => {
      setStatus('loading');
      try {
        const response = await fetch(API.publicProfile(username));
        const result = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(result.message || 'Profile not found');
        if (!cancelled) {
          setProfile(result.data);
          setStatus('ready');
        }
      } catch {
        if (!cancelled) setStatus('error');
      }
    };

    if (username) loadProfile();
    else setStatus('error');

    return () => { cancelled = true; };
  }, [username]);

  if (status === 'loading') {
    return <main className="public-profile public-profile--state">{t('publicProfile.loading')}</main>;
  }

  if (status === 'error' || !profile) {
    return (
      <main className="public-profile public-profile--state">
        <h1>{t('publicProfile.notFound')}</h1>
        <Link to="/" className="public-profile__back">{t('publicProfile.backHome')}</Link>
      </main>
    );
  }

  const instructor = profile.instructor;
  const isTeacher = profile.role === 'teacher';
  const displayAvatar = instructor?.thumbnail || profile.avatar || DEFAULT_AVATAR;

  const handleShare = async () => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: `${profile.name} | Byway`,
          text: t('profile.shareText', { username: profile.username }),
          url: window.location.href,
        });
      } else if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(window.location.href);
        setShared(true);
        window.setTimeout(() => setShared(false), 2500);
      }
    } catch (error) {
      if (error?.name !== 'AbortError') console.error('Could not share public profile:', error);
    }
  };

  return (
    <main className="public-profile">
      <div className="public-profile__topbar">
        <Link to="/" className="public-profile__back">
          <ArrowLeft size={17} /> {t('publicProfile.backHome')}
        </Link>
        <span className="public-profile__badge">{t('publicProfile.publicBadge')}</span>
      </div>

      <section className="public-profile__card">
        <div className="public-profile__identity">
          <img src={displayAvatar} alt={profile.name} className="public-profile__avatar" referrerPolicy="no-referrer" />
          <div>
            <p className="public-profile__eyebrow">{isTeacher ? t('publicProfile.teacher') : t('publicProfile.learner')}</p>
            <h1>{profile.name}</h1>
            <p className="public-profile__username">@{profile.username}</p>
          </div>
        </div>

        {profile.description && <p className="public-profile__description">{profile.description}</p>}

        {isTeacher && instructor && (
          <>
            {instructor.title && <p className="public-profile__title">{instructor.title}</p>}
            {instructor.bio && <p className="public-profile__bio">{instructor.bio}</p>}
            <div className="public-profile__stats">
              <div><Star size={17} /><strong>{instructor.rating ?? 0}</strong><span>{t('publicProfile.rating')}</span></div>
              <div><Users size={17} /><strong>{instructor.totalStudents ?? 0}</strong><span>{t('publicProfile.students')}</span></div>
              <div><BookOpen size={17} /><strong>{instructor.totalCourses ?? 0}</strong><span>{t('publicProfile.courses')}</span></div>
            </div>
          </>
        )}

        {!isTeacher && (profile.learningGoal || profile.level) && (
          <div className="public-profile__details">
            {profile.learningGoal && <div><GraduationCap size={17} /><span>{profile.learningGoal}</span></div>}
            {profile.level && <div><BookOpen size={17} /><span>{profile.level}</span></div>}
          </div>
        )}

        {profile.interests?.length > 0 && (
          <div className="public-profile__interests">
            {profile.interests.map((interest) => <span key={interest}>{interest}</span>)}
          </div>
        )}

        <p className="public-profile__privacy">{t('publicProfile.privacyNote')}</p>
        <button type="button" className="public-profile__share" onClick={handleShare}>
          <Share2 size={17} /> {shared ? t('profile.shareSuccess') : t('profile.share')}
        </button>
      </section>
    </main>
  );
}
