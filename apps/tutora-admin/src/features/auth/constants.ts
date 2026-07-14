import { API_PREFIX } from '@shared/lib';

/** Backend auth + profile endpoints (relative to `VITE_API_URL`). */
export const AUTH_GOOGLE_ENDPOINT = `${API_PREFIX}/auth/google`;
export const AUTH_LOGOUT_ENDPOINT = `${API_PREFIX}/auth/logout`;
export const USERS_ME_ENDPOINT = `${API_PREFIX}/users/me`;

/** localStorage keys for the persisted session. Namespaced to the admin app. */
export const STORAGE_TOKENS_KEY = 'tutora.admin.auth.tokens';
export const STORAGE_USER_KEY = 'tutora.admin.auth.user';

/** Google Identity Services script; loaded lazily by the sign-in button. */
export const GOOGLE_GSI_SRC = 'https://accounts.google.com/gsi/client';

/** The public sign-in route. Owned here so guards and the router agree on it. */
export const LOGIN_PATH = '/login';
