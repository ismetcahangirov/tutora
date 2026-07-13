/**
 * Review write hooks (#48) — submit / update / delete each call the API and, on
 * success, invalidate every review query so lists and the tutor average refresh.
 * The API module is mocked.
 */
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook } from '@testing-library/react-native';
import type { ReactNode } from 'react';

import { deleteReview, submitReview, updateReview } from '@features/reviews/api/reviews.api';
import { reviewKeys } from '@features/reviews/constants';
import type { MyReview } from '@features/reviews/types';

import { useDeleteReview } from '../useDeleteReview';
import { useSubmitReview } from '../useSubmitReview';
import { useUpdateReview } from '../useUpdateReview';

jest.mock('@features/reviews/api/reviews.api', () => ({
  submitReview: jest.fn(),
  updateReview: jest.fn(),
  deleteReview: jest.fn(),
}));

const mockedSubmit = submitReview as jest.MockedFunction<typeof submitReview>;
const mockedUpdate = updateReview as jest.MockedFunction<typeof updateReview>;
const mockedDelete = deleteReview as jest.MockedFunction<typeof deleteReview>;

const created: MyReview = {
  id: 'r1',
  rating: 5,
  comment: 'Great',
  status: 'PUBLISHED',
  author: { id: 'me', name: 'Nigar', avatarUrl: null },
  createdAt: '2026-07-01T10:00:00.000Z',
  updatedAt: '2026-07-01T10:00:00.000Z',
};

function setup() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: 0 } },
  });
  const invalidateSpy = jest.spyOn(client, 'invalidateQueries');
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  );
  return { wrapper, invalidateSpy };
}

describe('useSubmitReview (#48)', () => {
  it('submits and invalidates the review queries', async () => {
    mockedSubmit.mockResolvedValueOnce(created);
    const { wrapper, invalidateSpy } = setup();

    const { result } = await renderHook(() => useSubmitReview(), { wrapper });
    await act(async () => {
      await result.current.submit({ applicationId: 'app-1', rating: 5, comment: 'Great' });
    });

    expect(mockedSubmit).toHaveBeenCalledWith({
      applicationId: 'app-1',
      rating: 5,
      comment: 'Great',
    });
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: reviewKeys.all });
  });
});

describe('useUpdateReview (#48)', () => {
  it('updates by id and invalidates the review queries', async () => {
    mockedUpdate.mockResolvedValueOnce({ ...created, rating: 3 });
    const { wrapper, invalidateSpy } = setup();

    const { result } = await renderHook(() => useUpdateReview(), { wrapper });
    await act(async () => {
      await result.current.update('r1', { rating: 3 });
    });

    expect(mockedUpdate).toHaveBeenCalledWith('r1', { rating: 3 });
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: reviewKeys.all });
  });
});

describe('useDeleteReview (#48)', () => {
  it('deletes by id and invalidates the review queries', async () => {
    mockedDelete.mockResolvedValueOnce(undefined);
    const { wrapper, invalidateSpy } = setup();

    const { result } = await renderHook(() => useDeleteReview(), { wrapper });
    await act(async () => {
      await result.current.remove('r1');
    });

    expect(mockedDelete).toHaveBeenCalledWith('r1');
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: reviewKeys.all });
  });
});
