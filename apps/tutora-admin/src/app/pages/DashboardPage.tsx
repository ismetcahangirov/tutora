import { BarChart3 } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { EmptyState } from '@shared/components';
import { Card, CardContent, CardHeader, CardDescription, Skeleton } from '@shared/ui';

import { Page, PageHeader } from '../layout/Page';

/** KPI keys rendered as placeholder metric cards until analytics land (#61). */
const KPI_KEYS = ['students', 'tutors', 'sessions', 'revenue'] as const;

/** Landing page. Ships the shell's content area with loading + empty states. */
export function DashboardPage() {
  const { t } = useTranslation();

  return (
    <Page>
      <PageHeader title={t('nav.dashboard')} description={t('dashboard.subtitle')} />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {KPI_KEYS.map((key) => (
          <Card key={key}>
            <CardHeader className="pb-2">
              <CardDescription>{t(`dashboard.kpi.${key}`)}</CardDescription>
            </CardHeader>
            <CardContent>
              {/* Real values arrive with the analytics API (#61). */}
              <Skeleton className="h-8 w-24" />
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="mt-6">
        <CardContent className="p-0">
          <EmptyState
            icon={BarChart3}
            title={t('dashboard.empty.title')}
            description={t('dashboard.empty.description')}
          />
        </CardContent>
      </Card>
    </Page>
  );
}
