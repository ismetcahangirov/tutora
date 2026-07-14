import type { ColumnDef } from '@tanstack/react-table';
import { BadgeCheck, Ban, Eye, MoreHorizontal, Pencil, RotateCcw } from 'lucide-react';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import { DataTable } from '@shared/components';
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@shared/ui';
import { formatDate } from '@shared/utils/formatDate';
import { getInitials } from '@shared/utils/initials';

import { userStatus, type AdminUser } from '../types';
import { UserRoleBadge } from './UserRoleBadge';
import { UserStatusBadge } from './UserStatusBadge';

type UserAction = (user: AdminUser) => void;

type UsersTableProps = {
  users: AdminUser[];
  onView: UserAction;
  onEdit: UserAction;
  onLifecycle: UserAction;
  onReview: UserAction;
  emptyLabel: string;
};

/** Identity cell: avatar with a name/email fallback stack. */
function UserCell({ user }: { user: AdminUser }) {
  return (
    <div className="flex items-center gap-3">
      <Avatar>
        {user.avatarUrl ? <AvatarImage src={user.avatarUrl} alt="" /> : null}
        <AvatarFallback>{getInitials(user.name, user.email)}</AvatarFallback>
      </Avatar>
      <div className="min-w-0">
        <p className="truncate text-sm font-medium text-foreground">{user.name ?? user.email}</p>
        <p className="truncate text-xs text-muted-foreground">{user.email}</p>
      </div>
    </div>
  );
}

/** Per-row action menu. Verification review only shows for tutor accounts. */
function UserRowActions({
  user,
  onView,
  onEdit,
  onLifecycle,
  onReview,
}: Omit<UsersTableProps, 'users' | 'emptyLabel'> & { user: AdminUser }) {
  const { t } = useTranslation();
  const suspended = userStatus(user) === 'suspended';

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" aria-label={t('users.actions.menu')}>
          <MoreHorizontal />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuItem onSelect={() => onView(user)}>
          <Eye />
          {t('users.actions.view')}
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={() => onEdit(user)}>
          <Pencil />
          {t('users.actions.edit')}
        </DropdownMenuItem>
        {user.role === 'TUTOR' ? (
          <DropdownMenuItem onSelect={() => onReview(user)}>
            <BadgeCheck />
            {t('users.actions.review')}
          </DropdownMenuItem>
        ) : null}
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onSelect={() => onLifecycle(user)}
          className={suspended ? undefined : 'text-destructive focus:text-destructive'}
        >
          {suspended ? <RotateCcw /> : <Ban />}
          {suspended ? t('users.actions.restore') : t('users.actions.suspend')}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

/** Searchable users grid (TanStack Table). Columns close over the row actions. */
export function UsersTable({
  users,
  emptyLabel,
  onView,
  onEdit,
  onLifecycle,
  onReview,
}: UsersTableProps) {
  const { t, i18n } = useTranslation();

  const columns = useMemo<ColumnDef<AdminUser>[]>(
    () => [
      {
        id: 'user',
        header: t('users.columns.user'),
        cell: ({ row }) => <UserCell user={row.original} />,
      },
      {
        id: 'role',
        header: t('users.columns.role'),
        cell: ({ row }) => <UserRoleBadge role={row.original.role} />,
      },
      {
        id: 'status',
        header: t('users.columns.status'),
        cell: ({ row }) => <UserStatusBadge user={row.original} />,
      },
      {
        id: 'joined',
        header: t('users.columns.joined'),
        cell: ({ row }) => (
          <span className="whitespace-nowrap text-sm text-muted-foreground">
            {formatDate(row.original.createdAt, i18n.language)}
          </span>
        ),
      },
      {
        id: 'actions',
        header: () => <span className="sr-only">{t('users.columns.actions')}</span>,
        cell: ({ row }) => (
          <div className="flex justify-end">
            <UserRowActions
              user={row.original}
              onView={onView}
              onEdit={onEdit}
              onLifecycle={onLifecycle}
              onReview={onReview}
            />
          </div>
        ),
      },
    ],
    [t, i18n.language, onView, onEdit, onLifecycle, onReview],
  );

  return (
    <DataTable
      columns={columns}
      data={users}
      getRowId={(user) => user.id}
      emptyLabel={emptyLabel}
    />
  );
}
