import type { ColumnDef } from '@tanstack/react-table';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import { DataTable } from '@shared/components';
import { Avatar, AvatarFallback, AvatarImage, Button } from '@shared/ui';
import { formatDate } from '@shared/utils/formatDate';
import { getInitials } from '@shared/utils/initials';

import type { AdminReview } from '../types';
import { ReviewStatusBadge } from './ReviewStatusBadge';
import { StarRating } from './StarRating';

/** Author cell: avatar with a name/id fallback stack. */
function AuthorCell({ review }: { review: AdminReview }) {
  const { author } = review;
  return (
    <div className="flex items-center gap-3">
      <Avatar>
        {author.avatarUrl ? <AvatarImage src={author.avatarUrl} alt="" /> : null}
        <AvatarFallback>{getInitials(author.name, author.id)}</AvatarFallback>
      </Avatar>
      <p className="truncate text-sm font-medium text-foreground">{author.name ?? author.id}</p>
    </div>
  );
}

/** Reviews grid (TanStack Table). The row action opens the moderation dialog. */
export function ReviewsTable({
  reviews,
  onModerate,
  emptyLabel,
}: {
  reviews: AdminReview[];
  onModerate: (review: AdminReview) => void;
  emptyLabel: string;
}) {
  const { t, i18n } = useTranslation();

  const columns = useMemo<ColumnDef<AdminReview>[]>(
    () => [
      {
        id: 'author',
        header: t('reviews.columns.author'),
        cell: ({ row }) => <AuthorCell review={row.original} />,
      },
      {
        id: 'tutor',
        header: t('reviews.columns.tutor'),
        cell: ({ row }) => (
          <span className="truncate text-sm text-foreground">{row.original.tutorName ?? '—'}</span>
        ),
      },
      {
        id: 'rating',
        header: t('reviews.columns.rating'),
        cell: ({ row }) => (
          <StarRating
            value={row.original.rating}
            label={t('reviews.ratingLabel', { rating: row.original.rating })}
          />
        ),
      },
      {
        id: 'comment',
        header: t('reviews.columns.comment'),
        cell: ({ row }) => (
          <p className="line-clamp-2 max-w-xs text-sm text-muted-foreground">
            {row.original.comment ?? '—'}
          </p>
        ),
      },
      {
        id: 'status',
        header: t('reviews.columns.status'),
        cell: ({ row }) => <ReviewStatusBadge status={row.original.status} />,
      },
      {
        id: 'submitted',
        header: t('reviews.columns.submitted'),
        cell: ({ row }) => (
          <span className="whitespace-nowrap text-sm text-muted-foreground">
            {formatDate(row.original.createdAt, i18n.language)}
          </span>
        ),
      },
      {
        id: 'actions',
        header: () => <span className="sr-only">{t('reviews.columns.actions')}</span>,
        cell: ({ row }) => (
          <div className="flex justify-end">
            <Button size="sm" variant="secondary" onClick={() => onModerate(row.original)}>
              {t('reviews.actions.moderate')}
            </Button>
          </div>
        ),
      },
    ],
    [t, i18n.language, onModerate],
  );

  return (
    <DataTable
      columns={columns}
      data={reviews}
      getRowId={(review) => review.id}
      emptyLabel={emptyLabel}
    />
  );
}
