/**
 * certificates API — upload proof of qualification and manage the caller's own
 * certificates (tutor epic #51, #54; backend #29/#37).
 *
 * Adding a certificate is two hops: first mint a signed upload ticket from the
 * media module and PUT the bytes straight to storage (see
 * `services/certificateFiles`), then register the resulting `fileUrl` here. New
 * certificates enter PENDING admin review. Unlike the profile-collection endpoints,
 * these return the *certificate* (or nothing), so the hook splices the result into
 * the cached `me` profile itself.
 */
import { apiClient } from '@/shared/lib';

import { MEDIA_ENDPOINTS, TUTOR_PROFILE_ENDPOINTS } from '../constants';
import type {
  CreateCertificateInput,
  CreateUploadInput,
  TutorCertificate,
  UploadTicket,
} from '../types';

/** POST a signed upload ticket for a certificate file (#37). */
export async function createUploadTicket(input: CreateUploadInput): Promise<UploadTicket> {
  const { data } = await apiClient.post<UploadTicket>(MEDIA_ENDPOINTS.uploads, input);
  return data;
}

/** POST an uploaded certificate (title + stored `fileUrl`); it enters PENDING review. */
export async function createCertificate(input: CreateCertificateInput): Promise<TutorCertificate> {
  const { data } = await apiClient.post<TutorCertificate>(
    TUTOR_PROFILE_ENDPOINTS.certificates,
    input,
  );
  return data;
}

/** DELETE a certificate the tutor no longer wants to show (204, no body). */
export async function deleteCertificate(certificateId: string): Promise<void> {
  await apiClient.delete(TUTOR_PROFILE_ENDPOINTS.certificateById(certificateId));
}
