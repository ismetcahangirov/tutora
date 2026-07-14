/**
 * tutor-applications API — list + respond to incoming applications (tutor epic
 * #51, #57; backend #32).
 *
 * Read: one page of the tutor's incoming applications, optionally filtered by
 * status (standard paginated envelope). Write: accept / decline / complete, each
 * returning the updated application so the list can reconcile. All calls are
 * authenticated through the shared client.
 */
import { apiClient } from '@/shared/lib';
import type { Paginated } from '@/shared';

import { APPLICATIONS_PAGE_SIZE, APPLICATION_ENDPOINTS } from '../constants';
import type { ApplicationStatus, TutorApplication } from '../types';

/** GET one page of incoming applications, newest first, optionally by status. */
export async function listTutorApplications(
  status?: ApplicationStatus,
  page = 1,
  limit = APPLICATIONS_PAGE_SIZE,
): Promise<Paginated<TutorApplication>> {
  const { data } = await apiClient.get<Paginated<TutorApplication>>(APPLICATION_ENDPOINTS.root, {
    params: status ? { page, limit, status } : { page, limit },
  });
  return data;
}

/** POST to accept a pending application; returns the updated application. */
export async function acceptApplication(id: string): Promise<TutorApplication> {
  const { data } = await apiClient.post<TutorApplication>(APPLICATION_ENDPOINTS.accept(id));
  return data;
}

/** POST to decline a pending application; returns the updated application. */
export async function declineApplication(id: string): Promise<TutorApplication> {
  const { data } = await apiClient.post<TutorApplication>(APPLICATION_ENDPOINTS.decline(id));
  return data;
}

/** POST to mark an accepted application complete; returns the updated application. */
export async function completeApplication(id: string): Promise<TutorApplication> {
  const { data } = await apiClient.post<TutorApplication>(APPLICATION_ENDPOINTS.complete(id));
  return data;
}
