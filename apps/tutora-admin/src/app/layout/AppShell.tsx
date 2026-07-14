import { Suspense } from 'react';
import { Outlet } from 'react-router';

import { PageLoader } from '@shared/components';

import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';

/**
 * Authenticated layout: persistent sidebar + topbar wrapping the routed content.
 * Lazy section pages stream in behind a `Suspense` loader.
 */
export function AppShell() {
  return (
    <div className="flex min-h-svh bg-background text-foreground">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar />
        <main className="flex flex-1 flex-col">
          <Suspense fallback={<PageLoader />}>
            <Outlet />
          </Suspense>
        </main>
      </div>
    </div>
  );
}
