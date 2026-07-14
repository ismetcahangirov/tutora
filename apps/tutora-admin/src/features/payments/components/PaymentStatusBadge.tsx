import { useTranslation } from 'react-i18next';

import { Badge, type BadgeVariants } from '@shared/ui';

import type { PaymentStatus } from '../types';

const VARIANT: Record<PaymentStatus, NonNullable<BadgeVariants['variant']>> = {
  PENDING: 'warning',
  SUCCEEDED: 'success',
  FAILED: 'destructive',
  REFUNDED: 'neutral',
};

/** Coloured chip for a payment's lifecycle status. */
export function PaymentStatusBadge({ status }: { status: PaymentStatus }) {
  const { t } = useTranslation();
  return <Badge variant={VARIANT[status]}>{t(`payments.paymentStatus.${status}`)}</Badge>;
}
