import { useTranslation } from 'react-i18next';

import { ConfirmDialog } from '@shared/components';

import { useRestoreUser, useSuspendUser } from '../hooks/useUserMutations';
import { userStatus, type AdminUser } from '../types';

/**
 * Confirmation for suspending or restoring a user. The action is derived from
 * the user's current lifecycle state, so one dialog covers both directions.
 */
export function UserLifecycleDialog({
  user,
  onOpenChange,
}: {
  user: AdminUser;
  onOpenChange: (open: boolean) => void;
}) {
  const { t } = useTranslation();
  const suspended = userStatus(user) === 'suspended';
  const suspend = useSuspendUser();
  const restore = useRestoreUser();

  const active = suspended ? restore : suspend;
  const key = suspended ? 'restore' : 'suspend';
  const name = user.name ?? user.email;

  const handleConfirm = () => {
    const options = { onSuccess: () => onOpenChange(false) };
    if (suspended) restore.mutate(user.id, options);
    else suspend.mutate(user.id, options);
  };

  return (
    <ConfirmDialog
      open
      onOpenChange={onOpenChange}
      title={t(`users.${key}.title`)}
      description={t(`users.${key}.description`, { name })}
      confirmLabel={t(`users.${key}.confirm`)}
      onConfirm={handleConfirm}
      pending={active.isPending}
      destructive={!suspended}
      error={active.isError ? t('users.lifecycleError') : null}
    />
  );
}
