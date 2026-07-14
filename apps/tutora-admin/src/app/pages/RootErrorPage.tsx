import { ErrorView } from '@shared/components';

/**
 * Router `errorElement` — a full-page fallback for uncaught render/loader errors
 * (e.g. a failed lazy import). Reloading is the safest recovery for an SPA.
 */
export function RootErrorPage() {
  return (
    <div className="flex min-h-svh flex-col bg-background text-foreground">
      <ErrorView onRetry={() => window.location.reload()} />
    </div>
  );
}
