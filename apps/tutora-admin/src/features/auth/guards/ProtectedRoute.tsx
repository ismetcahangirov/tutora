import { Navigate, Outlet, useLocation } from 'react-router';

import { PageLoader } from '@shared/components';

import { LOGIN_PATH } from '../constants';
import { useAuthStore } from '../store/auth-store';

/**
 * Gate for every authenticated route. While the session is being restored it
 * shows a splash; an unauthenticated visitor is sent to sign-in with the
 * attempted location preserved for a post-login redirect. Because the store
 * never authenticates a non-admin, "authenticated" already implies admin — the
 * app fails closed.
 */
export function ProtectedRoute() {
  const status = useAuthStore((state) => state.status);
  const location = useLocation();

  if (status === 'restoring') return <PageLoader fullScreen />;

  if (status !== 'authenticated') {
    return <Navigate to={LOGIN_PATH} replace state={{ from: location }} />;
  }

  return <Outlet />;
}
