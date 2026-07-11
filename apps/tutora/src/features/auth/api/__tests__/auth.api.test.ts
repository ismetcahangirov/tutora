/**
 * auth API — POST idToken to the backend (issue #22).
 *
 * `fetch` is mocked; we assert the URL, method, body, headers, the typed
 * response on success, and that non-2xx / network failures throw.
 */
import { env } from '@/shared/config/env';
import { AUTH_GOOGLE_ENDPOINT } from '@features/auth/constants';
import type { AuthResponse } from '@features/auth/types';

import { signInWithGoogleIdToken } from '../auth.api';

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

function mockFetchOnce(response: Partial<Response> & { json?: () => Promise<unknown> }) {
  globalThis.fetch = jest.fn().mockResolvedValue({
    ok: true,
    status: 200,
    json: async () => AUTH_RESPONSE,
    ...response,
  }) as unknown as typeof fetch;
}

describe('signInWithGoogleIdToken (#22)', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('POSTs the idToken to the versioned auth endpoint as JSON', async () => {
    mockFetchOnce({});

    await signInWithGoogleIdToken('id-token-abc');

    expect(globalThis.fetch).toHaveBeenCalledWith(
      `${env.EXPO_PUBLIC_API_URL}${AUTH_GOOGLE_ENDPOINT}`,
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({ idToken: 'id-token-abc' }),
      }),
    );
  });

  it('resolves with the typed AuthResponse on success', async () => {
    mockFetchOnce({});

    await expect(signInWithGoogleIdToken('id-token-abc')).resolves.toEqual(AUTH_RESPONSE);
  });

  it('throws on a non-2xx response', async () => {
    mockFetchOnce({ ok: false, status: 401, json: async () => ({ message: 'Invalid token' }) });

    await expect(signInWithGoogleIdToken('bad-token')).rejects.toThrow();
  });

  it('propagates network errors', async () => {
    globalThis.fetch = jest
      .fn()
      .mockRejectedValue(new Error('Network down')) as unknown as typeof fetch;

    await expect(signInWithGoogleIdToken('id-token-abc')).rejects.toThrow('Network down');
  });
});
