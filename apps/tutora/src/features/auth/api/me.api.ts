/**
 * me API — fetch the authenticated user's profile (issue #24, #23).
 *
 * Goes through the shared client, so a launch-time restore with an expired
 * access token is refreshed transparently before this resolves. Consumed by
 * `AuthProvider` to rehydrate the session.
 */
import { apiClient } from '@/shared/lib';

import { AUTH_ME_ENDPOINT } from '../constants';
import type { AuthUser } from '../types';

/** GET the current user from a valid (or refreshable) access token. */
export async function fetchCurrentUser(): Promise<AuthUser> {
  const { data } = await apiClient.get<AuthUser>(AUTH_ME_ENDPOINT);
  return data;
}
