import type { LucideIcon } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { EmptyState, Page, PageHeader } from '@shared/components';
import { Card, CardContent } from '@shared/ui';

/**
 * Placeholder page for a section whose feature is not built yet. Each epic #59
 * sub-issue replaces its route element with a real page; the shell, routing, and
 * RBAC around it already work.
 */
export function SectionPlaceholder({ titleKey, icon }: { titleKey: string; icon: LucideIcon }) {
  const { t } = useTranslation();

  return (
    <Page>
      <PageHeader title={t(titleKey)} />
      <Card>
        <CardContent className="p-0">
          <EmptyState
            icon={icon}
            title={t('section.comingSoon.title')}
            description={t('section.comingSoon.description')}
          />
        </CardContent>
      </Card>
    </Page>
  );
}
