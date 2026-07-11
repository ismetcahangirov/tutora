/**
 * Auth feature — shared types (issue #22).
 *
 * The canonical shapes exchanged between the Google sign-in gateway, the auth
 * API, secure storage, and the auth context. Mirrors the backend contract of
 * `POST /api/v1/auth/google`.
 */

/** Roles issued by the backend. Kept in sync with the API's `UserRole` enum. */
export type UserRole = 'STUDENT' | 'TUTOR' | 'ADMIN';

/** The authenticated user as returned by the backend. */
export type AuthUser = {
  id: string;
  email: string;
  name: string;
  avatarUrl: string | null;
  role: UserRole;
  onboardingCompleted: boolean;
};

/** The JWT pair persisted in Secure Store. Never logged, never in plaintext. */
export type AuthTokens = {
  accessToken: string;
  refreshToken: string;
};

/** Full response body of `POST /api/v1/auth/google`. */
export type AuthResponse = AuthTokens & {
  user: AuthUser;
};

/** The single credential the native/JS Google flow hands back. */
export type GoogleCredential = {
  idToken: string;
};

/**
 * Thin boundary over the Google sign-in library. Implementations must never let
 * a native module leak into Jest — the gateway is mocked in unit tests.
 */
export type GoogleAuthGateway = {
  /** Opens Google sign-in and resolves with a fresh `idToken`. */
  signIn: () => Promise<GoogleCredential>;
  /** Best-effort local sign-out (revoke / clear cached session). */
  signOut: () => Promise<void>;
};

/** Public auth state + actions exposed by the auth context. */
export type AuthContextValue = {
  user: AuthUser | null;
  isAuthenticated: boolean;
  /** True while a sign-in request is in flight. */
  isSigningIn: boolean;
  /** Human-readable error from the last sign-in attempt, if any. */
  error: string | null;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
};
