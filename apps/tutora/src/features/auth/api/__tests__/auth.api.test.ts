/**
 * auth API — POST idToken to the backend via the shared client (issue #22, #24).
 *
 * The shared Axios client is mocked; we assert the endpoint + body, the typed
 * response on success, that a non-2xx maps to `AuthApiError`, and that a network
 * error (no response) propagates untouched.
 */
import { AxiosError, AxiosHeaders } from 'axios';

import { apiClient } from '@/shared/lib';
import { AUTH_GOOGLE_ENDPOINT } from '@features/auth/constants';
import type { AuthResponse } from '@features/auth/types';

import { AuthApiError, signInWithGoogleIdToken } from '../auth.api';

jest.mock('@/shared/lib', () => ({
  apiClient: { post: jest.fn() },
}));

const mockedPost = apiClient.post as jest.Mock;

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

function axiosErrorWithStatus(status: number): AxiosError {
  return new AxiosError('Request failed', 'ERR_BAD_REQUEST', undefined, null, {
    status,
    data: { message: 'Invalid token' },
    statusText: '',
    headers: {},
    config: { headers: new AxiosHeaders() },
  });
}

describe('signInWithGoogleIdToken (#22, #24)', () => {
  it('POSTs the idToken to the versioned auth endpoint', async () => {
    mockedPost.mockResolvedValueOnce({ data: AUTH_RESPONSE });

    await signInWithGoogleIdToken('id-token-abc');

    expect(mockedPost).toHaveBeenCalledWith(AUTH_GOOGLE_ENDPOINT, { idToken: 'id-token-abc' });
  });

  it('resolves with the typed AuthResponse on success', async () => {
    mockedPost.mockResolvedValueOnce({ data: AUTH_RESPONSE });

    await expect(signInWithGoogleIdToken('id-token-abc')).resolves.toEqual(AUTH_RESPONSE);
  });

  it('maps a non-2xx response to AuthApiError with its status', async () => {
    mockedPost.mockRejectedValueOnce(axiosErrorWithStatus(401));

    await expect(signInWithGoogleIdToken('bad-token')).rejects.toBeInstanceOf(AuthApiError);
  });

  it('propagates network errors (no response)', async () => {
    mockedPost.mockRejectedValueOnce(new AxiosError('Network down', 'ERR_NETWORK'));

    await expect(signInWithGoogleIdToken('id-token-abc')).rejects.toThrow('Network down');
  });
});
