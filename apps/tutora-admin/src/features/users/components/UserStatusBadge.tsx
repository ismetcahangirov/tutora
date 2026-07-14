import { useTranslation } from 'react-i18next';

import { Badge } from '@shared/ui';

import { userStatus, type AdminUser } from '../types';

/** Active (green) vs. suspended (red) chip, derived from the user's `deletedAt`. */
export function UserStatusBadge({ user }: { user: AdminUser }) {
  const { t } = useTranslation();
  const status = userStatus(user);
  return (
    <Badge variant={status === 'active' ? 'success' : 'destructive'}>
      {t(`users.status.${status}`)}
    </Badge>
  );
}
