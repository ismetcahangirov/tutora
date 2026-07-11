/**
 * AuthProvider — owns auth state and the sign-in / sign-out orchestration (#22,
 * #23, #24).
 *
 * A small `useReducer` state machine keeps transitions explicit and race-free.
 * The provider composes the mocked-in-tests collaborators — the Google gateway,
 * the auth API, and Secure Store — so the UI stays presentational.
 *
 * It also owns the seam to the shared HTTP client (#24): it pushes tokens into
 * the client on sign-in, persists rotated tokens on refresh, and drops to
 * signed-out when a refresh fails. On launch it restores a persisted session
 * (#23) so returning users skip onboarding.
 */
import { useCallback, useEffect, useMemo, useReducer, useRef, type ReactNode } from 'react';

import { configureApiAuth, setAuthTokens } from '@/shared/lib';

import { signInWithGoogleIdToken } from '../api/auth.api';
import { fetchCurrentUser } from '../api/me.api';
import { AUTH_COPY } from '../constants';
import { authStorage } from '../services/auth-storage';
import { googleAuthGateway } from '../services/google-auth.gateway';
import type { AuthContextValue, AuthUser } from '../types';

import { AuthContext } from './auth-context';

type AuthState = {
  user: AuthUser | null;
  isSigningIn: boolean;
  isRestoringSession: boolean;
  error: string | null;
};

type AuthAction =
  | { type: 'restoreFinish'; user: AuthUser | null }
  | { type: 'signInStart' }
  | { type: 'signInSuccess'; user: AuthUser }
  | { type: 'signInError'; error: string }
  | { type: 'updateUser'; user: AuthUser }
  | { type: 'signOut' };

const INITIAL_STATE: AuthState = {
  user: null,
  isSigningIn: false,
  isRestoringSession: true,
  error: null,
};

function reducer(state: AuthState, action: AuthAction): AuthState {
  switch (action.type) {
    case 'restoreFinish':
      return { ...state, user: action.user, isRestoringSession: false };
    case 'signInStart':
      return { ...state, isSigningIn: true, error: null };
    case 'signInSuccess':
      return { ...state, user: action.user, isSigningIn: false, error: null };
    case 'signInError':
      return { ...state, user: null, isSigningIn: false, error: action.error };
    case 'updateUser':
      return { ...state, user: action.user };
    case 'signOut':
      return { ...INITIAL_STATE, isRestoringSession: false };
  }
}

/** Maps a thrown value to user-facing copy (cancellation vs. generic failure). */
function toErrorMessage(error: unknown): string {
  if (error instanceof Error && /cancel|dismiss/i.test(error.message)) {
    return AUTH_COPY.error.cancelled;
  }
  return AUTH_COPY.error.generic;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, INITIAL_STATE);
  const bootstrappedRef = useRef(false);

  // One-shot bootstrap: wire the HTTP client's refresh/sign-out seam, then
  // restore any persisted session. This is a genuine external-system sync at
  // launch (Secure Store + first profile fetch), not derived state — the one
  // place a mount effect is the right tool. Guarded against StrictMode double-run.
  useEffect(() => {
    if (bootstrappedRef.current) {
      return;
    }
    bootstrappedRef.current = true;

    configureApiAuth({
      // Persist the rotated pair whenever the interceptor refreshes.
      onRefreshed: (tokens) => authStorage.setTokens(tokens),
      // Refresh failed: the session is dead — clear it and drop to signed-out.
      onUnauthenticated: async () => {
        await authStorage.clear();
        setAuthTokens(null);
        dispatch({ type: 'signOut' });
      },
    });

    const restoreSession = async () => {
      try {
        const tokens = await authStorage.getTokens();
        if (!tokens) {
          dispatch({ type: 'restoreFinish', user: null });
          return;
        }
        setAuthTokens(tokens);
        const user = await fetchCurrentUser();
        dispatch({ type: 'restoreFinish', user });
      } catch {
        // Tokens invalid and un-refreshable, or a network error — fail closed.
        await authStorage.clear();
        setAuthTokens(null);
        dispatch({ type: 'restoreFinish', user: null });
      }
    };

    void restoreSession();
  }, []);

  const signInWithGoogle = useCallback(async () => {
    dispatch({ type: 'signInStart' });
    try {
      const { idToken } = await googleAuthGateway.signIn();
      const { accessToken, refreshToken, user } = await signInWithGoogleIdToken(idToken);
      await authStorage.setTokens({ accessToken, refreshToken });
      setAuthTokens({ accessToken, refreshToken });
      dispatch({ type: 'signInSuccess', user });
    } catch (error) {
      // Log context without leaking the token; surface friendly copy to the UI.
      console.warn('[auth] Google sign-in failed', error);
      dispatch({ type: 'signInError', error: toErrorMessage(error) });
    }
  }, []);

  const signOut = useCallback(async () => {
    try {
      await googleAuthGateway.signOut();
    } finally {
      await authStorage.clear();
      setAuthTokens(null);
      dispatch({ type: 'signOut' });
    }
  }, []);

  const updateUser = useCallback((user: AuthUser) => {
    dispatch({ type: 'updateUser', user });
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user: state.user,
      isAuthenticated: state.user !== null,
      isSigningIn: state.isSigningIn,
      isRestoringSession: state.isRestoringSession,
      error: state.error,
      signInWithGoogle,
      signOut,
      updateUser,
    }),
    [state, signInWithGoogle, signOut, updateUser],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
