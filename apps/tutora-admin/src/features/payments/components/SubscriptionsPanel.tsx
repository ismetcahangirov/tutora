import type { ColumnDef } from '@tanstack/react-table';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useSearchParams } from 'react-router';

import { DataTable, ErrorView, TablePagination } from '@shared/components';
import { Card, Separator, Skeleton } from '@shared/ui';
import { formatDate } from '@shared/utils/formatDate';

import { BILLING_PAGE_SIZE } from '../constants';
import { useSubscriptionsQuery } from '../hooks/useBilling';
import {
  SUBSCRIPTION_STATUSES,
  type AdminSubscription,
  type ListSubscriptionsParams,
  type SubscriptionStatus,
} from '../types';
import { BillingFilters } from './BillingFilters';
import { PlanTierBadge } from './PlanTierBadge';
import { SubscriptionStatusBadge } from './SubscriptionStatusBadge';

function TableSkeleton() {
  return (
    <div className="space-y-4 p-4">
      {Array.from({ length: 6 }).map((_, index) => (
        <div key={index} className="flex items-center gap-3">
          <div className="flex-1 space-y-2">
            <Skeleton className="h-3 w-48" />
            <Skeleton className="h-3 w-32" />
          </div>
          <Skeleton className="h-5 w-20" />
        </div>
      ))}
    </div>
  );
}

/** Subscriptions oversight (#68): who is subscribed, on which plan, and its state. */
export function SubscriptionsPanel() {
  const { t, i18n } = useTranslation();
  const [searchParams] = useSearchParams();

  const [status, setStatus] = useState<SubscriptionStatus | undefined>(() =>
    SUBSCRIPTION_STATUSES.find((s) => s === searchParams.get('status')),
  );
  const [userId, setUserId] = useState<string | undefined>(
    () => searchParams.get('userId') ?? undefined,
  );
  const [page, setPage] = useState(1);

  const params: ListSubscriptionsParams = { page, limit: BILLING_PAGE_SIZE, status, userId };
  const { data, isLoading, isError, isFetching, refetch } = useSubscriptionsQuery(params);

  const handleStatus = (next: SubscriptionStatus | undefined) => {
    setStatus(next);
    setPage(1);
  };
  const handleClearUser = () => {
    setUserId(undefined);
    setPage(1);
  };

  const columns = useMemo<ColumnDef<AdminSubscription>[]>(
    () => [
      {
        id: 'subscriber',
        header: t('payments.subscriptionsColumns.subscriber'),
        cell: ({ row }) => (
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-foreground">
              {row.original.userName ?? row.original.userEmail}
            </p>
            <p className="truncate text-xs text-muted-foreground">{row.original.userEmail}</p>
          </div>
        ),
      },
      {
        id: 'plan',
        header: t('payments.subscriptionsColumns.plan'),
        cell: ({ row }) => (
          <div className="flex items-center gap-2">
            <PlanTierBadge tier={row.original.tier} />
            <span className="truncate text-sm text-foreground">{row.original.planName}</span>
          </div>
        ),
      },
      {
        id: 'status',
        header: t('payments.subscriptionsColumns.status'),
        cell: ({ row }) => <SubscriptionStatusBadge status={row.original.status} />,
      },
      {
        id: 'period',
        header: t('payments.subscriptionsColumns.period'),
        cell: ({ row }) => (
          <span className="whitespace-nowrap text-sm text-muted-foreground">
            {formatDate(row.original.currentPeriodStart, i18n.language)} –{' '}
            {formatDate(row.original.currentPeriodEnd, i18n.language)}
          </span>
        ),
      },
      {
        id: 'created',
        header: t('payments.subscriptionsColumns.created'),
        cell: ({ row }) => (
          <span className="whitespace-nowrap text-sm text-muted-foreground">
            {formatDate(row.original.createdAt, i18n.language)}
          </span>
        ),
      },
    ],
    [t, i18n.language],
  );

  return (
    <div className="space-y-4">
      <BillingFilters
        statuses={SUBSCRIPTION_STATUSES}
        status={status}
        onStatusChange={handleStatus}
        getStatusLabel={(s) => t(`payments.subscriptionStatus.${s}`)}
        statusFilterLabel={t('payments.filters.status')}
        allStatusesLabel={t('payments.filters.allStatuses')}
        userId={userId}
        onClearUser={handleClearUser}
      />

      <Card className="overflow-hidden">
        {isError ? (
          <ErrorView onRetry={() => void refetch()} />
        ) : isLoading ? (
          <TableSkeleton />
        ) : (
          <>
            <DataTable
              columns={columns}
              data={data?.data ?? []}
              getRowId={(subscription) => subscription.id}
              emptyLabel={t('payments.subscriptionsEmpty')}
            />
            {data ? (
              <>
                <Separator />
                <TablePagination
                  page={data.meta.page}
                  totalPages={data.meta.totalPages}
                  total={data.meta.total}
                  onPageChange={setPage}
                  disabled={isFetching}
                />
              </>
            ) : null}
          </>
        )}
      </Card>
    </div>
  );
}
