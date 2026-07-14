/**
 * Tutor verification API (issue #63). Uses the shared Axios client; every
 * response is validated at the boundary with Zod.
 */
import { apiClient, paginatedSchema, type Paginated } from '@shared/lib';

import { ADMIN_TUTORS_ENDPOINT } from '../constants';
import {
  adminTutorListItemSchema,
  adminTutorSchema,
  certificateSchema,
  type AdminTutor,
  type AdminTutorListItem,
  type Certificate,
  type ListTutorsParams,
  type ReviewCertificateBody,
  type SetVerificationBody,
} from '../types';

const tutorsPageSchema = paginatedSchema(adminTutorListItemSchema);

/** List tutor profiles, filterable by verification status and free-text query. */
export async function listTutors(params: ListTutorsParams): Promise<Paginated<AdminTutorListItem>> {
  const { data } = await apiClient.get<unknown>(ADMIN_TUTORS_ENDPOINT, {
    params: {
      page: params.page,
      limit: params.limit,
      verificationStatus: params.verificationStatus,
      q: params.q || undefined,
    },
  });
  return tutorsPageSchema.parse(data);
}

/** Full tutor profile with certificates, for the review detail. */
export async function getTutor(id: string): Promise<AdminTutor> {
  const { data } = await apiClient.get<unknown>(`${ADMIN_TUTORS_ENDPOINT}/${id}`);
  return adminTutorSchema.parse(data);
}

/**
 * Record the account-level verification decision (verify / reject identity).
 * A rejection carries a reason; the API clears it on approval.
 */
export async function setVerification(id: string, body: SetVerificationBody): Promise<AdminTutor> {
  const { data } = await apiClient.patch<unknown>(
    `${ADMIN_TUTORS_ENDPOINT}/${id}/verification`,
    body,
  );
  return adminTutorSchema.parse(data);
}

/** Approve or reject a single certificate, with a reason on rejection. */
export async function reviewCertificate(
  tutorId: string,
  certificateId: string,
  body: ReviewCertificateBody,
): Promise<Certificate> {
  const { data } = await apiClient.patch<unknown>(
    `${ADMIN_TUTORS_ENDPOINT}/${tutorId}/certificates/${certificateId}`,
    body,
  );
  return certificateSchema.parse(data);
}
