/**
 * `/applications` — the tutor Applications tab (tutor epic #51, #57).
 *
 * Thin route wrapper around the applications feature's screen. The screen owns its
 * own filtering and inline actions, so the route holds no state. Guarded upstream
 * by the `(tutor)` layout.
 */
import { TutorApplicationsScreen } from '@features/tutor-applications';

export default function TutorApplicationsRoute() {
  return <TutorApplicationsScreen />;
}
