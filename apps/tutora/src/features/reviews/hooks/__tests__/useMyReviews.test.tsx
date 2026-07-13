/**
 * useMyReviews (#48) — fetches the caller's own reviews and exposes the list,
 * total and states. The API module is mocked.
 */
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react-native';
import type { ReactNode } from 'react';

import { getMyReviews } from '@features/reviews/api/reviews.api';
import type { MyReview } from '@features/reviews/types';
import type { Paginated } from '@/shared';

import { useMyReviews } from '../useMyReviews';

jest.mock('@features/reviews/api/reviews.api', () => ({ getMyReviews: jest.fn() }));
const mockedGetMine = getMyReviews as jest.MockedFunction<typeof getMyReviews>;

const review: MyReview = {
  id: 'r1',
  rating: 5,
  comment: 'Great',
  status: 'PUBLISHED',
  author: { id: 'me', name: 'Nigar', avatarUrl: null },
  createdAt: '2026-07-01T10:00:00.000Z',
  updatedAt: '2026-07-01T10:00:00.000Z',
};

function page(data: MyReview[], total: number): Paginated<MyReview> {
  return {
    data,
    meta: { page: 1, limit: 20, total, totalPages: 1, hasNext: false, hasPrev: false },
  };
}

function createWrapper() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return function Wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
  };
}

describe('useMyReviews (#48)', () => {
  it('exposes the reviews and total on success', async () => {
    mockedGetMine.mockResolvedValueOnce(page([review], 1));

    const { result } = await renderHook(() => useMyReviews(), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.reviews).toHaveLength(1);
    expect(result.current.total).toBe(1);
    expect(mockedGetMine).toHaveBeenCalledWith(1, 20);
  });

  it('surfaces the error state', async () => {
    mockedGetMine.mockRejectedValueOnce(new Error('boom'));

    const { result } = await renderHook(() => useMyReviews(), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.reviews).toEqual([]);
  });
});
