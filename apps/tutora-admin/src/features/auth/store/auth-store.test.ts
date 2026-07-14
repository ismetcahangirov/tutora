import { beforeEach, describe, expect, it, vi } from 'vitest';

import { getSessionTokens, setSessionTokens } from '@shared/lib';

import { fetchCurrentUser, revokeSession, signInWithGoogleIdToken } from '../api/auth.api';
import {
  clearPersistedSession,
  persistSession,
  readPersistedSession,
} from '../services/session-storage';
import { googleDisableAutoSelect } from '../services/google-identity';
import type { AuthUser } from '../types';
import { useAuthStore } from './auth-store';

vi.mock('@shared/lib', () => ({
  setSessionTokens: vi.fn(),
  getSessionTokens: vi.fn(),
  configureAuthHandlers: vi.fn(),
}));

vi.mock('../api/auth.api', () => {
  class AuthApiError extends Error {
    readonly status: number;
    constructor(message: string, status: number) {
      super(message);
      this.name = 'AuthApiError';
      this.status = status;
    }
  }
  return {
    AuthApiError,
    signInWithGoogleIdToken: vi.fn(),
    fetchCurrentUser: vi.fn(),
    revokeSession: vi.fn(),
  };
});

vi.mock('../services/session-storage', () => ({
  readPersistedSession: vi.fn(),
  persistSession: vi.fn(),
  clearPersistedSession: vi.fn(),
}));

vi.mock('../services/google-identity', () => ({
  googleDisableAutoSelect: vi.fn(),
}));

const tokens = { accessToken: 'access', refreshToken: 'refresh' };
const adminUser: AuthUser = {
  id: 'u1',
  email: 'admin@tutora.app',
  name: 'Admin',
  avatarUrl: null,
  role: 'ADMIN',
  onboardingCompleted: true,
};
const tutorUser: AuthUser = { ...adminUser, role: 'TUTOR' };

describe('auth store (#60)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(revokeSession).mockResolvedValue(undefined);
    useAuthStore.setState({ user: null, status: 'restoring', isSigningIn: false, error: null });
  });

  describe('signInWithGoogle', () => {
    it('authenticates an admin and persists the session', async () => {
      vi.mocked(signInWithGoogleIdToken).mockResolvedValue({ ...tokens, user: adminUser });

      await useAuthStore.getState().signInWithGoogle('id-token');

      const state = useAuthStore.getState();
      expect(state.status).toBe('authenticated');
      expect(state.user).toEqual(adminUser);
      expect(state.isSigningIn).toBe(false);
      expect(setSessionTokens).toHaveBeenCalledWith(tokens);
      expect(persistSession).toHaveBeenCalledWith(tokens, adminUser);
    });

    it('rejects a non-admin: no session kept, token revoked', async () => {
      vi.mocked(signInWithGoogleIdToken).mockResolvedValue({ ...tokens, user: tutorUser });

      await useAuthStore.getState().signInWithGoogle('id-token');

      const state = useAuthStore.getState();
      expect(state.status).toBe('unauthenticated');
      expect(state.error).toBe('not_authorized');
      expect(state.user).toBeNull();
      expect(revokeSession).toHaveBeenCalledWith(tokens.refreshToken);
      expect(setSessionTokens).not.toHaveBeenCalled();
      expect(persistSession).not.toHaveBeenCalled();
    });

    it('surfaces a sign-in failure from the API', async () => {
      const { AuthApiError } = await import('../api/auth.api');
      vi.mocked(signInWithGoogleIdToken).mockRejectedValue(new AuthApiError('nope', 401));

      await useAuthStore.getState().signInWithGoogle('id-token');

      const state = useAuthStore.getState();
      expect(state.status).toBe('unauthenticated');
      expect(state.error).toBe('sign_in_failed');
    });

    it('reports a network error for a non-API failure', async () => {
      vi.mocked(signInWithGoogleIdToken).mockRejectedValue(new Error('offline'));

      await useAuthStore.getState().signInWithGoogle('id-token');

      expect(useAuthStore.getState().error).toBe('network_error');
    });
  });

  describe('restore', () => {
    it('marks unauthenticated when nothing is persisted', async () => {
      vi.mocked(readPersistedSession).mockReturnValue(null);

      await useAuthStore.getState().restore();

      expect(useAuthStore.getState().status).toBe('unauthenticated');
      expect(setSessionTokens).not.toHaveBeenCalled();
    });

    it('validates a persisted admin session against /users/me', async () => {
      vi.mocked(readPersistedSession).mockReturnValue({ tokens, user: adminUser });
      vi.mocked(fetchCurrentUser).mockResolvedValue(adminUser);

      await useAuthStore.getState().restore();

      const state = useAuthStore.getState();
      expect(setSessionTokens).toHaveBeenCalledWith(tokens);
      expect(state.status).toBe('authenticated');
      expect(state.user).toEqual(adminUser);
    });

    it('discards a persisted session that is no longer an admin', async () => {
      vi.mocked(readPersistedSession).mockReturnValue({ tokens, user: adminUser });
      vi.mocked(fetchCurrentUser).mockResolvedValue(tutorUser);

      await useAuthStore.getState().restore();

      const state = useAuthStore.getState();
      expect(state.status).toBe('unauthenticated');
      expect(state.error).toBe('not_authorized');
      expect(setSessionTokens).toHaveBeenCalledWith(null);
      expect(clearPersistedSession).toHaveBeenCalled();
    });

    it('clears a dead session when validation fails', async () => {
      vi.mocked(readPersistedSession).mockReturnValue({ tokens, user: adminUser });
      vi.mocked(fetchCurrentUser).mockRejectedValue(new Error('401'));

      await useAuthStore.getState().restore();

      expect(useAuthStore.getState().status).toBe('unauthenticated');
      expect(clearPersistedSession).toHaveBeenCalled();
    });
  });

  describe('signOut', () => {
    it('revokes the token and clears the session', async () => {
      vi.mocked(getSessionTokens).mockReturnValue(tokens);
      useAuthStore.setState({ user: adminUser, status: 'authenticated' });

      await useAuthStore.getState().signOut();

      const state = useAuthStore.getState();
      expect(revokeSession).toHaveBeenCalledWith(tokens.refreshToken);
      expect(googleDisableAutoSelect).toHaveBeenCalled();
      expect(setSessionTokens).toHaveBeenCalledWith(null);
      expect(clearPersistedSession).toHaveBeenCalled();
      expect(state.status).toBe('unauthenticated');
      expect(state.user).toBeNull();
    });
  });
});
