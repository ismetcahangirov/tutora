import { useTranslation } from 'react-i18next';

import { Badge, type BadgeVariants } from '@shared/ui';

import type { CertificateStatus } from '../types';

const VARIANT: Record<CertificateStatus, NonNullable<BadgeVariants['variant']>> = {
  PENDING: 'warning',
  VERIFIED: 'success',
  REJECTED: 'destructive',
};

/** Coloured chip for a single certificate's review status. */
export function CertificateStatusBadge({ status }: { status: CertificateStatus }) {
  const { t } = useTranslation();
  return <Badge variant={VARIANT[status]}>{t(`verifications.certStatus.${status}`)}</Badge>;
}
