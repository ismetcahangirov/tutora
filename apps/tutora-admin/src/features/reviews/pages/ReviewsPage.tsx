import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useSearchParams } from 'react-router';

import { ErrorView, Page, PageHeader, TablePagination } from '@shared/components';
import { Card, Separator, Skeleton } from '@shared/ui';

import { ReviewModerationDialog } from '../components/ReviewModerationDialog';
import { ReviewsFilters } from '../components/ReviewsFilters';
import { ReviewsTable } from '../components/ReviewsTable';
import { REVIEWS_PAGE_SIZE } from '../constants';
import { useReviewsQuery } from '../hooks/useReviews';
import {
  REVIEW_STATUSES,
  type AdminReview,
  type ListReviewsParams,
  type ReviewStatus,
} from '../types';

/** Loading placeholder that mirrors the table's row rhythm. */
function TableSkeleton() {
  return (
    <div className="space-y-4 p-4">
      {Array.from({ length: 6 }).map((_, index) => (
        <div key={index} className="flex items-center gap-3">
          <Skeleton className="size-9 rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-3 w-48" />
            <Skeleton className="h-3 w-32" />
          </div>
        </div>
      ))}
    </div>
  );
}

/** Reviews & reports moderation (#64): list reviews, filter, and set visibility. */
export function ReviewsPage() {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();

  // Seed filters from the URL once, so a deep link (e.g. "show this tutor's
  // reviews") lands pre-filtered.
  const [status, setStatus] = useState<ReviewStatus | undefined>(() =>
    REVIEW_STATUSES.find((s) => s === searchParams.get('status')),
  );
  const [tutorId, setTutorId] = useState<string | undefined>(
    () => searchParams.get('tutorId') ?? undefined,
  );
  const [page, setPage] = useState(1);

  const [moderateReview, setModerateReview] = useState<AdminReview | null>(null);

  const params: ListReviewsParams = {
    page,
    limit: REVIEWS_PAGE_SIZE,
    status,
    tutorId,
  };
  const { data, isLoading, isError, isFetching, refetch } = useReviewsQuery(params);

  // Any filter change resets to the first page so results stay coherent.
  const handleStatus = (next: ReviewStatus | undefined) => {
    setStatus(next);
    setPage(1);
  };
  const handleClearTutor = () => {
    setTutorId(undefined);
    setPage(1);
  };

  return (
    <Page>
      <PageHeader title={t('reviews.title')} description={t('reviews.subtitle')} />

      <div className="space-y-4">
        <ReviewsFilters
          status={status}
          onStatusChange={handleStatus}
          tutorId={tutorId}
          onClearTutor={handleClearTutor}
        />

        <Card className="overflow-hidden">
          {isError ? (
            <ErrorView onRetry={() => void refetch()} />
          ) : isLoading ? (
            <TableSkeleton />
          ) : (
            <>
              <ReviewsTable
                reviews={data?.data ?? []}
                emptyLabel={t('reviews.empty.title')}
                onModerate={setModerateReview}
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

      {moderateReview ? (
        <ReviewModerationDialog
          key={moderateReview.id}
          review={moderateReview}
          onOpenChange={(open) => !open && setModerateReview(null)}
        />
      ) : null}
    </Page>
  );
}
