import { useTranslation } from 'react-i18next';

import type { UserRole } from '@shared/rbac';
import { Badge, type BadgeVariants } from '@shared/ui';

/** Badge tone per role. Admin stands out; the others read as neutral chips. */
const ROLE_VARIANT: Record<UserRole, NonNullable<BadgeVariants['variant']>> = {
  ADMIN: 'primary',
  TUTOR: 'outline',
  STUDENT: 'neutral',
};

/** Coloured chip for a user's role, or a dash when a role isn't assigned yet. */
export function UserRoleBadge({ role }: { role: UserRole | null }) {
  const { t } = useTranslation();
  if (!role) return <Badge variant="neutral">{t('roles.none')}</Badge>;
  return <Badge variant={ROLE_VARIANT[role]}>{t(`roles.${role}`)}</Badge>;
}
