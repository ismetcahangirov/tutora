/**
 * useGoogleSignIn + AuthProvider orchestration (issue #22).
 *
 * The gateway, storage, and API are mocked so no native module runs and the
 * flow is deterministic. Covers: success (tokens stored, user set), failure
 * (error surfaced, nothing stored), and sign-out (storage cleared, state reset).
 */
import { act, renderHook, waitFor } from '@testing-library/react-native';
import type { ReactNode } from 'react';

import { signInWithGoogleIdToken } from '@features/auth/api/auth.api';
import { AuthProvider } from '@features/auth/context/AuthProvider';
import { googleAuthGateway } from '@features/auth/services/google-auth.gateway';
import { authStorage } from '@features/auth/services/auth-storage';
import type { AuthResponse } from '@features/auth/types';

import { useGoogleSignIn } from '../useGoogleSignIn';

jest.mock('@features/auth/services/google-auth.gateway', () => ({
  googleAuthGateway: { signIn: jest.fn(), signOut: jest.fn(async () => undefined) },
}));
jest.mock('@features/auth/services/auth-storage', () => ({
  authStorage: {
    setTokens: jest.fn(async () => undefined),
    getTokens: jest.fn(async () => null),
    clear: jest.fn(async () => undefined),
  },
}));
jest.mock('@features/auth/api/auth.api', () => ({
  signInWithGoogleIdToken: jest.fn(),
}));

const mockedGateway = jest.mocked(googleAuthGateway);
const mockedStorage = jest.mocked(authStorage);
const mockedApi = jest.mocked(signInWithGoogleIdToken);

const AUTH_RESPONSE: AuthResponse = {
  accessToken: 'access-123',
  refreshToken: 'refresh-456',
  user: {
    id: 'user-1',
    email: 'aygun@example.com',
    name: 'Aygün Məmmədova',
    avatarUrl: null,
    role: 'STUDENT',
    onboardingCompleted: false,
  },
};

function wrapper({ children }: { children: ReactNode }) {
  return <AuthProvider>{children}</AuthProvider>;
}

describe('useGoogleSignIn (#22)', () => {
  it('stores tokens and sets the user on success', async () => {
    mockedGateway.signIn.mockResolvedValue({ idToken: 'id-token-abc' });
    mockedApi.mockResolvedValue(AUTH_RESPONSE);

    const { result } = await renderHook(() => useGoogleSignIn(), { wrapper });

    await act(async () => {
      await result.current.signInWithGoogle();
    });

    expect(mockedApi).toHaveBeenCalledWith('id-token-abc');
    expect(mockedStorage.setTokens).toHaveBeenCalledWith({
      accessToken: AUTH_RESPONSE.accessToken,
      refreshToken: AUTH_RESPONSE.refreshToken,
    });
    expect(result.current.user).toEqual(AUTH_RESPONSE.user);
    expect(result.current.isAuthenticated).toBe(true);
    expect(result.current.error).toBeNull();
  });

  it('surfaces an error and stores nothing when sign-in fails', async () => {
    mockedGateway.signIn.mockRejectedValue(new Error('gateway boom'));

    const { result } = await renderHook(() => useGoogleSignIn(), { wrapper });

    await act(async () => {
      await result.current.signInWithGoogle();
    });

    expect(mockedApi).not.toHaveBeenCalled();
    expect(mockedStorage.setTokens).not.toHaveBeenCalled();
    expect(result.current.user).toBeNull();
    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.error).toBeTruthy();
  });

  it('clears storage and resets state on sign-out', async () => {
    mockedGateway.signIn.mockResolvedValue({ idToken: 'id-token-abc' });
    mockedApi.mockResolvedValue(AUTH_RESPONSE);

    const { result } = await renderHook(() => useGoogleSignIn(), { wrapper });

    await act(async () => {
      await result.current.signInWithGoogle();
    });
    await waitFor(() => expect(result.current.isAuthenticated).toBe(true));

    await act(async () => {
      await result.current.signOut();
    });

    expect(mockedStorage.clear).toHaveBeenCalledTimes(1);
    expect(mockedGateway.signOut).toHaveBeenCalledTimes(1);
    expect(result.current.user).toBeNull();
    expect(result.current.isAuthenticated).toBe(false);
  });
});
