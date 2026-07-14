/**
 * availability API — read and replace the caller's weekly availability (tutor epic
 * #51, #55; backend #55).
 *
 * Both calls go through the shared client so auth + transparent refresh are handled
 * in one place. `setAvailability` replaces the whole week and returns the freshly
 * saved slots (server-assigned ids), which the mutation writes straight back into
 * the query cache.
 */
import { apiClient } from '@/shared/lib';

import { AVAILABILITY_ENDPOINTS } from '../constants';
import type { AvailabilitySlot, SetAvailabilityInput } from '../types';

/** GET the caller's saved availability windows, ordered by the server. */
export async function getAvailability(): Promise<AvailabilitySlot[]> {
  const { data } = await apiClient.get<AvailabilitySlot[]>(AVAILABILITY_ENDPOINTS.availability);
  return data;
}

/** PUT the full weekly availability, replacing whatever was there. */
export async function setAvailability(input: SetAvailabilityInput): Promise<AvailabilitySlot[]> {
  const { data } = await apiClient.put<AvailabilitySlot[]>(
    AVAILABILITY_ENDPOINTS.availability,
    input,
  );
  return data;
}
