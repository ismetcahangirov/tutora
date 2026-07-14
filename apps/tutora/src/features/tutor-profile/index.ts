/**
 * Tutor-profile feature — public barrel (tutor epic #51, #53, #56).
 *
 * The tutor's own profile surface: build, price, verify and publish. Import the
 * screen into the route file and the data hook into the dashboard:
 *   `import { TutorProfileScreen, useMyTutorProfile } from '@features/tutor-profile';`
 */
export { TutorProfileScreen, type TutorProfileScreenProps } from './screens/TutorProfileScreen';

export { useMyTutorProfile, type UseMyTutorProfileResult } from './hooks/useMyTutorProfile';

export { VerificationBadge, type VerificationBadgeProps } from './components/VerificationBadge';

export { getMyTutorProfile } from './api/tutor-profile.api';
export { tutorProfileKeys } from './constants';

export type {
  MyTutorProfile,
  TutorProfileSubject,
  TutorProfileDistrict,
  TutorProfileLanguage,
  UpdateTutorProfileInput,
  UpsertTutorSubjectInput,
  LessonFormat,
  VerificationStatus,
} from './types';
