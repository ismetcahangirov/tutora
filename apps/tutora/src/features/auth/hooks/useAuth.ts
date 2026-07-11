/**
 * useAuth — read auth state + actions from context (issue #22).
 *
 * Throws when used outside `AuthProvider` so misuse fails fast at the call site
 * (and consumers never handle a `null` context).
 */
import { useContext } from 'react';

import { AuthContext } from '../context/auth-context';
import type { AuthContextValue } from '../types';

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (context === null) {
    throw new Error('useAuth must be used within an <AuthProvider>.');
  }
  return context;
}
