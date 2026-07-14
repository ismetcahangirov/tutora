/**
 * useTutorApplications — the tutor's incoming applications for a status filter
 * (tutor epic #51, #57).
 *
 * The first page is enough for a triage inbox; a status filter (or "all") keys
 * the query so each tab caches independently. Exposes a typed, named-field API
 * with the total so the screen can show a count and its empty state.
 */
import { useQuery } from '@tanstack/react-query';

import { listTutorApplications } from '../api/applications.api';
import { APPLICATIONS_PAGE_SIZE, applicationKeys } from '../constants';
import type { ApplicationStatus, TutorApplication } from '../types';

export type UseTutorApplicationsResult = {
  applications: TutorApplication[];
  total: number;
  isLoading: boolean;
  isError: boolean;
  isRefetching: boolean;
  refetch: () => void;
};

export function useTutorApplications(status?: ApplicationStatus): UseTutorApplicationsResult {
  const query = useQuery({
    queryKey: applicationKeys.list(status),
    queryFn: () => listTutorApplications(status, 1, APPLICATIONS_PAGE_SIZE),
  });

  return {
    applications: query.data?.data ?? [],
    total: query.data?.meta.total ?? 0,
    isLoading: query.isLoading,
    isError: query.isError,
    isRefetching: query.isRefetching,
    refetch: () => void query.refetch(),
  };
}
