/**
 * useMyTutorProfile — the caller's own tutor profile (tutor epic #51, #53).
 *
 * A single per-user resource, so one query serves the whole tutor surface: the
 * dashboard reads its stats, the Profile tab edits it, and every mutation writes
 * the fresh copy straight back to this key. Exposes a typed, named-field API.
 */
import { useQuery } from '@tanstack/react-query';

import { getMyTutorProfile } from '../api/tutor-profile.api';
import { tutorProfileKeys } from '../constants';
import type { MyTutorProfile } from '../types';

export type UseMyTutorProfileResult = {
  profile: MyTutorProfile | undefined;
  isLoading: boolean;
  isError: boolean;
  isRefetching: boolean;
  refetch: () => void;
};

export function useMyTutorProfile(): UseMyTutorProfileResult {
  const query = useQuery({
    queryKey: tutorProfileKeys.me(),
    queryFn: getMyTutorProfile,
  });

  return {
    profile: query.data,
    isLoading: query.isLoading,
    isError: query.isError,
    isRefetching: query.isRefetching,
    refetch: () => void query.refetch(),
  };
}
