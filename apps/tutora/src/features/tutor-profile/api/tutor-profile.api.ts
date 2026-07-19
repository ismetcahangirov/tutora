/**
 * tutor-profile API — read + edit the caller's own tutor profile (tutor epic
 * #51, #53, #56; backend #29/#31).
 *
 * Every call is authenticated and goes through the shared client, so auth +
 * transparent refresh are handled in one place. The mutating collection endpoints
 * (subjects/districts/languages) and the verification submit all return the *full*
 * refreshed profile, so callers can write the result straight into the cache with
 * no follow-up read.
 */
import { apiClient } from '@/shared/lib';

import { TUTOR_PROFILE_ENDPOINTS } from '../constants';
import type { MyTutorProfile, UpdateTutorProfileInput, UpsertTutorSubjectInput } from '../types';

/**
 * Backfills pricing-tier arrays a not-yet-upgraded API can omit. The client
 * ships over OTA (near-instant) while the API deploys separately (#178), so
 * there is a real window where the server response predates these fields —
 * default to "no tiers set" rather than crashing the profile screen.
 */
function normalizeProfile(profile: MyTutorProfile): MyTutorProfile {
  return {
    ...profile,
    pricingTiers: profile.pricingTiers ?? [],
    subjects: profile.subjects.map((subject) => ({
      ...subject,
      pricingTiers: subject.pricingTiers ?? [],
    })),
  };
}

/** GET the caller's own tutor profile. */
export async function getMyTutorProfile(): Promise<MyTutorProfile> {
  const { data } = await apiClient.get<MyTutorProfile>(TUTOR_PROFILE_ENDPOINTS.me);
  return normalizeProfile(data);
}

/** PATCH editable profile fields and return the updated profile. */
export async function updateMyTutorProfile(
  input: UpdateTutorProfileInput,
): Promise<MyTutorProfile> {
  const { data } = await apiClient.patch<MyTutorProfile>(TUTOR_PROFILE_ENDPOINTS.me, input);
  return normalizeProfile(data);
}

/** PUT a subject (add it, or change its price override) and return the profile (#56). */
export async function upsertTutorSubject(input: UpsertTutorSubjectInput): Promise<MyTutorProfile> {
  const { data } = await apiClient.put<MyTutorProfile>(TUTOR_PROFILE_ENDPOINTS.subjects, input);
  return normalizeProfile(data);
}

/** DELETE a subject from the profile and return the updated profile. */
export async function removeTutorSubject(subjectId: string): Promise<MyTutorProfile> {
  const { data } = await apiClient.delete<MyTutorProfile>(
    TUTOR_PROFILE_ENDPOINTS.subjectById(subjectId),
  );
  return normalizeProfile(data);
}

/** PUT a service district and return the updated profile. */
export async function addTutorDistrict(districtId: string): Promise<MyTutorProfile> {
  const { data } = await apiClient.put<MyTutorProfile>(TUTOR_PROFILE_ENDPOINTS.districts, {
    districtId,
  });
  return normalizeProfile(data);
}

/** DELETE a service district and return the updated profile. */
export async function removeTutorDistrict(districtId: string): Promise<MyTutorProfile> {
  const { data } = await apiClient.delete<MyTutorProfile>(
    TUTOR_PROFILE_ENDPOINTS.districtById(districtId),
  );
  return normalizeProfile(data);
}

/** PUT a spoken language and return the updated profile. */
export async function addTutorLanguage(languageId: string): Promise<MyTutorProfile> {
  const { data } = await apiClient.put<MyTutorProfile>(TUTOR_PROFILE_ENDPOINTS.languages, {
    languageId,
  });
  return normalizeProfile(data);
}

/** DELETE a spoken language and return the updated profile. */
export async function removeTutorLanguage(languageId: string): Promise<MyTutorProfile> {
  const { data } = await apiClient.delete<MyTutorProfile>(
    TUTOR_PROFILE_ENDPOINTS.languageById(languageId),
  );
  return normalizeProfile(data);
}

/**
 * POST to submit the profile for admin verification. Moves the status to `PENDING`
 * and returns the updated profile. Idempotent-ish server-side: only valid from an
 * `UNVERIFIED`/`REJECTED` state.
 */
export async function submitTutorVerification(): Promise<MyTutorProfile> {
  const { data } = await apiClient.post<MyTutorProfile>(TUTOR_PROFILE_ENDPOINTS.verification);
  return normalizeProfile(data);
}
