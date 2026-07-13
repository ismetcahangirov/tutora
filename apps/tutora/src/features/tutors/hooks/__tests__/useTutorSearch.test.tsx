/**
 * useTutorSearch (#43) — the infinite query flattens pages, surfaces `total` +
 * `hasNextPage`, and appends the next page on demand. The API module is mocked.
 */
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react-native';
import type { ReactNode } from 'react';

import { searchTutors } from '@features/tutors/api/tutors.api';
import type { Paginated, TutorSummary } from '@features/tutors/types';
import { tutorSummary } from '@features/tutors/__tests__/fixtures';

import { useTutorSearch } from '../useTutorSearch';

jest.mock('@features/tutors/api/tutors.api', () => ({ searchTutors: jest.fn() }));
const mockedSearch = searchTutors as jest.MockedFunction<typeof searchTutors>;

function makePage(overrides: Partial<Paginated<TutorSummary>['meta']>): Paginated<TutorSummary> {
  return {
    data: [tutorSummary],
    meta: {
      page: 1,
      limit: 20,
      total: 2,
      totalPages: 2,
      hasNext: false,
      hasPrev: false,
      ...overrides,
    },
  };
}

function createWrapper() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return function QueryWrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
  };
}

describe('useTutorSearch (#43)', () => {
  it('flattens the first page and exposes total + hasNextPage', async () => {
    mockedSearch.mockResolvedValueOnce(makePage({ hasNext: true }));

    const { result } = await renderHook(() => useTutorSearch({}), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.tutors).toHaveLength(1);
    expect(result.current.total).toBe(2);
    expect(result.current.hasNextPage).toBe(true);
  });

  it('appends the next page when fetchNextPage is called', async () => {
    mockedSearch
      .mockResolvedValueOnce(makePage({ page: 1, hasNext: true }))
      .mockResolvedValueOnce(makePage({ page: 2, hasNext: false }));

    const { result } = await renderHook(() => useTutorSearch({}), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.tutors).toHaveLength(1));
    await act(async () => result.current.fetchNextPage());

    await waitFor(() => expect(result.current.tutors).toHaveLength(2));
    expect(result.current.hasNextPage).toBe(false);
  });
});
