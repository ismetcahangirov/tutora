/**
 * Tutor-applications feature — API contract types (tutor epic #51, #57; backend #32).
 *
 * The tutor side of the application lifecycle: a student applies to a tutor, and
 * the tutor reviews the incoming request and accepts, declines, or (once the
 * lessons happen) completes it. These mirror the backend `ApplicationView`.
 */
import type { LessonFormat } from '@features/tutors';

export type { LessonFormat } from '@features/tutors';

/** The application lifecycle. Mirrors the backend `ApplicationStatus` enum. */
export type ApplicationStatus =
  'PENDING' | 'ACCEPTED' | 'DECLINED' | 'CANCELLED' | 'COMPLETED' | 'EXPIRED';

/** The student who applied — the minimal identity the tutor sees. */
export type ApplicationStudent = {
  id: string;
  name: string | null;
  avatarUrl: string | null;
};

/** The subject an application is about, when the student specified one. */
export type ApplicationSubject = {
  id: string;
  name: string;
  slug: string;
};

/** One incoming application as returned by `GET /api/v1/tutor/applications`. */
export type TutorApplication = {
  id: string;
  status: ApplicationStatus;
  message: string | null;
  format: LessonFormat | null;
  subject: ApplicationSubject | null;
  student: ApplicationStudent;
  respondedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

/** The action a tutor can take on a pending/accepted application. */
export type ApplicationAction = 'accept' | 'decline' | 'complete';
