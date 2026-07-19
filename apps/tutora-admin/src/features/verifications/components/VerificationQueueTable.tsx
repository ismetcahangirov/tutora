import type { ColumnDef } from '@tanstack/react-table';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import { DataTable } from '@shared/components';
import { Avatar, AvatarFallback, AvatarImage, Button } from '@shared/ui';
import { formatDate } from '@shared/utils/formatDate';
import { getInitials } from '@shared/utils/initials';

import type { AdminTutorListItem } from '../types';
import { VerificationStatusBadge } from './VerificationStatusBadge';

/** Identity cell: avatar with a name/email fallback stack. */
function TutorCell({ tutor }: { tutor: AdminTutorListItem }) {
  return (
    <div className="flex items-center gap-3">
      <Avatar>
        {tutor.avatarUrl ? <AvatarImage src={tutor.avatarUrl} alt="" /> : null}
        <AvatarFallback>{getInitials(tutor.name, tutor.email)}</AvatarFallback>
      </Avatar>
      <div className="min-w-0">
        <p className="truncate text-sm font-medium text-foreground">{tutor.name ?? tutor.email}</p>
        <p className="truncate text-xs text-muted-foreground">{tutor.email}</p>
      </div>
    </div>
  );
}

/** Verification queue grid (TanStack Table). The row action opens the review dialog. */
export function VerificationQueueTable({
  tutors,
  onReview,
  emptyLabel,
}: {
  tutors: AdminTutorListItem[];
  onReview: (tutorId: string) => void;
  emptyLabel: string;
}) {
  const { t, i18n } = useTranslation();

  const columns = useMemo<ColumnDef<AdminTutorListItem>[]>(
    () => [
      {
        id: 'tutor',
        header: t('verifications.columns.tutor'),
        cell: ({ row }) => <TutorCell tutor={row.original} />,
      },
      {
        id: 'status',
        header: t('verifications.columns.status'),
        cell: ({ row }) => <VerificationStatusBadge status={row.original.verificationStatus} />,
      },
      {
        id: 'rate',
        header: t('verifications.columns.rate'),
        cell: ({ row }) => (
          <span className="whitespace-nowrap text-sm text-foreground">
            {row.original.hourlyRate === null
              ? '—'
              : `${row.original.hourlyRate} ${row.original.currency}`}
          </span>
        ),
      },
      {
        id: 'rating',
        header: t('verifications.columns.rating'),
        cell: ({ row }) => (
          <span className="whitespace-nowrap text-sm text-muted-foreground">
            {row.original.ratingCount > 0
              ? `${row.original.ratingAvg.toFixed(1)} (${row.original.ratingCount})`
              : '—'}
          </span>
        ),
      },
      {
        id: 'submitted',
        header: t('verifications.columns.submitted'),
        cell: ({ row }) => (
          <span className="whitespace-nowrap text-sm text-muted-foreground">
            {formatDate(row.original.createdAt, i18n.language)}
          </span>
        ),
      },
      {
        id: 'actions',
        header: () => <span className="sr-only">{t('verifications.columns.actions')}</span>,
        cell: ({ row }) => (
          <div className="flex justify-end">
            <Button size="sm" variant="secondary" onClick={() => onReview(row.original.id)}>
              {t('verifications.actions.review')}
            </Button>
          </div>
        ),
      },
    ],
    [t, i18n.language, onReview],
  );

  return (
    <DataTable
      columns={columns}
      data={tutors}
      getRowId={(tutor) => tutor.id}
      emptyLabel={emptyLabel}
    />
  );
}
