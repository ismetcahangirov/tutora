/**
 * useUpdateTutorProfile (#53) — a successful patch writes the returned profile
 * straight into the `me` cache, so screens re-render without a refetch. The API
 * module is mocked.
 */
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react-native';
import type { ReactNode } from 'react';

import { updateMyTutorProfile } from '@features/tutor-profile/api/tutor-profile.api';
import { tutorProfileKeys } from '@features/tutor-profile/constants';
import type { MyTutorProfile } from '@features/tutor-profile/types';

import { useUpdateTutorProfile } from '../useUpdateTutorProfile';

jest.mock('@features/tutor-profile/api/tutor-profile.api', () => ({
  updateMyTutorProfile: jest.fn(),
}));
const mockedUpdate = updateMyTutorProfile as jest.MockedFunction<typeof updateMyTutorProfile>;

const updated: MyTutorProfile = {
  id: 'tp-1',
  userId: 'u-1',
  name: 'Aygün',
  avatarUrl: null,
  bio: null,
  experienceYears: 3,
  hourlyRate: 45,
  pricingTiers: [{ period: 'HOURLY', amount: 45 }],
  currency: 'AZN',
  formats: ['ONLINE'],
  verificationStatus: 'VERIFIED',
  ratingAvg: 0,
  ratingCount: 0,
  profileViews: 0,
  isPublished: true,
  subjects: [],
  districts: [],
  languages: [],
  certificates: [],
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
};

describe('useUpdateTutorProfile (#53)', () => {
  it('writes the returned profile into the me cache on success', async () => {
    mockedUpdate.mockResolvedValueOnce(updated);
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    const wrapper = ({ children }: { children: ReactNode }) => (
      <QueryClientProvider client={client}>{children}</QueryClientProvider>
    );

    const { result } = await renderHook(() => useUpdateTutorProfile(), { wrapper });

    await result.current.update({
      pricingTiers: [{ period: 'HOURLY', amount: 45 }],
      isPublished: true,
    });

    await waitFor(() => expect(client.getQueryData(tutorProfileKeys.me())).toEqual(updated));
    expect(mockedUpdate).toHaveBeenCalledWith({
      pricingTiers: [{ period: 'HOURLY', amount: 45 }],
      isPublished: true,
    });
  });
});
