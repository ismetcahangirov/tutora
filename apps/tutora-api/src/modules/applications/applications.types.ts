import type { ApplicationStatus, LessonFormat } from '@prisma/client';

/** Minimal party projection (student or tutor) shown on an application. */
export interface ApplicationParty {
  id: string;
  name: string | null;
  avatarUrl: string | null;
}

/** Subject a student applied for, when one was specified. */
export interface ApplicationSubject {
  id: string;
  name: string;
  slug: string;
}

/**
 * Application projection returned to both parties. Contains the counterpart's
 * public identity — a student sees the tutor, a tutor sees the applicant.
 */
export interface ApplicationView {
  id: string;
  status: ApplicationStatus;
  message: string | null;
  format: LessonFormat | null;
  subject: ApplicationSubject | null;
  student: ApplicationParty;
  tutor: ApplicationParty;
  respondedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}
