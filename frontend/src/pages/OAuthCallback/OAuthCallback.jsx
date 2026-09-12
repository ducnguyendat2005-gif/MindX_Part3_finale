import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { API, fetchWithAuth, tokenStorage } from '../../config/api.js';

export default function OAuthCallback() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;

    const completeOAuth = async () => {
      const code = searchParams.get('code');
      if (!code) {
        if (!cancelled) setError('Social sign-in code is missing.');
        return;
      }

      try {
        const exchangeResponse = await fetch(API.oauthExchange, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ code }),
        });
        const exchangeResult = await exchangeResponse.json().catch(() => ({}));
        if (!exchangeResponse.ok || !exchangeResult.success) {
          throw new Error(exchangeResult.message || 'Social sign-in failed');
        }

        const { ATtoken, RTtoken } = exchangeResult.data;
        tokenStorage.set(ATtoken, RTtoken);

        const profileResponse = await fetchWithAuth(API.myprofile);
        if (!profileResponse.ok) throw new Error('Could not load your account');
        const profileResult = await profileResponse.json();
        const mergedUser = {
          ...profileResult.user,
          myCourses: (profileResult.courses || []).map((enrollment) => enrollment.courseId),
        };
        tokenStorage.setUser(mergedUser, ATtoken);
        window.dispatchEvent(new Event('userUpdated'));

        navigate(mergedUser.role === 'admin' ? '/admin' : '/', { replace: true });
      } catch (oauthError) {
        tokenStorage.clear();
        if (!cancelled) setError(oauthError.message || 'Social sign-in failed');
      }
    };

    completeOAuth();
    return () => { cancelled = true; };
  }, [navigate, searchParams]);

  if (error) {
    return (
      <main style={{ maxWidth: 480, margin: '80px auto', padding: 24, textAlign: 'center' }}>
        <h1>Social sign-in failed</h1>
        <p>{error}</p>
        <button type="button" onClick={() => navigate('/signin', { replace: true })}>
          Back to sign in
        </button>
      </main>
    );
  }

  return <main style={{ padding: 80, textAlign: 'center' }}>Signing you in...</main>;
}
