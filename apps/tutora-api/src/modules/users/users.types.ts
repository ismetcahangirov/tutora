/**
 * Normalized Google profile extracted from a verified idToken.
 * Produced by the auth GoogleVerifierService, consumed by UsersService.
 */
export interface GoogleProfile {
  googleId: string;
  email: string;
  emailVerified: boolean;
  name?: string;
  picture?: string;
  locale?: string;
}
