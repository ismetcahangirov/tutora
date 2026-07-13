/**
 * tutors API — search + detail via the shared client (student epic #40).
 *
 * Both endpoints are public. Search returns the standard paginated envelope;
 * detail returns a single profile or 404. Undefined filter keys are stripped so
 * the request URL only carries active filters (a clean, cache-friendly key).
 */
import { isAxiosError } from 'axios';

import { apiClient } from '@/shared/lib';

import { TUTOR_ENDPOINTS } from '../constants';
import type { Paginated, TutorProfile, TutorSearchParams, TutorSummary } from '../types';

/** Thrown when a tutor profile does not exist or is unpublished (404). */
export class TutorNotFoundError extends Error {
  constructor(readonly id: string) {
    super(`Tutor ${id} not found`);
    this.name = 'TutorNotFoundError';
  }
}

/** Drop `undefined`/empty values so only active filters hit the wire. */
function toQueryParams(params: TutorSearchParams): Record<string, string | number> {
  const query: Record<string, string | number> = {};
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== '') {
      query[key] = value as string | number;
    }
  }
  return query;
}

/** GET a page of tutor summaries matching the given filters. */
export async function searchTutors(params: TutorSearchParams): Promise<Paginated<TutorSummary>> {
  const { data } = await apiClient.get<Paginated<TutorSummary>>(TUTOR_ENDPOINTS.search, {
    params: toQueryParams(params),
  });
  return data;
}

/** GET a single tutor's full public profile. Throws `TutorNotFoundError` on 404. */
export async function getTutorById(id: string): Promise<TutorProfile> {
  try {
    const { data } = await apiClient.get<TutorProfile>(TUTOR_ENDPOINTS.byId(id));
    return data;
  } catch (error) {
    if (isAxiosError(error) && error.response?.status === 404) {
      throw new TutorNotFoundError(id);
    }
    throw error;
  }
}
