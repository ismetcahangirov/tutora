/**
 * Auth feature — public barrel (issue #22).
 *
 * Import auth from here: `import { AuthProvider, useAuth, SignInScreen } from '@features/auth';`
 * Nothing outside the feature should reach into its internals.
 */
export { AuthProvider } from './context/AuthProvider';
export { useAuth } from './hooks/useAuth';
export { useGoogleSignIn } from './hooks/useGoogleSignIn';
export type { UseGoogleSignIn } from './hooks/useGoogleSignIn';
export { SignInScreen } from './components/SignInScreen';

export type {
  AuthUser,
  AuthTokens,
  AuthResponse,
  AuthContextValue,
  GoogleCredential,
  GoogleAuthGateway,
  UserRole,
} from './types';
