import { useTranslation } from 'react-i18next';

import { Badge, type BadgeVariants } from '@shared/ui';

import type { PlanTier } from '../types';

const VARIANT: Record<PlanTier, NonNullable<BadgeVariants['variant']>> = {
  FREE: 'neutral',
  PRO: 'primary',
};

/** Chip for a plan's tier (FREE / PRO). */
export function PlanTierBadge({ tier }: { tier: PlanTier }) {
  const { t } = useTranslation();
  return <Badge variant={VARIANT[tier]}>{t(`payments.tier.${tier}`)}</Badge>;
}
