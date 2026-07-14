// Public surface of the auth feature (issue #60).
export { useAuthStore } from './store/auth-store';
export { useAuthUser, useAuthStatus, useIsAuthenticated } from './hooks/useAuth';
export { usePermissions, type UsePermissions } from './hooks/usePermissions';
export { ProtectedRoute } from './guards/ProtectedRoute';
export { RequirePermission } from './guards/RequirePermission';
export { LoginScreen } from './components/LoginScreen';
export { LOGIN_PATH } from './constants';
export { AuthApiError } from './api/auth.api';
export type { AuthUser, AuthStatus, AuthResponse, AuthTokens } from './types';
