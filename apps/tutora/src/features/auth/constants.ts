/**
 * Auth feature — constants (issue #22).
 *
 * User-facing copy lives in the i18n catalogs under the `auth.*` namespace
 * (`@/shared/i18n`), not here.
 */

/** Secure Store keys for the token pair. No magic strings elsewhere. */
export const AUTH_STORAGE_KEYS = {
  accessToken: 'tutora.auth.accessToken',
  refreshToken: 'tutora.auth.refreshToken',
} as const;

/** Backend auth endpoint, appended to `EXPO_PUBLIC_API_URL`. */
export const AUTH_GOOGLE_ENDPOINT = '/api/v1/auth/google';

/** Current-user profile endpoint, used to restore a session at launch. */
export const AUTH_ME_ENDPOINT = '/api/v1/users/me';
