/**
 * Selector hooks over the auth store. Components subscribe to the narrowest
 * slice they need so an unrelated state change never re-renders them.
 */
import { useAuthStore } from '../store/auth-store';
import type { AuthStatus, AuthUser } from '../types';

export function useAuthUser(): AuthUser | null {
  return useAuthStore((state) => state.user);
}

export function useAuthStatus(): AuthStatus {
  return useAuthStore((state) => state.status);
}

export function useIsAuthenticated(): boolean {
  return useAuthStore((state) => state.status === 'authenticated');
}
