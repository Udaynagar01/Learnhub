import { useEffect, useRef, useState } from 'react';

const GOOGLE_SCRIPT_ID = 'google-identity-services';

function loadGoogleScript() {
  return new Promise((resolve, reject) => {
    if (window.google?.accounts?.id) {
      resolve();
      return;
    }
    const existing = document.getElementById(GOOGLE_SCRIPT_ID);
    if (existing) {
      existing.addEventListener('load', resolve, { once: true });
      existing.addEventListener('error', reject, { once: true });
      return;
    }
    const script = document.createElement('script');
    script.id = GOOGLE_SCRIPT_ID;
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = resolve;
    script.onerror = reject;
    document.head.appendChild(script);
  });
}

export default function GoogleSignInButton({ onCredential, onError, text = 'signin_with' }) {
  const buttonRef = useRef(null);
  const onCredentialRef = useRef(onCredential);
  const onErrorRef = useRef(onError);
  const [configured] = useState(() => Boolean(import.meta.env.VITE_GOOGLE_CLIENT_ID));

  useEffect(() => {
    onCredentialRef.current = onCredential;
    onErrorRef.current = onError;
  }, [onCredential, onError]);

  useEffect(() => {
    if (!configured) return undefined;
    let cancelled = false;
    loadGoogleScript()
      .then(() => {
        if (cancelled || !buttonRef.current) return;
        window.google.accounts.id.initialize({
          client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID,
          callback: (response) => onCredentialRef.current(response.credential),
        });
        window.google.accounts.id.renderButton(buttonRef.current, {
          theme: 'outline',
          size: 'large',
          width: buttonRef.current.offsetWidth || 320,
          text,
        });
      })
      .catch(() => onErrorRef.current?.('Could not load Google sign-in'));

    return () => {
      cancelled = true;
    };
  }, [configured, text]);

  if (!configured) {
    return (
      <button
        type="button"
        disabled
        className="w-full rounded-xl border border-slate-200 py-2.5 text-sm font-medium text-slate-400"
        title="Set VITE_GOOGLE_CLIENT_ID and GOOGLE_CLIENT_ID to enable Google login"
      >
        Continue with Google
      </button>
    );
  }

  return <div ref={buttonRef} className="min-h-[44px] w-full" />;
}
