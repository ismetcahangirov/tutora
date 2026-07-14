/**
 * Auth session store (issue #60).
 *
 * Owns the authenticated user and session lifecycle. Token bytes live in the
 * shared api-client (in memory) and localStorage (persistence) — this store
 * holds identity + status and orchestrates sign-in, restore, and sign-out.
 * Access to the admin panel is ADMIN-only and enforced here: a non-admin
 * principal is never persisted as a session, so the app fails closed.
 */
import { create } from 'zustand';

import {
  configureAuthHandlers,
  getSessionTokens,
  setSessionTokens,
  type SessionTokens,
} from '@shared/lib';
import { canAccessAdmin } from '@shared/rbac';

import {
  AuthApiError,
  fetchCurrentUser,
  revokeSession,
  signInWithGoogleIdToken,
} from '../api/auth.api';
import { googleDisableAutoSelect } from '../services/google-identity';
import {
  clearPersistedSession,
  persistSession,
  readPersistedSession,
} from '../services/session-storage';
import type { AuthStatus, AuthUser } from '../types';

type AuthState = {
  user: AuthUser | null;
  status: AuthStatus;
  /** True while a sign-in request is in flight. */
  isSigningIn: boolean;
  /** Human-readable error from the last sign-in attempt, if any. */
  error: string | null;
};

type AuthActions = {
  /** One-shot session restore at app launch; validates against `GET /users/me`. */
  restore: () => Promise<void>;
  /** Exchange a Google idToken for a session. Rejects non-admin accounts. */
  signInWithGoogle: (idToken: string) => Promise<void>;
  /** Revoke and clear the session, returning to the sign-in screen. */
  signOut: () => Promise<void>;
  /** Dismiss the current sign-in error. */
  clearError: () => void;
};

const NOT_AUTHORIZED = 'not_authorized';

const initialState: AuthState = {
  user: null,
  status: 'restoring',
  isSigningIn: false,
  error: null,
};

export const useAuthStore = create<AuthState & AuthActions>((set) => ({
  ...initialState,

  restore: async () => {
    const persisted = readPersistedSession();
    if (!persisted) {
      set({ user: null, status: 'unauthenticated' });
      return;
    }

    // Seed the client so the validating request carries the token; keep the
    // persisted user visible while we confirm the session in the background.
    setSessionTokens(persisted.tokens);
    set({ user: persisted.user, status: 'restoring' });

    try {
      const user = await fetchCurrentUser();
      if (!canAccessAdmin(user.role)) {
        clearSession();
        set({ user: null, status: 'unauthenticated', error: NOT_AUTHORIZED });
        return;
      }
      persistSession(persisted.tokens, user);
      set({ user, status: 'authenticated' });
    } catch {
      // 401 that survived the axios refresh (or any failure) ⇒ dead session.
      clearSession();
      set({ user: null, status: 'unauthenticated' });
    }
  },

  signInWithGoogle: async (idToken) => {
    set({ isSigningIn: true, error: null });
    try {
      const { user, ...tokens } = await signInWithGoogleIdToken(idToken);

      if (!canAccessAdmin(user.role)) {
        // A valid Tutora user, but not an admin. Do not keep the session, and
        // stop GIS from auto-selecting the same account into a rejection loop.
        await revokeSession(tokens.refreshToken).catch(() => undefined);
        googleDisableAutoSelect();
        set({ status: 'unauthenticated', error: NOT_AUTHORIZED });
        return;
      }

      setSessionTokens(tokens);
      persistSession(tokens, user);
      set({ user, status: 'authenticated' });
    } catch (error) {
      set({
        status: 'unauthenticated',
        error: error instanceof AuthApiError ? 'sign_in_failed' : 'network_error',
      });
    } finally {
      set({ isSigningIn: false });
    }
  },

  signOut: async () => {
    const refreshToken = getSessionTokens()?.refreshToken;
    if (refreshToken) {
      await revokeSession(refreshToken).catch(() => undefined);
    }
    googleDisableAutoSelect();
    clearSession();
    set({ user: null, status: 'unauthenticated', error: null });
  },

  clearError: () => set({ error: null }),
}));

/** Clear the token bytes from both the in-memory client and localStorage. */
function clearSession(): void {
  setSessionTokens(null);
  clearPersistedSession();
}

// Wire the api-client's refresh/expiry callbacks to this store. Registered once,
// after the store exists, to avoid a temporal-dead-zone reference.
configureAuthHandlers({
  onRefreshed: (tokens: SessionTokens) => persistSession(tokens),
  onUnauthenticated: () => {
    clearPersistedSession();
    useAuthStore.setState({ user: null, status: 'unauthenticated' });
  },
});
