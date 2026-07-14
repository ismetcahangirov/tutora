import { useTranslation } from 'react-i18next';

import { Badge, type BadgeVariants } from '@shared/ui';

import type { ReviewStatus } from '../types';

const VARIANT: Record<ReviewStatus, NonNullable<BadgeVariants['variant']>> = {
  PUBLISHED: 'success',
  HIDDEN: 'warning',
  REMOVED: 'destructive',
};

/** Coloured chip for a review's moderation status. */
export function ReviewStatusBadge({ status }: { status: ReviewStatus }) {
  const { t } = useTranslation();
  return <Badge variant={VARIANT[status]}>{t(`reviews.status.${status}`)}</Badge>;
}
