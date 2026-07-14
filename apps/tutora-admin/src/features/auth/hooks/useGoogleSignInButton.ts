import { useEffect, useRef, useState } from 'react';

import { env } from '@shared/config/env';

import { loadGoogleIdentity, type GoogleCredentialResponse } from '../services/google-identity';

type ButtonStatus = 'idle' | 'ready' | 'error';

/**
 * Loads Google Identity Services and renders the official sign-in button into a
 * container ref, forwarding the returned idToken. The GIS script is an external
 * system, so it is synced in an effect with cleanup — never used to derive state.
 */
export function useGoogleSignInButton(onCredential: (idToken: string) => void) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [status, setStatus] = useState<ButtonStatus>('idle');

  const clientId = env.VITE_GOOGLE_CLIENT_ID;
  const isConfigured = clientId.length > 0;

  // Keep the latest callback without re-rendering the Google button.
  const callbackRef = useRef(onCredential);
  useEffect(() => {
    callbackRef.current = onCredential;
  }, [onCredential]);

  useEffect(() => {
    const container = containerRef.current;
    if (!isConfigured || !container) return;

    let cancelled = false;
    loadGoogleIdentity()
      .then((google) => {
        if (cancelled) return;
        google.accounts.id.initialize({
          client_id: clientId,
          callback: (response: GoogleCredentialResponse) => {
            if (response.credential) callbackRef.current(response.credential);
          },
        });
        google.accounts.id.renderButton(container, {
          type: 'standard',
          theme: 'outline',
          size: 'large',
          shape: 'pill',
          text: 'signin_with',
          logo_alignment: 'center',
          width: 320,
        });
        setStatus('ready');
      })
      .catch(() => {
        if (!cancelled) setStatus('error');
      });

    return () => {
      cancelled = true;
      // Clear any rendered button so a re-run (e.g. StrictMode) doesn't stack a
      // second Google button into the same container.
      container.replaceChildren();
    };
  }, [clientId, isConfigured]);

  return { containerRef, status, isConfigured };
}
