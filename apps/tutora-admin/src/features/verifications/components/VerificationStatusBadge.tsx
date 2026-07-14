import { useTranslation } from 'react-i18next';

import { Badge, type BadgeVariants } from '@shared/ui';

import type { VerificationStatus } from '../types';

const VARIANT: Record<VerificationStatus, NonNullable<BadgeVariants['variant']>> = {
  UNVERIFIED: 'neutral',
  PENDING: 'warning',
  VERIFIED: 'success',
  REJECTED: 'destructive',
};

/** Coloured chip for a tutor's account-level verification status. */
export function VerificationStatusBadge({ status }: { status: VerificationStatus }) {
  const { t } = useTranslation();
  return <Badge variant={VARIANT[status]}>{t(`verifications.status.${status}`)}</Badge>;
}
