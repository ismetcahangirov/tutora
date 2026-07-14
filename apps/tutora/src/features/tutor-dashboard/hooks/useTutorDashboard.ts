/**
 * useTutorDashboard — the data behind the tutor's home screen (tutor epic #51, #52).
 *
 * The dashboard is a *view* over data other features already own, so it composes
 * their hooks rather than adding endpoints: the profile (views, rating,
 * verification, publication) from `tutor-profile`, and the count of pending
 * applications from `tutor-applications`. The profile is the essential resource —
 * its error drives the screen's error state — while a failed application count
 * degrades gracefully to zero rather than blocking the whole dashboard.
 */
import { useMyTutorProfile } from '@features/tutor-profile';
import type { MyTutorProfile } from '@features/tutor-profile';
import { useTutorApplications } from '@features/tutor-applications';

export type UseTutorDashboardResult = {
  profile: MyTutorProfile | undefined;
  pendingApplications: number;
  isLoading: boolean;
  isError: boolean;
  isRefetching: boolean;
  refetch: () => void;
};

export function useTutorDashboard(): UseTutorDashboardResult {
  const { profile, isLoading, isError, isRefetching, refetch } = useMyTutorProfile();
  const pending = useTutorApplications('PENDING');

  return {
    profile,
    pendingApplications: pending.total,
    isLoading,
    isError,
    isRefetching: isRefetching || pending.isRefetching,
    refetch: () => {
      refetch();
      pending.refetch();
    },
  };
}
