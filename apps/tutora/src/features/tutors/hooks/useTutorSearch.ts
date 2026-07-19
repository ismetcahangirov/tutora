/**
 * useTutorSearch — paginated, filtered tutor search (student epic #40, #43).
 *
 * Wraps `useInfiniteQuery` so the results list can grow page-by-page as the user
 * scrolls. The caller passes filters (subject, district, price, rating, format,
 * language, free-text `q`, sort) — but never `page`; paging is owned here. The
 * flattened `tutors` array and `total` are derived for the screen, and a
 * `debouncedQuery`-friendly key means changing a filter transparently starts a
 * fresh, independently-cached search.
 */
import { useInfiniteQuery } from '@tanstack/react-query';
import { useMemo } from 'react';

import { searchTutors } from '../api/tutors.api';
import { DEFAULT_PAGE_SIZE, tutorKeys } from '../constants';
import type { TutorSearchParams, TutorSummary } from '../types';

export type UseTutorSearchResult = {
  tutors: TutorSummary[];
  total: number;
  isLoading: boolean;
  isError: boolean;
  isRefetching: boolean;
  isFetchingNextPage: boolean;
  hasNextPage: boolean;
  refetch: () => void;
  fetchNextPage: () => void;
};

export function useTutorSearch(params: TutorSearchParams): UseTutorSearchResult {
  const limit = params.limit ?? DEFAULT_PAGE_SIZE;

  const query = useInfiniteQuery({
    queryKey: tutorKeys.search({ ...params, limit }),
    queryFn: ({ pageParam }) => searchTutors({ ...params, limit, page: pageParam }),
    initialPageParam: 1,
    getNextPageParam: (lastPage) => (lastPage.meta.hasNext ? lastPage.meta.page + 1 : undefined),
  });

  const tutors = useMemo(() => query.data?.pages.flatMap((page) => page.data) ?? [], [query.data]);
  const total = query.data?.pages[0]?.meta.total ?? 0;

  return {
    tutors,
    total,
    isLoading: query.isLoading,
    isError: query.isError,
    isRefetching: query.isRefetching,
    isFetchingNextPage: query.isFetchingNextPage,
    hasNextPage: query.hasNextPage,
    refetch: () => void query.refetch(),
    fetchNextPage: () => void query.fetchNextPage(),
  };
}
