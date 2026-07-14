import { lazy, type ReactElement } from 'react';
import { createBrowserRouter, Outlet, type RouteObject } from 'react-router';

import { LoginScreen, LOGIN_PATH, ProtectedRoute, RequirePermission } from '@features/auth';

import { AppShell } from '../layout/AppShell';
import { NAV_ITEMS } from '../navigation/nav-config';
import { RootErrorPage } from '../pages/RootErrorPage';

// Route-level code splitting: pages load on demand behind the AppShell's
// Suspense boundary, keeping the initial bundle lean as sections grow.
const DashboardPage = lazy(() =>
  import('@features/dashboard').then((m) => ({ default: m.DashboardPage })),
);
const SectionPlaceholder = lazy(() =>
  import('../pages/SectionPlaceholder').then((m) => ({ default: m.SectionPlaceholder })),
);
const NotFoundPage = lazy(() =>
  import('../pages/NotFoundPage').then((m) => ({ default: m.NotFoundPage })),
);
const UsersPage = lazy(() => import('@features/users').then((m) => ({ default: m.UsersPage })));
const VerificationsPage = lazy(() =>
  import('@features/verifications').then((m) => ({ default: m.VerificationsPage })),
);
const ReviewsPage = lazy(() =>
  import('@features/reviews').then((m) => ({ default: m.ReviewsPage })),
);
const TaxonomyPage = lazy(() =>
  import('@features/taxonomy').then((m) => ({ default: m.TaxonomyPage })),
);
const NotificationsPage = lazy(() =>
  import('@features/notifications').then((m) => ({ default: m.NotificationsPage })),
);
const PaymentsPage = lazy(() =>
  import('@features/payments').then((m) => ({ default: m.PaymentsPage })),
);
const ContentPage = lazy(() => import('@features/cms').then((m) => ({ default: m.ContentPage })));
const RolesPage = lazy(() => import('@features/roles').then((m) => ({ default: m.RolesPage })));
const SettingsPage = lazy(() =>
  import('@features/settings').then((m) => ({ default: m.SettingsPage })),
);
const AuditLogsPage = lazy(() =>
  import('@features/audit-logs').then((m) => ({ default: m.AuditLogsPage })),
);

/**
 * Section pages that already exist. Everything else falls back to a placeholder,
 * so each epic #59 sub-issue only needs to register its page here.
 */
const SECTION_ELEMENTS: Record<string, ReactElement> = {
  dashboard: <DashboardPage />,
  users: <UsersPage />,
  verifications: <VerificationsPage />,
  reviews: <ReviewsPage />,
  taxonomy: <TaxonomyPage />,
  notifications: <NotificationsPage />,
  cms: <ContentPage />,
  payments: <PaymentsPage />,
  roles: <RolesPage />,
  settings: <SettingsPage />,
  logs: <AuditLogsPage />,
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
