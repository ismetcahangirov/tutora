/**
 * Shared HTTP client with transparent token refresh (issue #24).
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
 * auth feature. Instead it owns an in-memory token holder and two callbacks that
 * `AuthProvider` wires up (`setAuthTokens`, `configureApiAuth`) — persistence to
 * Secure Store and sign-out stay in the auth feature where they belong.
 */
import { create, AxiosHeaders, type AxiosError, type InternalAxiosRequestConfig } from 'axios';

import { env } from '@/shared/config/env';

/** The JWT pair the client attaches and refreshes. Mirrors auth's `AuthTokens`. */
export type SessionTokens = {
  accessToken: string;
  refreshToken: string;
};

/** Callbacks the auth feature registers to persist tokens and react to sign-out. */
export type ApiAuthHandlers = {
  /** Persist a freshly rotated token pair (e.g. to Secure Store). */
  onRefreshed?: (tokens: SessionTokens) => void | Promise<void>;
  /** Refresh failed — the session is dead; clear it and route to sign-in. */
  onUnauthenticated?: () => void | Promise<void>;
};

/** Backend refresh endpoint (relative to `EXPO_PUBLIC_API_URL`). */
const AUTH_REFRESH_PATH = '/api/v1/auth/refresh';

/** Refresh must never be triggered for the auth endpoints themselves. */
function isAuthRoute(url: string | undefined): boolean {
  return url?.includes('/auth/') ?? false;
}

/** Axios marks retried requests so a failed replay cannot loop forever. */
type RetryableConfig = InternalAxiosRequestConfig & { _retry?: boolean };

// In-memory session — the request interceptor reads this synchronously so no
// Secure Store round-trip happens on the hot path.
let session: SessionTokens | null = null;
let handlers: ApiAuthHandlers = {};

// Shared in-flight refresh; null when idle. Guarantees single-flight.
let refreshPromise: Promise<SessionTokens> | null = null;

/** Update the in-memory session (sign-in, refresh, sign-out). */
export function setAuthTokens(tokens: SessionTokens | null): void {
  session = tokens;
}

/** Register the auth feature's persistence + sign-out hooks. */
export function configureApiAuth(next: ApiAuthHandlers): void {
  handlers = next;
}

export const apiClient = create({
  baseURL: env.EXPO_PUBLIC_API_URL,
  headers: { 'Content-Type': 'application/json' },
});

apiClient.interceptors.request.use((config) => {
  if (session?.accessToken) {
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
      const refreshed = await refreshSession(refreshToken);
      setAuthTokens(refreshed);
      await handlers.onRefreshed?.(refreshed);
      // Re-run the request; the request interceptor re-attaches the new token.
      return await apiClient(original);
    } catch (refreshError) {
      setAuthTokens(null);
      await handlers.onUnauthenticated?.();
      return Promise.reject(refreshError);
    }
  },
);

/** Single-flight refresh: concurrent callers await the same network call. */
function refreshSession(refreshToken: string): Promise<SessionTokens> {
  refreshPromise ??= requestRefresh(refreshToken).finally(() => {
    refreshPromise = null;
  });
  return refreshPromise;
}

/**
 * Calls the refresh endpoint through the same instance. It is exempt from the
 * response interceptor's retry logic via `isAuthRoute`, so there is no
 * recursion even when the refresh token itself is rejected.
 */
async function requestRefresh(refreshToken: string): Promise<SessionTokens> {
  const { data } = await apiClient.post<SessionTokens>(
    AUTH_REFRESH_PATH,
    { refreshToken },
    // Skip the stale access-token header — this call carries the refresh token.
    { headers: new AxiosHeaders() },
  );
  return { accessToken: data.accessToken, refreshToken: data.refreshToken };
}
