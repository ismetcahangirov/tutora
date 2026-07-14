/**
 * Session persistence for the admin SPA (issue #60).
 *
 * Tokens live in `localStorage` so a refresh survives a page reload. This is the
 * pragmatic option given the backend returns tokens in the response body (built
 * for the mobile app); the intended hardening is httpOnly, SameSite cookies once
 * the backend can set them for the admin origin. Reads are validated with Zod so
 * a tampered/partial value is treated as "no session" rather than trusted.
 */
import type { SessionTokens } from '@shared/lib';

import { STORAGE_TOKENS_KEY, STORAGE_USER_KEY } from '../constants';
import { authUserSchema, sessionTokensSchema, type AuthUser } from '../types';

export type PersistedSession = {
  tokens: SessionTokens;
  user: AuthUser;
};

function readJson(key: string): unknown {
  const raw = localStorage.getItem(key);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

/** Read and validate the persisted session, or `null` if absent/corrupt. */
export function readPersistedSession(): PersistedSession | null {
  const tokens = sessionTokensSchema.safeParse(readJson(STORAGE_TOKENS_KEY));
  const user = authUserSchema.safeParse(readJson(STORAGE_USER_KEY));
  if (!tokens.success || !user.success) return null;
  return { tokens: tokens.data, user: user.data };
}

/** Persist the token pair (and optionally an updated user) to localStorage. */
export function persistSession(tokens: SessionTokens, user?: AuthUser): void {
  localStorage.setItem(STORAGE_TOKENS_KEY, JSON.stringify(tokens));
  if (user) localStorage.setItem(STORAGE_USER_KEY, JSON.stringify(user));
}

/** Remove every trace of the session from localStorage. */
export function clearPersistedSession(): void {
  localStorage.removeItem(STORAGE_TOKENS_KEY);
  localStorage.removeItem(STORAGE_USER_KEY);
}
