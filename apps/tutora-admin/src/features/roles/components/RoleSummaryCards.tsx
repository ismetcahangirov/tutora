import { useTranslation } from 'react-i18next';

import { USER_ROLES } from '@shared/rbac';
import { Badge, Card, CardContent, CardHeader, CardTitle, Skeleton } from '@shared/ui';

import { permissionCount } from '../permissions';
import { useRoleCountsQuery } from '../hooks/useRoleCounts';

/**
 * A card per role (issue #69): its member count (live, from the users listing),
 * the number of admin permissions it holds, and a short description. ADMIN is
 * the only role with panel access today; the others hold no admin permissions.
 */
export function RoleSummaryCards() {
  const { t } = useTranslation();
  const { data: counts, isLoading, isError } = useRoleCountsQuery();

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {USER_ROLES.map((role) => {
        const permissions = permissionCount(role);
        return (
          <Card key={role}>
            <CardHeader className="flex-row items-center justify-between gap-2 space-y-0">
              <CardTitle className="text-base">{t(`roles.${role}`)}</CardTitle>
              <Badge variant={permissions > 0 ? 'primary' : 'neutral'}>
                {t('rbac.summary.permissions', { value: permissions })}
              </Badge>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-muted-foreground">{t(`rbac.roleDescriptions.${role}`)}</p>
              <div className="flex items-baseline gap-1.5">
                {isLoading ? (
                  <Skeleton className="h-7 w-12" />
                ) : (
                  <span className="text-2xl font-semibold tracking-tight text-foreground">
                    {isError || !counts ? '—' : counts[role]}
                  </span>
                )}
                <span className="text-sm text-muted-foreground">{t('rbac.summary.members')}</span>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
