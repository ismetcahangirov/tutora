/**
 * `/sign-in` route (issues #22, #41).
 *
 * A minimal, directly-reachable sign-in screen. The first-run flow enters
 * through `/welcome` (carousel + sign-in); this route stays available for
 * direct navigation and future re-authentication.
 */
import { SignInScreen } from '@features/auth';

export default function SignInRoute() {
  return <SignInScreen />;
}
