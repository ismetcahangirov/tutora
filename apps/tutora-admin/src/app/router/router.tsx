import { lazy, type ReactElement } from 'react';
import { createBrowserRouter, Outlet, type RouteObject } from 'react-router';

import { LoginScreen, LOGIN_PATH, ProtectedRoute, RequirePermission } from '@features/auth';

import { AppShell } from '../layout/AppShell';
import { NAV_ITEMS } from '../navigation/nav-config';
import { RootErrorPage } from '../pages/RootErrorPage';

// Route-level code splitting: pages load on demand behind the AppShell's
// Suspense boundary, keeping the initial bundle lean as sections grow.
const DashboardPage = lazy(() =>
  import('../pages/DashboardPage').then((m) => ({ default: m.DashboardPage })),
);
const SectionPlaceholder = lazy(() =>
  import('../pages/SectionPlaceholder').then((m) => ({ default: m.SectionPlaceholder })),
);
const NotFoundPage = lazy(() =>
  import('../pages/NotFoundPage').then((m) => ({ default: m.NotFoundPage })),
);

/**
 * Section pages that already exist. Everything else falls back to a placeholder,
 * so each epic #59 sub-issue only needs to register its page here.
 */
const SECTION_ELEMENTS: Record<string, ReactElement> = {
  dashboard: <DashboardPage />,
};

/** One route per nav item, each gated by the section's permission. */
function buildSectionRoutes(): RouteObject[] {
  return NAV_ITEMS.map((item) => {
    const element = (
      <RequirePermission permission={item.permission}>
        {SECTION_ELEMENTS[item.id] ?? (
          <SectionPlaceholder titleKey={item.labelKey} icon={item.icon} />
        )}
      </RequirePermission>
    );
    return item.path === '/'
      ? { index: true, element }
      : { path: item.path.replace(/^\//, ''), element };
  });
}

const routes: RouteObject[] = [
  {
    // Root layout: a single errorElement covers both the public and protected
    // trees (e.g. a failed lazy import on any route).
    element: <Outlet />,
    errorElement: <RootErrorPage />,
    children: [
      { path: LOGIN_PATH, element: <LoginScreen /> },
      {
        element: <ProtectedRoute />,
        children: [
          {
            element: <AppShell />,
            children: [...buildSectionRoutes(), { path: '*', element: <NotFoundPage /> }],
          },
        ],
      },
    ],
  },
];

export const router = createBrowserRouter(routes);
