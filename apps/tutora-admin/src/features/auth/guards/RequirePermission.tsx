import type { ReactNode } from 'react';

import { ForbiddenView } from '@shared/components';
import type { Permission } from '@shared/rbac';

import { usePermissions } from '../hooks/usePermissions';

/**
 * Per-section authorization. Renders its children only when the signed-in admin
 * holds the required permission; otherwise it shows the 403 state in place, so
 * the shell and navigation stay put. This is the seam for fine-grained,
 * backend-driven permissions (issue #69).
 */
export function RequirePermission({
  permission,
  children,
}: {
  permission: Permission;
  children: ReactNode;
}) {
  const { can } = usePermissions();
  return can(permission) ? <>{children}</> : <ForbiddenView />;
}
