/**
 * useFeaturedTutors — top-rated tutors for the home screen (student epic #40, #42).
 *
 * There is no dedicated "featured" endpoint; the discovery surface previews the
 * highest-rated tutors by asking search for the first page sorted by rating. Kept
 * as its own hook (and cache key) so the home preview and the full search list do
 * not fight over the same cache entry.
 */
import { useQuery } from '@tanstack/react-query';

import { searchTutors } from '../api/tutors.api';
import { FEATURED_LIMIT, tutorKeys } from '../constants';
import type { TutorSummary } from '../types';

export type UseFeaturedTutorsResult = {
  tutors: TutorSummary[];
  isLoading: boolean;
  isError: boolean;
  isRefetching: boolean;
  refetch: () => void;
};

export function useFeaturedTutors(): UseFeaturedTutorsResult {
  const query = useQuery({
    queryKey: tutorKeys.featured(),
    queryFn: () => searchTutors({ sort: 'rating', page: 1, limit: FEATURED_LIMIT }),
  });

  return {
    tutors: query.data?.data ?? [],
    isLoading: query.isLoading,
    isError: query.isError,
    isRefetching: query.isRefetching,
    refetch: () => void query.refetch(),
  };
}
