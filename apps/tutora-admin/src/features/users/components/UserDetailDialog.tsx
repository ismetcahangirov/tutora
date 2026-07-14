import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';

import {
  Avatar,
  AvatarFallback,
  AvatarImage,
  Button,
  Dialog,
  DialogBody,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@shared/ui';
import { formatDate } from '@shared/utils/formatDate';
import { getInitials } from '@shared/utils/initials';

import type { AdminUser } from '../types';
import { UserRoleBadge } from './UserRoleBadge';
import { UserStatusBadge } from './UserStatusBadge';

function DetailRow({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div>
      <dt className="text-xs uppercase tracking-wide text-muted-foreground">{label}</dt>
      <dd className="mt-1 text-sm text-foreground">{value}</dd>
    </div>
  );
}

/** Read-only account overview for a single user. */
export function UserDetailDialog({
  user,
  onOpenChange,
}: {
  user: AdminUser;
  onOpenChange: (open: boolean) => void;
}) {
  const { t, i18n } = useTranslation();
  const yesNo = (value: boolean) => t(value ? 'common.yes' : 'common.no');

  return (
    <Dialog open onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader closeLabel={t('common.close')}>
          <DialogTitle>{t('users.detail.title')}</DialogTitle>
          <DialogDescription>{user.email}</DialogDescription>
        </DialogHeader>
        <DialogBody className="space-y-5">
          <div className="flex items-center gap-3">
            <Avatar className="size-12">
              {user.avatarUrl ? <AvatarImage src={user.avatarUrl} alt="" /> : null}
              <AvatarFallback>{getInitials(user.name, user.email)}</AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <p className="truncate font-medium text-foreground">{user.name ?? '—'}</p>
              <p className="truncate text-sm text-muted-foreground">{user.email}</p>
            </div>
          </div>
          <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <DetailRow label={t('users.detail.role')} value={<UserRoleBadge role={user.role} />} />
            <DetailRow label={t('users.detail.status')} value={<UserStatusBadge user={user} />} />
            <DetailRow label={t('users.detail.provider')} value={user.provider} />
            <DetailRow label={t('users.detail.locale')} value={user.locale ?? '—'} />
            <DetailRow label={t('users.detail.emailVerified')} value={yesNo(user.emailVerified)} />
            <DetailRow
              label={t('users.detail.onboarding')}
              value={yesNo(user.onboardingCompleted)}
            />
            <DetailRow
              label={t('users.detail.joined')}
              value={formatDate(user.createdAt, i18n.language)}
            />
            <DetailRow
              label={t('users.detail.updated')}
              value={formatDate(user.updatedAt, i18n.language)}
            />
          </dl>
        </DialogBody>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="secondary" size="sm">
              {t('common.close')}
            </Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
