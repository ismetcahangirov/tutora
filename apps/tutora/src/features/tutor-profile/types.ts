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

export type {
  LessonFormat,
  VerificationStatus,
  CertificateStatus,
  TutorCertificate,
} from '@features/tutors';

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

/** What a signed upload is for. Mirrors the backend `MediaPurpose` (#37). */
export type MediaPurpose = 'AVATAR' | 'CERTIFICATE';

/** Body of `POST /api/v1/media/uploads` — declare what will be uploaded (#37). */
export type CreateUploadInput = {
  purpose: MediaPurpose;
  contentType: string;
};

/**
 * A signed upload ticket from `POST /api/v1/media/uploads` (#37). The client PUTs
 * the raw bytes to `uploadUrl` sending exactly `headers`, then submits `fileUrl` to
 * the certificate endpoint. `expiresAt` is an ISO string over the wire.
 */
export type UploadTicket = {
  uploadUrl: string;
  method: 'PUT';
  headers: Record<string, string>;
  objectKey: string;
  fileUrl: string;
  maxBytes: number;
  expiresAt: string;
};

/** Body of `POST /api/v1/tutors/me/certificates` — register an uploaded file (#54). */
export type CreateCertificateInput = {
  title: string;
  fileUrl: string;
  issuedBy?: string;
};

/** A local file the tutor picked to upload as a certificate (#54). */
export type PickedCertificate = {
  /** `file://` (or `content://`) URI of the local file. */
  uri: string;
  /** Original file name, shown back to the tutor before upload. */
  name: string;
  /** MIME type — used both to validate on-device and to sign the upload URL. */
  contentType: string;
  /** Size in bytes when the picker reports it; used to reject oversized files. */
  size: number | null;
};
