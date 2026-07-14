import type { CertificateStatus, LessonFormat, VerificationStatus, Weekday } from '@prisma/client';

/** A recurring weekly availability window (minutes from local midnight). */
export interface AvailabilitySlotView {
  id: string;
  weekday: Weekday;
  startMinute: number;
  endMinute: number;
}

export interface TutorSubjectView {
  subjectId: string;
  name: string;
  slug: string;
  priceOverride: number | null;
}

export interface TutorDistrictView {
  districtId: string;
  name: string;
  slug: string;
}

export interface TutorLanguageView {
  languageId: string;
  name: string;
  code: string;
}

export interface CertificateView {
  id: string;
  title: string;
  fileUrl: string;
  status: CertificateStatus;
  /** Why the certificate was rejected; null once approved or still pending. */
  reviewReason: string | null;
  issuedBy: string | null;
  reviewedAt: Date | null;
  createdAt: Date;
}

/** Full own-profile projection returned to the owning tutor and to admins. */
export interface TutorProfileView {
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
  /** Why verification was rejected; null once verified. Shown to the tutor. */
  verificationReason: string | null;
  ratingAvg: number;
  ratingCount: number;
  profileViews: number;
  isPublished: boolean;
  subjects: TutorSubjectView[];
  districts: TutorDistrictView[];
  languages: TutorLanguageView[];
  certificates: CertificateView[];
  createdAt: Date;
  updatedAt: Date;
}

/** Public detail projection. Excludes internal counters and unverified certs. */
export interface PublicTutorView {
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
  subjects: TutorSubjectView[];
  districts: TutorDistrictView[];
  languages: TutorLanguageView[];
  certificates: CertificateView[];
}

/** Admin full view: the owner projection plus account-level fields. */
export interface AdminTutorView extends TutorProfileView {
  email: string;
  deletedAt: Date | null;
}

/** Slim row used in admin list responses (relations omitted for payload size). */
export interface AdminTutorListItem {
  id: string;
  userId: string;
  name: string | null;
  email: string;
  avatarUrl: string | null;
  hourlyRate: number;
  currency: string;
  verificationStatus: VerificationStatus;
  isPublished: boolean;
  ratingAvg: number;
  ratingCount: number;
  deletedAt: Date | null;
  createdAt: Date;
}
