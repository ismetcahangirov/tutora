/**
 * useGoogleSignIn — the Google sign-in surface for screens (issue #22).
 *
 * A focused view over the auth context that exposes exactly what a sign-in
 * screen needs: the in-flight flag, the last error, and the two actions. Backed
 * by `AuthProvider`, so the orchestration (gateway → api → secure store) is
 * shared and testable.
 */
import { useAuth } from './useAuth';

export type UseGoogleSignIn = {
  isSigningIn: boolean;
  error: string | null;
  isAuthenticated: boolean;
  user: ReturnType<typeof useAuth>['user'];
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
};

export function useGoogleSignIn(): UseGoogleSignIn {
  const { user, isAuthenticated, isSigningIn, error, signInWithGoogle, signOut } = useAuth();
  return { user, isAuthenticated, isSigningIn, error, signInWithGoogle, signOut };
}
