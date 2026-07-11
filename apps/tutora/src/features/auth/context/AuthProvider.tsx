/**
 * AuthProvider — owns auth state and the sign-in / sign-out orchestration (#22).
 *
 * A small `useReducer` state machine (idle → signing-in → authenticated | error)
 * keeps transitions explicit and race-free. The provider composes the three
 * mocked-in-tests collaborators — the Google gateway, the auth API, and Secure
 * Store — so the UI stays presentational. Server-state wiring (TanStack Query,
 * token refresh) is out of scope and lands in #24.
 */
import { useCallback, useMemo, useReducer, type ReactNode } from 'react';

import { signInWithGoogleIdToken } from '../api/auth.api';
import { AUTH_COPY } from '../constants';
import { authStorage } from '../services/auth-storage';
import { googleAuthGateway } from '../services/google-auth.gateway';
import type { AuthContextValue, AuthUser } from '../types';

import { AuthContext } from './auth-context';

type AuthState = {
  user: AuthUser | null;
  isSigningIn: boolean;
  error: string | null;
};

type AuthAction =
  | { type: 'signInStart' }
  | { type: 'signInSuccess'; user: AuthUser }
  | { type: 'signInError'; error: string }
  | { type: 'signOut' };

const INITIAL_STATE: AuthState = { user: null, isSigningIn: false, error: null };

function reducer(state: AuthState, action: AuthAction): AuthState {
  switch (action.type) {
    case 'signInStart':
      return { ...state, isSigningIn: true, error: null };
    case 'signInSuccess':
      return { user: action.user, isSigningIn: false, error: null };
    case 'signInError':
      return { user: null, isSigningIn: false, error: action.error };
    case 'signOut':
      return INITIAL_STATE;
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

  const signInWithGoogle = useCallback(async () => {
    dispatch({ type: 'signInStart' });
    try {
      const { idToken } = await googleAuthGateway.signIn();
      const { accessToken, refreshToken, user } = await signInWithGoogleIdToken(idToken);
      await authStorage.setTokens({ accessToken, refreshToken });
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
      dispatch({ type: 'signOut' });
    }
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user: state.user,
      isAuthenticated: state.user !== null,
      isSigningIn: state.isSigningIn,
      error: state.error,
      signInWithGoogle,
      signOut,
    }),
    [state, signInWithGoogle, signOut],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
