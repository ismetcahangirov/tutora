import { useTranslation } from 'react-i18next';

import { Badge, Button, Select } from '@shared/ui';

import { REVIEW_STATUSES, type ReviewStatus } from '../types';

/**
 * Status filter for the reviews list. When the page is scoped to a single tutor
 * (via a deep link), a removable chip surfaces that scope so it never filters
 * silently. Fully controlled.
 */
export function ReviewsFilters({
  status,
  onStatusChange,
  tutorId,
  onClearTutor,
}: {
  status: ReviewStatus | undefined;
  onStatusChange: (status: ReviewStatus | undefined) => void;
  tutorId: string | undefined;
  onClearTutor: () => void;
}) {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
      <Select
        value={status ?? ''}
        onChange={(event) => onStatusChange(REVIEW_STATUSES.find((s) => s === event.target.value))}
        aria-label={t('reviews.filters.status')}
        className="sm:max-w-[220px]"
      >
        <option value="">{t('reviews.filters.allStatuses')}</option>
        {REVIEW_STATUSES.map((s) => (
          <option key={s} value={s}>
            {t(`reviews.status.${s}`)}
          </option>
        ))}
      </Select>

      {tutorId ? (
        <Badge variant="outline" className="gap-2 py-1.5">
          {t('reviews.filters.tutorScope')}
          <Button
            variant="ghost"
            size="sm"
            className="h-auto px-1 py-0 text-xs"
            onClick={onClearTutor}
          >
            {t('reviews.filters.clear')}
          </Button>
        </Badge>
      ) : null}
    </div>
  );
}
