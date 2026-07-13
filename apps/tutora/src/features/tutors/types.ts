/**
 * Tutors feature — API contract types (student epic #40, backend #29/#31).
 *
 * These mirror the backend's public DTOs so the typed service layer stays honest
 * against the real responses. Two views exist: a lightweight `TutorSummary`
 * returned by search/list endpoints, and the richer `TutorProfile` returned by
 * the detail endpoint (adds certificates and per-subject price overrides).
 */

// Re-export the shared pagination envelope so tutor consumers can import it from
// the feature barrel alongside the tutor types.
export type { Paginated, PaginationMeta } from '@/shared';

/** Where a lesson can take place. Mirrors the backend `LessonFormat` enum. */
export type LessonFormat = 'ONLINE' | 'AT_STUDENT_HOME' | 'AT_TUTOR_PLACE';

/** Tutor verification lifecycle. Only `VERIFIED` tutors surface in search. */
export type VerificationStatus = 'UNVERIFIED' | 'PENDING' | 'VERIFIED' | 'REJECTED';

/** Certificate moderation state. Public profiles expose `VERIFIED` only. */
export type CertificateStatus = 'PENDING' | 'VERIFIED' | 'REJECTED';

/** A subject on a tutor summary. */
export type TutorSubject = {
  subjectId: string;
  name: string;
  slug: string;
};

/** A subject on a full profile, carrying an optional subject-specific price. */
export type TutorProfileSubject = TutorSubject & {
  priceOverride: number | null;
};

/** A district a tutor teaches in. */
export type TutorDistrict = {
  districtId: string;
  name: string;
  slug: string;
};

/** A language a tutor teaches in. */
export type TutorLanguage = {
  languageId: string;
  name: string;
  code: string;
};

/** A verified certificate shown on a public profile. */
export type TutorCertificate = {
  id: string;
  title: string;
  fileUrl: string;
  status: CertificateStatus;
  issuedBy: string | null;
  reviewedAt: string | null;
  createdAt: string;
};

/** Fields shared by the search summary and the full profile. */
type TutorBase = {
  id: string;
  name: string | null;
  avatarUrl: string | null;
  bio: string | null;
  experienceYears: number;
  hourlyRate: number;
  currency: string;
  formats: LessonFormat[];
  verificationStatus: VerificationStatus;
  ratingAvg: number;
  ratingCount: number;
  districts: TutorDistrict[];
  languages: TutorLanguage[];
};

/** A tutor as returned by search / list endpoints. */
export type TutorSummary = TutorBase & {
  subjects: TutorSubject[];
};

/** A tutor as returned by `GET /api/v1/tutors/:id` — the full public profile. */
export type TutorProfile = TutorBase & {
  subjects: TutorProfileSubject[];
  certificates: TutorCertificate[];
};

/** Sort orders accepted by the search endpoint. */
export type TutorSort = 'rating' | 'price_asc' | 'price_desc' | 'newest';

/**
 * Filters + paging for a tutor search. All filters are optional; omitted keys are
 * simply not sent. `page`/`limit` drive the paginated envelope.
 */
export type TutorSearchParams = {
  q?: string;
  subjectId?: string;
  districtId?: string;
  languageId?: string;
  format?: LessonFormat;
  minPrice?: number;
  maxPrice?: number;
  minRating?: number;
  sort?: TutorSort;
  page?: number;
  limit?: number;
};
