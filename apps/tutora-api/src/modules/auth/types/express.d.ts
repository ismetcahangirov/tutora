import type { AuthenticatedUser } from './auth.types';

/**
 * Augments Express so `request.user` — populated by `JwtAuthGuard` — is
 * strongly typed everywhere, avoiding `any` casts in guards and decorators.
 */
declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
    }
  }
}

export {};
