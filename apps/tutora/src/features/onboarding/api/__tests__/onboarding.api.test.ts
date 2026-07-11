/**
 * onboarding API — PATCH the role choice via the shared client (issue #23).
 */
import { apiClient } from '@/shared/lib';
import type { AuthUser } from '@features/auth';
import { ONBOARDING_UPDATE_ME_ENDPOINT } from '@features/onboarding/constants';

import { completeOnboarding } from '../onboarding.api';

jest.mock('@/shared/lib', () => ({
  apiClient: { patch: jest.fn() },
}));

const mockedPatch = apiClient.patch as jest.Mock;

const UPDATED_USER: AuthUser = {
  id: 'user-1',
  email: 'aygun@example.com',
  name: 'Aygün Məmmədova',
  avatarUrl: null,
  role: 'TUTOR',
  onboardingCompleted: true,
};

describe('completeOnboarding (#23)', () => {
  it('PATCHes the selected role to /users/me', async () => {
    mockedPatch.mockResolvedValueOnce({ data: UPDATED_USER });

    await completeOnboarding('TUTOR');

    expect(mockedPatch).toHaveBeenCalledWith(ONBOARDING_UPDATE_ME_ENDPOINT, { role: 'TUTOR' });
  });

  it('resolves with the updated user', async () => {
    mockedPatch.mockResolvedValueOnce({ data: UPDATED_USER });

    await expect(completeOnboarding('TUTOR')).resolves.toEqual(UPDATED_USER);
  });
});
