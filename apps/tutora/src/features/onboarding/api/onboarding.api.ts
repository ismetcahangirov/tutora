/**
 * onboarding API — persist the role choice (issue #23).
 *
 * Goes through the shared authenticated client (`PATCH /users/me`), so the
 * access token is attached and refreshed transparently. Returns the updated user
 * so the caller can sync auth state.
 */
import { apiClient } from '@/shared/lib';
import type { AuthUser } from '@features/auth';

import { ONBOARDING_UPDATE_ME_ENDPOINT } from '../constants';
import type { SelectableRole } from '../types';

/** PATCH the chosen role; the backend marks onboarding complete and echoes the user. */
export async function completeOnboarding(role: SelectableRole): Promise<AuthUser> {
  const { data } = await apiClient.patch<AuthUser>(ONBOARDING_UPDATE_ME_ENDPOINT, { role });
  return data;
}
