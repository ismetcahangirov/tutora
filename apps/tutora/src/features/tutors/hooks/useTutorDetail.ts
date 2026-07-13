/**
 * useTutorDetail — a single tutor's full public profile (student epic #40, #44).
 *
 * `enabled` guards against an empty id (e.g. a route param that has not resolved
 * yet). A missing profile surfaces as `TutorNotFoundError`, which the screen can
 * distinguish from a transient network error to show a "not found" empty state.
 */
import { useQuery } from '@tanstack/react-query';

import { getTutorById } from '../api/tutors.api';
import { tutorKeys } from '../constants';

export function useTutorDetail(id: string) {
  return useQuery({
    queryKey: tutorKeys.detail(id),
    queryFn: () => getTutorById(id),
    enabled: id.length > 0,
  });
}
