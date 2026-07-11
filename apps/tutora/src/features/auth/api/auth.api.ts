/**
 * auth API — exchange a Google idToken for Tutora tokens (issue #22).
 *
 * A single `fetch` call by design: the shared Axios instance + auth/refresh
 * interceptors land in #24, which will replace this module. Kept minimal and
 * dependency-free so that migration is a drop-in. Never logs the idToken or the
 * returned tokens.
 */
import { env } from '@/shared/config/env';

import { AUTH_GOOGLE_ENDPOINT } from '../constants';
import type { AuthResponse } from '../types';

/** Thrown when the backend rejects the sign-in (non-2xx). */
export class AuthApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
    this.name = 'AuthApiError';
  }
}

/**
 * POST the Google `idToken` to the backend and return the issued tokens + user.
 * Throws `AuthApiError` on a non-2xx response; network errors propagate as-is.
 */
export async function signInWithGoogleIdToken(idToken: string): Promise<AuthResponse> {
  const response = await fetch(`${env.EXPO_PUBLIC_API_URL}${AUTH_GOOGLE_ENDPOINT}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ idToken }),
  });

  if (!response.ok) {
    throw new AuthApiError(`Google sign-in failed (${response.status})`, response.status);
  }

  return (await response.json()) as AuthResponse;
}
