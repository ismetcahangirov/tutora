/**
 * useTutorDashboard (#52) — composes the profile + pending-applications hooks. We
 * mock both so the test asserts the composition, not the network: the profile
 * drives the error state, and the pending total is surfaced as `pendingApplications`.
 */
import { renderHook } from '@testing-library/react-native';

import { useMyTutorProfile } from '@features/tutor-profile';
import { useTutorApplications } from '@features/tutor-applications';

import { useTutorDashboard } from '../useTutorDashboard';

jest.mock('@features/tutor-profile', () => ({ useMyTutorProfile: jest.fn() }));
jest.mock('@features/tutor-applications', () => ({ useTutorApplications: jest.fn() }));

const mockedProfile = useMyTutorProfile as jest.MockedFunction<typeof useMyTutorProfile>;
const mockedApplications = useTutorApplications as jest.MockedFunction<typeof useTutorApplications>;

function profileResult(overrides: Partial<ReturnType<typeof useMyTutorProfile>> = {}) {
  return {
    profile: { profileViews: 12 } as ReturnType<typeof useMyTutorProfile>['profile'],
    isLoading: false,
    isError: false,
    isRefetching: false,
    refetch: jest.fn(),
    ...overrides,
  };
}

function applicationsResult(total: number) {
  return {
    applications: [],
    total,
    isLoading: false,
    isError: false,
    isRefetching: false,
    refetch: jest.fn(),
  };
}

describe('useTutorDashboard (#52)', () => {
  it('surfaces the profile and the pending applications total', async () => {
    mockedProfile.mockReturnValue(profileResult());
    mockedApplications.mockReturnValue(applicationsResult(4));

    const { result } = await renderHook(() => useTutorDashboard());

    expect(result.current.profile?.profileViews).toBe(12);
    expect(result.current.pendingApplications).toBe(4);
    expect(result.current.isError).toBe(false);
  });

  it('lets the profile error drive the dashboard error state', async () => {
    mockedProfile.mockReturnValue(profileResult({ isError: true, profile: undefined }));
    mockedApplications.mockReturnValue(applicationsResult(0));

    const { result } = await renderHook(() => useTutorDashboard());

    expect(result.current.isError).toBe(true);
  });
});
