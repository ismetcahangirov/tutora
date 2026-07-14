/**
 * Shared HTTP client with transparent token refresh — the admin-panel port of
 * the mobile client (issue #24), adapted for the browser.
 *
 * A single Axios instance carries the access token on every request and, on a
 * 401, refreshes the token pair and replays the original request once — so
 * callers never see an expired-token error. Refresh is **single-flight**: many
 * concurrent 401s share one refresh call. This is not just an optimisation — the
 * backend rotates refresh tokens and treats a reused (already-rotated) token as
 * a compromise, revoking every session. Firing N parallel refreshes would
 * self-inflict that lockout.
 *
 * Layering: `shared/lib` sits below features, so this module must not import the
 * auth feature. It owns an in-memory token holder plus two callbacks the auth
 * store wires up (`onRefreshed`, `onUnauthenticated`) — persistence to
 * localStorage and sign-out stay in the auth feature where they belong.
 */
import { create, type AxiosError, type InternalAxiosRequestConfig } from 'axios';
import { z } from 'zod';

import { env } from '@shared/config/env';

/** The JWT pair the client attaches and refreshes. Mirrors auth's `AuthTokens`. */
export type SessionTokens = {
  accessToken: string;
  refreshToken: string;
};

/** Callbacks the auth feature registers to persist tokens and react to sign-out. */
export type ApiAuthHandlers = {
  /** Persist a freshly rotated token pair (e.g. to localStorage). */
  onRefreshed?: (tokens: SessionTokens) => void | Promise<void>;
  /** Refresh failed — the session is dead; clear it and route to sign-in. */
  onUnauthenticated?: () => void | Promise<void>;
};

/** Versioned API base; every route is mounted under `/api/v1`. */
export const API_PREFIX = '/api/v1';
const AUTH_REFRESH_PATH = `${API_PREFIX}/auth/refresh`;

/** Refresh must never be triggered for the auth endpoints themselves. */
function isAuthRoute(url: string | undefined): boolean {
  return url?.includes('/auth/') ?? false;
}

/** Boundary validation for the refresh response. */
const tokensSchema = z.object({
  accessToken: z.string().min(1),
  refreshToken: z.string().min(1),
});

/** Axios marks retried requests so a failed replay cannot loop forever. */
type RetryableConfig = InternalAxiosRequestConfig & { _retry?: boolean };

// In-memory session — the request interceptor reads this synchronously so no
// storage round-trip happens on the hot path.
let session: SessionTokens | null = null;
let handlers: ApiAuthHandlers = {};

// Shared in-flight refresh; null when idle. Guarantees single-flight per tab.
let refreshPromise: Promise<SessionTokens> | null = null;

/** Update the in-memory session (sign-in, refresh, sign-out). */
export function setSessionTokens(tokens: SessionTokens | null): void {
  session = tokens;
}

/** Read the current in-memory session (mainly for tests / diagnostics). */
export function getSessionTokens(): SessionTokens | null {
  return session;
}

/** Register the auth feature's persistence + sign-out hooks. */
export function configureAuthHandlers(next: ApiAuthHandlers): void {
  handlers = next;
}

export const apiClient = create({
  baseURL: env.VITE_API_URL,
  headers: { 'Content-Type': 'application/json' },
});

apiClient.interceptors.request.use((config) => {
  // Never attach the access token to the auth endpoints — refresh/logout carry
  // their own credential in the body, and login is public.
  if (session?.accessToken && !isAuthRoute(config.url)) {
    config.headers.set('Authorization', `Bearer ${session.accessToken}`);
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const original = error.config as RetryableConfig | undefined;
    const refreshToken = session?.refreshToken;

    // Inline conditions so TypeScript narrows `original`/`refreshToken` below.
    if (
      error.response?.status !== 401 ||
      !original ||
      original._retry ||
      isAuthRoute(original.url) ||
      !refreshToken
    ) {
      return Promise.reject(error);
    }

    original._retry = true;

    try {
      await refreshSession();
      // Re-run the request; the request interceptor re-attaches the new token.
      return await apiClient(original);
    } catch (refreshError) {
      setSessionTokens(null);
      await handlers.onUnauthenticated?.();
      return Promise.reject(refreshError);
    }
  },
);

/**
 * Single-flight refresh: concurrent callers await the same network call. On
 * success it updates the in-memory session and notifies `onRefreshed` so the
 * feature can persist the rotated pair.
 */
function refreshSession(): Promise<SessionTokens> {
  const refreshToken = session?.refreshToken;
  if (!refreshToken) return Promise.reject(new Error('No refresh token in session'));

  refreshPromise ??= requestRefresh(refreshToken)
    .then(async (tokens) => {
      setSessionTokens(tokens);
      await handlers.onRefreshed?.(tokens);
      return tokens;
    })
    .finally(() => {
      refreshPromise = null;
    });
  return refreshPromise;
}

/**
 * Calls the refresh endpoint through the same instance. It is exempt from both
 * the request interceptor's Authorization header and the response interceptor's
 * retry logic via `isAuthRoute`, so it carries only the refresh token and cannot
 * recurse even when that token is itself rejected.
 */
async function requestRefresh(refreshToken: string): Promise<SessionTokens> {
  const { data } = await apiClient.post<unknown>(AUTH_REFRESH_PATH, { refreshToken });
  return tokensSchema.parse(data);
}
