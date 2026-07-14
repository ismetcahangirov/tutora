/**
 * useAvailability — the caller's saved weekly availability (#55).
 *
 * A single per-user resource read from `GET /tutors/me/availability`; the screen
 * groups the flat list by weekday for display. Exposes a typed, named-field API
 * with the list defaulting to empty until the fetch resolves.
 */
import { useQuery } from '@tanstack/react-query';

import { getAvailability } from '../api/availability.api';
import { availabilityKeys } from '../constants';
import type { AvailabilitySlot } from '../types';

export type UseAvailabilityResult = {
  slots: AvailabilitySlot[];
  isLoading: boolean;
  isError: boolean;
  isRefetching: boolean;
  refetch: () => void;
};

export function useAvailability(): UseAvailabilityResult {
  const query = useQuery({
    queryKey: availabilityKeys.list(),
    queryFn: getAvailability,
  });

  return {
    slots: query.data ?? [],
    isLoading: query.isLoading,
    isError: query.isError,
    isRefetching: query.isRefetching,
    refetch: () => void query.refetch(),
  };
}
