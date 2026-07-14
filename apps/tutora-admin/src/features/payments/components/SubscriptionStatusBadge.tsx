import { useTranslation } from 'react-i18next';

import { Badge, type BadgeVariants } from '@shared/ui';

import type { SubscriptionStatus } from '../types';

const VARIANT: Record<SubscriptionStatus, NonNullable<BadgeVariants['variant']>> = {
  ACTIVE: 'success',
  PAST_DUE: 'warning',
  CANCELED: 'neutral',
  EXPIRED: 'destructive',
};

/** Coloured chip for a subscription's lifecycle status. */
export function SubscriptionStatusBadge({ status }: { status: SubscriptionStatus }) {
  const { t } = useTranslation();
  return <Badge variant={VARIANT[status]}>{t(`payments.subscriptionStatus.${status}`)}</Badge>;
}
