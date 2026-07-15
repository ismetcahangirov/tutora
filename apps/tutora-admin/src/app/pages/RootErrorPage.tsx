import { useEffect } from 'react';
import { useRouteError } from 'react-router';

import { ErrorView } from '@shared/components';
import { reportError } from '@shared/observability/sentry';

/**
 * Router `errorElement` — a full-page fallback for uncaught render/loader errors
 * (e.g. a failed lazy import). Reloading is the safest recovery for an SPA.
 * The error is forwarded to Sentry (#92) once, when the boundary catches it.
 */
export function RootErrorPage() {
  const error = useRouteError();

  useEffect(() => {
    reportError(error);
  }, [error]);

  return (
    <div className="flex min-h-svh flex-col bg-background text-foreground">
      <ErrorView onRetry={() => window.location.reload()} />
    </div>
  );
}
