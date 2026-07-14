import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { ErrorView, Page, PageHeader, TablePagination } from '@shared/components';
import { useDebouncedValue } from '@shared/hooks/useDebouncedValue';
import { Card, Separator, Skeleton } from '@shared/ui';

import { AuditLogDetailDialog } from '../components/AuditLogDetailDialog';
import { AuditLogsFilters } from '../components/AuditLogsFilters';
import { AuditLogsTable } from '../components/AuditLogsTable';
import { AUDIT_LOGS_PAGE_SIZE } from '../constants';
import { useAuditLogsQuery } from '../hooks/useAuditLogs';
import type { AuditCategory, AuditLog, ListAuditLogsParams } from '../types';

function TableSkeleton() {
  return (
    <div className="space-y-4 p-4">
      {Array.from({ length: 6 }).map((_, index) => (
        <div key={index} className="flex items-center gap-3">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-4 w-40" />
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-4 w-48" />
        </div>
      ))}
    </div>
  );
}

/**
 * Audit / security logs (#71): a read-only, paginated view of privileged and
 * security-relevant actions, filterable by category and free text. Changing a
 * filter resets to the first page; a row opens the full entry with its metadata.
 */
export function AuditLogsPage() {
  const { t } = useTranslation();

  const [search, setSearch] = useState('');
  const [category, setCategory] = useState<AuditCategory | undefined>(undefined);
  const [page, setPage] = useState(1);
  const [detailLog, setDetailLog] = useState<AuditLog | null>(null);

  const debouncedSearch = useDebouncedValue(search.trim(), 300);

  const params: ListAuditLogsParams = {
    page,
    limit: AUDIT_LOGS_PAGE_SIZE,
    category,
    q: debouncedSearch || undefined,
  };
  const { data, isLoading, isError, isFetching, refetch } = useAuditLogsQuery(params);

  const handleClear = () => {
    setSearch('');
    setCategory(undefined);
    setPage(1);
  };

  return (
    <Page>
      <PageHeader title={t('logs.title')} description={t('logs.subtitle')} />

      <div className="space-y-4">
        <AuditLogsFilters
          search={search}
          onSearchChange={(value) => {
            setSearch(value);
            setPage(1);
          }}
          category={category}
          onCategoryChange={(next) => {
            setCategory(next);
            setPage(1);
          }}
          onClear={handleClear}
        />

        <Card className="overflow-hidden">
          {isError ? (
            <ErrorView onRetry={() => void refetch()} />
          ) : isLoading ? (
            <TableSkeleton />
          ) : (
            <>
              <AuditLogsTable
                logs={data?.data ?? []}
                emptyLabel={t('logs.empty.title')}
                onView={setDetailLog}
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

      {detailLog ? (
        <AuditLogDetailDialog
          key={detailLog.id}
          log={detailLog}
          onOpenChange={(open) => !open && setDetailLog(null)}
        />
      ) : null}
    </Page>
  );
}
