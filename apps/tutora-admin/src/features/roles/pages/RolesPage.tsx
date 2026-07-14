import { Info } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { Page, PageHeader } from '@shared/components';
import { Card, CardContent, CardHeader, CardTitle } from '@shared/ui';

import { PermissionMatrix } from '../components/PermissionMatrix';
import { RoleSummaryCards } from '../components/RoleSummaryCards';

/**
 * Roles & permissions (#69): surfaces the client RBAC model — which capabilities
 * each role holds — alongside live per-role member counts. The panel authorizes
 * on permissions (not the raw role), so when the backend gains fine-grained,
 * per-account permissions this view becomes their management surface. Assigning
 * a member's role today lives in the Users section.
 */
export function RolesPage() {
  const { t } = useTranslation();

  return (
    <Page>
      <PageHeader title={t('rbac.title')} description={t('rbac.subtitle')} />

      <div className="space-y-6">
        <div className="flex items-start gap-2 rounded-lg border border-border bg-muted/40 px-4 py-3 text-sm text-muted-foreground">
          <Info className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
          <p>{t('rbac.assignmentHint')}</p>
        </div>

        <RoleSummaryCards />

        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t('rbac.matrix.title')}</CardTitle>
          </CardHeader>
          <CardContent>
            <PermissionMatrix />
          </CardContent>
        </Card>
      </div>
    </Page>
  );
}
