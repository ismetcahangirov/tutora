/**
 * useRoleSelection — selection + submit lifecycle (issue #23).
 *
 * `useAuth` and the onboarding API are mocked so the hook is exercised in
 * isolation: we assert selection state, that submit persists the role and syncs
 * the user, and that a failure surfaces an error without syncing.
 */
import { act, renderHook, waitFor } from '@testing-library/react-native';

import type { AuthUser } from '@features/auth';
import { completeOnboarding } from '@features/onboarding/api/onboarding.api';
import { ONBOARDING_COPY } from '@features/onboarding/constants';

import { useRoleSelection } from '../useRoleSelection';

const mockUpdateUser = jest.fn();

jest.mock('@features/auth', () => ({
  useAuth: () => ({ updateUser: mockUpdateUser }),
}));
jest.mock('@features/onboarding/api/onboarding.api', () => ({
  completeOnboarding: jest.fn(),
}));

const mockedComplete = completeOnboarding as jest.MockedFunction<typeof completeOnboarding>;

const UPDATED_USER: AuthUser = {
  id: 'user-1',
  email: 'aygun@example.com',
  name: 'Aygün Məmmədova',
  avatarUrl: null,
  role: 'TUTOR',
  onboardingCompleted: true,
};

describe('useRoleSelection (#23)', () => {
  it('records the selected role', async () => {
    const { result } = await renderHook(() => useRoleSelection());

    await act(async () => result.current.selectRole('STUDENT'));

    expect(result.current.selectedRole).toBe('STUDENT');
  });

  it('does nothing on submit when no role is selected', async () => {
    const { result } = await renderHook(() => useRoleSelection());

    await act(async () => {
      await result.current.submit();
    });

    expect(mockedComplete).not.toHaveBeenCalled();
  });

  it('persists the role and syncs the user on submit', async () => {
    mockedComplete.mockResolvedValue(UPDATED_USER);
    const { result } = await renderHook(() => useRoleSelection());

    await act(async () => result.current.selectRole('TUTOR'));
    await act(async () => {
      await result.current.submit();
    });

    expect(mockedComplete).toHaveBeenCalledWith('TUTOR');
    expect(mockUpdateUser).toHaveBeenCalledWith(UPDATED_USER);
    expect(result.current.error).toBeNull();
    expect(result.current.isSubmitting).toBe(false);
  });

  it('surfaces an error and does not sync the user when the request fails', async () => {
    mockedComplete.mockRejectedValue(new Error('network down'));
    const { result } = await renderHook(() => useRoleSelection());

    await act(async () => result.current.selectRole('STUDENT'));
    await act(async () => {
      await result.current.submit();
    });

    await waitFor(() => expect(result.current.error).toBe(ONBOARDING_COPY.role.error));
    expect(mockUpdateUser).not.toHaveBeenCalled();
    expect(result.current.isSubmitting).toBe(false);
  });
});
