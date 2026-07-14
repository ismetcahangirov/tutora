/**
 * Tutor-applications feature — public barrel (tutor epic #51, #57).
 *
 * The tutor's incoming-applications inbox. Import the screen into the route file
 * and the list hook into the dashboard for a pending count:
 *   `import { TutorApplicationsScreen, useTutorApplications } from '@features/tutor-applications';`
 */
export { TutorApplicationsScreen } from './screens/TutorApplicationsScreen';

export {
  useTutorApplications,
  type UseTutorApplicationsResult,
} from './hooks/useTutorApplications';
export {
  useApplicationActions,
  type UseApplicationActionsResult,
} from './hooks/useApplicationActions';

export { listTutorApplications } from './api/applications.api';
export { applicationKeys, APPLICATIONS_PAGE_SIZE } from './constants';

export type {
  TutorApplication,
  ApplicationStatus,
  ApplicationAction,
  ApplicationStudent,
  ApplicationSubject,
} from './types';
