import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useSearchParams } from 'react-router';

import { ErrorView, Page, PageHeader, TablePagination } from '@shared/components';
import { useDebouncedValue } from '@shared/hooks/useDebouncedValue';
import { Card, Separator, Skeleton } from '@shared/ui';

import { TutorVerificationDialog } from '../components/TutorVerificationDialog';
import { VerificationQueueTable } from '../components/VerificationQueueTable';
import { VerificationsFilters } from '../components/VerificationsFilters';
import { VERIFICATIONS_PAGE_SIZE } from '../constants';
import { useTutorsQuery } from '../hooks/useTutors';
import { VERIFICATION_STATUSES, type ListTutorsParams, type VerificationStatus } from '../types';

/** Loading placeholder that mirrors the queue's row rhythm. */
function TableSkeleton() {
  return (
    <div className="space-y-4 p-4">
      {Array.from({ length: 6 }).map((_, index) => (
        <div key={index} className="flex items-center gap-3">
          <Skeleton className="size-9 rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-3 w-40" />
            <Skeleton className="h-3 w-24" />
          </div>
        </div>
      ))}
    </div>
  );
}

/** Verification requests review (#63): queue of tutors with approve/reject flow. */
export function VerificationsPage() {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();

  // Seed filters from the URL once (e.g. a deep link from the users page). A
  // deep-linked search shows all statuses so the target tutor appears whatever
  // its state; without one, default to the pending queue.
  const [search, setSearch] = useState(() => searchParams.get('q') ?? '');
  const [status, setStatus] = useState<VerificationStatus | undefined>(() => {
    const match = VERIFICATION_STATUSES.find((s) => s === searchParams.get('status'));
    if (match) return match;
    return searchParams.get('q') ? undefined : 'PENDING';
  });
  const [page, setPage] = useState(1);
  const debouncedSearch = useDebouncedValue(search.trim(), 300);

  const [reviewTutorId, setReviewTutorId] = useState<string | null>(null);

  const params: ListTutorsParams = {
    page,
    limit: VERIFICATIONS_PAGE_SIZE,
    verificationStatus: status,
    q: debouncedSearch || undefined,
  };
  const { data, isLoading, isError, isFetching, refetch } = useTutorsQuery(params);

  const handleSearch = (value: string) => {
    setSearch(value);
    setPage(1);
  };
  const handleStatus = (next: VerificationStatus | undefined) => {
    setStatus(next);
    setPage(1);
  };

  return (
    <Page>
      <PageHeader title={t('verifications.title')} description={t('verifications.subtitle')} />

      <div className="space-y-4">
        <VerificationsFilters
          search={search}
          onSearchChange={handleSearch}
          status={status}
          onStatusChange={handleStatus}
        />

        <Card className="overflow-hidden">
          {isError ? (
            <ErrorView onRetry={() => void refetch()} />
          ) : isLoading ? (
            <TableSkeleton />
          ) : (
            <>
              <VerificationQueueTable
                tutors={data?.data ?? []}
                emptyLabel={t('verifications.empty.title')}
                onReview={setReviewTutorId}
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

      {reviewTutorId ? (
        <TutorVerificationDialog
          key={reviewTutorId}
          tutorId={reviewTutorId}
          onOpenChange={(open) => !open && setReviewTutorId(null)}
        />
      ) : null}
    </Page>
  );
}
