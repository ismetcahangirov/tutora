/**
 * Tutor-profile feature — API contract types (tutor epic #51, #53, #56; backend #29/#31).
 *
 * The tutor-facing counterpart to the student `tutors` feature: where that reads a
 * public profile, this reads and edits the caller's *own* profile via `/tutors/me`.
 * The lesson-format and verification enums are shared with the public feature, so
 * they are imported from its barrel rather than redefined; the editable collection
 * shapes (subjects with a price override, districts, languages) live here.
 */
import type { LessonFormat, TutorCertificate, VerificationStatus } from '@features/tutors';

export type { LessonFormat, VerificationStatus } from '@features/tutors';

/** A subject the tutor teaches, carrying an optional subject-specific price (#56). */
export type TutorProfileSubject = {
  subjectId: string;
  name: string;
  slug: string;
  /** Overrides the base `hourlyRate` for this subject when set. */
  priceOverride: number | null;
};

/** A district the tutor teaches in. */
export type TutorProfileDistrict = {
  districtId: string;
  name: string;
  slug: string;
};

/** A language the tutor teaches in. */
export type TutorProfileLanguage = {
  languageId: string;
  name: string;
  code: string;
};

/**
 * The caller's own tutor profile — `GET /api/v1/tutors/me`. Mirrors the public
 * `TutorProfile` plus the private counters (`profileViews`, `isPublished`) a tutor
 * is allowed to see about themselves.
 */
export type MyTutorProfile = {
  id: string;
  userId: string;
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
  profileViews: number;
  isPublished: boolean;
  subjects: TutorProfileSubject[];
  districts: TutorProfileDistrict[];
  languages: TutorProfileLanguage[];
  certificates: TutorCertificate[];
  createdAt: string;
  updatedAt: string;
};

/**
 * Body of `PATCH /api/v1/tutors/me`. Every field is optional; omitted keys are
 * left unchanged. `isPublished` is only honoured once the profile is `VERIFIED`
 * (enforced server-side and gated in the UI).
 */
export type UpdateTutorProfileInput = {
  bio?: string;
  experienceYears?: number;
  hourlyRate?: number;
  currency?: string;
  formats?: LessonFormat[];
  isPublished?: boolean;
};

/** Body of `PUT /api/v1/tutors/me/subjects` — add a subject or change its price (#56). */
export type UpsertTutorSubjectInput = {
  subjectId: string;
  /** Omit or send `undefined` to fall back to the base hourly rate. */
  priceOverride?: number;
};
