/**
 * Tutor-dashboard feature — public barrel (tutor epic #51, #52).
 *
 * The tutor's home tab: a read-only overview composed from the profile and
 * applications features. Import the screen into the route file:
 *   `import { TutorDashboardScreen } from '@features/tutor-dashboard';`
 */
export {
  TutorDashboardScreen,
  type TutorDashboardScreenProps,
} from './screens/TutorDashboardScreen';

export { useTutorDashboard, type UseTutorDashboardResult } from './hooks/useTutorDashboard';
