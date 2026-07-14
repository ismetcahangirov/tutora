import { useTranslation } from 'react-i18next';

import { Badge, type BadgeProps } from '@shared/ui';

import type { AuditCategory } from '../types';

/** Badge colour per audit category — a security event stands out from routine ones. */
const CATEGORY_VARIANT: Record<AuditCategory, BadgeProps['variant']> = {
  ADMIN: 'primary',
  SECURITY: 'warning',
  SYSTEM: 'neutral',
};

/** Coloured chip for an audit entry's category. */
export function CategoryBadge({ category }: { category: AuditCategory }) {
  const { t } = useTranslation();
  return <Badge variant={CATEGORY_VARIANT[category]}>{t(`logs.categories.${category}`)}</Badge>;
}
