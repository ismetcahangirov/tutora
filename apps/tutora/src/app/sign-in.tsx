/**
 * `/sign-in` route (issue #22).
 *
 * Thin route wrapper that renders the auth feature's `SignInScreen`. Navigation
 * guards / redirect-after-login live in #23; for now this is a directly
 * reachable screen that coexists with the design-system showcase at `/`.
 */
import { SignInScreen } from '@features/auth';

export default function SignInRoute() {
  return <SignInScreen />;
}
