import type { LessonFormat, VerificationStatus } from '@prisma/client';

export interface TutorSearchSubject {
  subjectId: string;
  name: string;
  slug: string;
}

export interface TutorSearchDistrict {
  districtId: string;
  name: string;
  slug: string;
}

export interface TutorSearchLanguage {
  languageId: string;
  name: string;
  code: string;
}

/**
 * Slim discovery card returned by tutor search. Intentionally leaner than the
 * public profile detail (no certificates, no internal counters) — a results
 * grid only needs enough to render a card and let the user drill in.
 */
export interface TutorSearchItem {
  id: string;
  name: string | null;
  avatarUrl: string | null;
  bio: string | null;
  experienceYears: number;
  /** The tutor's HOURLY base rate, or null if they haven't set one. */
  hourlyRate: number | null;
  currency: string;
  formats: LessonFormat[];
  verificationStatus: VerificationStatus;
  ratingAvg: number;
  ratingCount: number;
  subjects: TutorSearchSubject[];
  districts: TutorSearchDistrict[];
  languages: TutorSearchLanguage[];
}
