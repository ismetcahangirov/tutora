import { BadgeCheck, CreditCard, GraduationCap, Star, Users, Wallet } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { ErrorView, Page, PageHeader } from '@shared/components';
import { Card, CardContent, Skeleton } from '@shared/ui';

import { KpiCard } from '../components/KpiCard';
import { SignupsChart } from '../components/SignupsChart';
import { TutorStatusChart } from '../components/TutorStatusChart';
import { useDashboardQuery } from '../hooks/useDashboard';

/** Skeleton mirroring the KPI grid + two chart cards while stats load. */
function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, index) => (
          <Card key={index}>
            <CardContent className="space-y-3 p-5">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-7 w-16" />
            </CardContent>
          </Card>
        ))}
      </div>
      <div className="grid gap-4 lg:grid-cols-3">
        <Skeleton className="h-80 lg:col-span-2" />
        <Skeleton className="h-80" />
      </div>
    </div>
  );
}

/** Admin dashboard (#61): headline KPIs, a signups trend, and a status breakdown. */
export function DashboardPage() {
  const { t, i18n } = useTranslation();
  const { data, isLoading, isError, refetch } = useDashboardQuery();

  const formatNumber = (value: number) => new Intl.NumberFormat(i18n.language).format(value);
  const formatMoney = (amount: number, currency: string) => {
    try {
      return new Intl.NumberFormat(i18n.language, { style: 'currency', currency }).format(amount);
    } catch {
      return `${formatNumber(amount)} ${currency}`;
    }
  };

  return (
    <Page>
      <PageHeader title={t('nav.dashboard')} description={t('dashboard.subtitle')} />

      {isError ? (
        <Card className="overflow-hidden">
          <ErrorView onRetry={() => void refetch()} />
        </Card>
      ) : isLoading || !data ? (
        <DashboardSkeleton />
      ) : (
        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <KpiCard
              label={t('dashboard.kpi.students')}
              value={formatNumber(data.kpis.students)}
              icon={Users}
            />
            <KpiCard
              label={t('dashboard.kpi.tutors')}
              value={formatNumber(data.kpis.tutors)}
              icon={GraduationCap}
            />
            <KpiCard
              label={t('dashboard.kpi.pendingVerifications')}
              value={formatNumber(data.kpis.pendingVerifications)}
              icon={BadgeCheck}
              emphasis={data.kpis.pendingVerifications > 0}
            />
            <KpiCard
              label={t('dashboard.kpi.activeSubscriptions')}
              value={formatNumber(data.kpis.activeSubscriptions)}
              icon={CreditCard}
            />
            <KpiCard
              label={t('dashboard.kpi.publishedReviews')}
              value={formatNumber(data.kpis.publishedReviews)}
              icon={Star}
            />
            <KpiCard
              label={t('dashboard.kpi.revenue')}
              value={formatMoney(data.kpis.monthlyRevenue, data.kpis.revenueCurrency)}
              icon={Wallet}
            />
          </div>

          <div className="grid gap-4 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <SignupsChart data={data.signups} />
            </div>
            <TutorStatusChart data={data.tutorsByStatus} />
          </div>
        </div>
      )}
    </Page>
  );
}
