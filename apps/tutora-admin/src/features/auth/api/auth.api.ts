/**
 * Auth API — exchange a Google idToken for Tutora tokens, fetch the current
 * user, and revoke a session (issue #60).
 *
 * Uses the shared Axios client so there is one HTTP layer. The Google endpoint
 * is public and exempt from the client's 401 → refresh retry, so a rejection
 * there is a genuine sign-in failure. Never logs the idToken or the tokens.
 */
import { isAxiosError } from 'axios';

import { apiClient } from '@shared/lib';

import { AUTH_GOOGLE_ENDPOINT, AUTH_LOGOUT_ENDPOINT, USERS_ME_ENDPOINT } from '../constants';
import { authResponseSchema, authUserSchema, type AuthResponse, type AuthUser } from '../types';

/** Thrown when the backend rejects an auth request (non-2xx). */
export class AuthApiError extends Error {
  readonly status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = 'AuthApiError';
    this.status = status;
  }
}

/**
 * POST the Google `idToken` and return the issued tokens + user, validated at
 * the boundary. Throws `AuthApiError` on a non-2xx; network errors propagate.
 */
export async function signInWithGoogleIdToken(idToken: string): Promise<AuthResponse> {
  try {
    const { data } = await apiClient.post<unknown>(AUTH_GOOGLE_ENDPOINT, { idToken });
    return authResponseSchema.parse(data);
  } catch (error) {
    if (isAxiosError(error) && error.response) {
      throw new AuthApiError(
        `Google sign-in failed (${error.response.status})`,
        error.response.status,
      );
    }
    throw error;
  }
}

/** Fetch the authenticated user's profile. Drives session restore on boot. */
export async function fetchCurrentUser(): Promise<AuthUser> {
  const { data } = await apiClient.get<unknown>(USERS_ME_ENDPOINT);
  return authUserSchema.parse(data);
}

/** Revoke the given refresh token server-side. Best-effort; failures are swallowed. */
export async function revokeSession(refreshToken: string): Promise<void> {
  await apiClient.post(AUTH_LOGOUT_ENDPOINT, { refreshToken });
}
