/**
 * Auth feature — constants & user-facing copy (issue #22).
 *
 * There is no i18n system in the app yet, so screen copy lives here as a single
 * source of truth (dot-namespaced keys mirror the future i18n layout). Swapping
 * this object for a translation lookup later is a one-line change.
 */

/** Secure Store keys for the token pair. No magic strings elsewhere. */
export const AUTH_STORAGE_KEYS = {
  accessToken: 'tutora.auth.accessToken',
  refreshToken: 'tutora.auth.refreshToken',
} as const;

/** Backend auth endpoint, appended to `EXPO_PUBLIC_API_URL`. */
export const AUTH_GOOGLE_ENDPOINT = '/api/v1/auth/google';

/** Current-user profile endpoint, used to restore a session at launch. */
export const AUTH_ME_ENDPOINT = '/api/v1/users/me';

/** Screen + error copy (i18n-ready placeholders). */
export const AUTH_COPY = {
  screen: {
    title: 'Welcome to Tutora',
    subtitle: 'Find the right tutor by budget, district, and subject in minutes.',
    continueWithGoogle: 'Continue with Google',
    signingIn: 'Signing you in…',
    legal: 'By continuing you agree to our Terms and Privacy Policy.',
  },
  error: {
    title: 'Sign-in failed',
    /** Shown when the user closes the Google sheet without finishing. */
    cancelled: 'Sign-in was cancelled. Please try again.',
    /** Network / backend failure. */
    generic: 'We could not sign you in. Please check your connection and try again.',
    retry: 'Try again',
  },
} as const;
