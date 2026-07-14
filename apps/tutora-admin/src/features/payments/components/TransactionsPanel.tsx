import type { ColumnDef } from '@tanstack/react-table';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useSearchParams } from 'react-router';

import { DataTable, ErrorView, TablePagination } from '@shared/components';
import { Button, Card, Separator, Skeleton } from '@shared/ui';
import { formatDate } from '@shared/utils/formatDate';
import { formatMoney } from '@shared/utils/formatMoney';

import { BILLING_PAGE_SIZE, nextPaymentStatuses } from '../constants';
import { usePaymentsQuery } from '../hooks/useBilling';
import {
  PAYMENT_STATUSES,
  type AdminPayment,
  type ListPaymentsParams,
  type PaymentStatus,
} from '../types';
import { BillingFilters } from './BillingFilters';
import { PaymentStatusBadge } from './PaymentStatusBadge';
import { PaymentStatusDialog } from './PaymentStatusDialog';

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

/** Transactions (#68): list payments, filter, and settle or refund each one. */
export function TransactionsPanel() {
  const { t, i18n } = useTranslation();
  const [searchParams] = useSearchParams();

  const [status, setStatus] = useState<PaymentStatus | undefined>(() =>
    PAYMENT_STATUSES.find((s) => s === searchParams.get('status')),
  );
  const [userId, setUserId] = useState<string | undefined>(
    () => searchParams.get('userId') ?? undefined,
  );
  const [page, setPage] = useState(1);
  const [reconcilePayment, setReconcilePayment] = useState<AdminPayment | null>(null);

  const params: ListPaymentsParams = { page, limit: BILLING_PAGE_SIZE, status, userId };
  const { data, isLoading, isError, isFetching, refetch } = usePaymentsQuery(params);

  const handleStatus = (next: PaymentStatus | undefined) => {
    setStatus(next);
    setPage(1);
  };
  const handleClearUser = () => {
    setUserId(undefined);
    setPage(1);
  };

  const columns = useMemo<ColumnDef<AdminPayment>[]>(
    () => [
      {
        id: 'payer',
        header: t('payments.transactionsColumns.payer'),
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
        id: 'amount',
        header: t('payments.transactionsColumns.amount'),
        cell: ({ row }) => (
          <span className="whitespace-nowrap text-sm font-medium text-foreground">
            {formatMoney(row.original.amount, row.original.currency, i18n.language)}
          </span>
        ),
      },
      {
        id: 'status',
        header: t('payments.transactionsColumns.status'),
        cell: ({ row }) => <PaymentStatusBadge status={row.original.status} />,
      },
      {
        id: 'provider',
        header: t('payments.transactionsColumns.provider'),
        cell: ({ row }) => (
          <div className="min-w-0">
            <p className="truncate text-sm text-foreground">{row.original.provider ?? '—'}</p>
            {row.original.providerRef ? (
              <p className="truncate text-xs text-muted-foreground">{row.original.providerRef}</p>
            ) : null}
          </div>
        ),
      },
      {
        id: 'created',
        header: t('payments.transactionsColumns.created'),
        cell: ({ row }) => (
          <span className="whitespace-nowrap text-sm text-muted-foreground">
            {formatDate(row.original.createdAt, i18n.language)}
          </span>
        ),
      },
      {
        id: 'actions',
        header: () => <span className="sr-only">{t('payments.transactionsColumns.actions')}</span>,
        cell: ({ row }) => {
          // Only offer the action when a legal transition exists; terminal
          // payments (FAILED / REFUNDED) have none.
          if (nextPaymentStatuses(row.original.status).length === 0) return null;
          return (
            <div className="flex justify-end">
              <Button
                size="sm"
                variant="secondary"
                onClick={() => setReconcilePayment(row.original)}
              >
                {t('payments.transactionsColumns.reconcile')}
              </Button>
            </div>
          );
        },
      },
    ],
    [t, i18n.language],
  );

  return (
    <div className="space-y-4">
      <BillingFilters
        statuses={PAYMENT_STATUSES}
        status={status}
        onStatusChange={handleStatus}
        getStatusLabel={(s) => t(`payments.paymentStatus.${s}`)}
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
              getRowId={(payment) => payment.id}
              emptyLabel={t('payments.transactionsEmpty')}
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

      {reconcilePayment ? (
        <PaymentStatusDialog
          key={reconcilePayment.id}
          payment={reconcilePayment}
          onOpenChange={(open) => !open && setReconcilePayment(null)}
        />
      ) : null}
    </div>
  );
}
