/**
 * auth API — exchange a Google idToken for Tutora tokens (issue #22, #24).
 *
 * Uses the shared Axios client so there is a single HTTP layer across the app.
 * This endpoint is public (no bearer required) and is exempt from the client's
 * 401 → refresh retry, so a rejection here is a genuine sign-in failure. Never
 * logs the idToken or the returned tokens.
 */
import { isAxiosError } from 'axios';

import { apiClient } from '@/shared/lib';

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
  try {
    const { data } = await apiClient.post<AuthResponse>(AUTH_GOOGLE_ENDPOINT, { idToken });
    return data;
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
