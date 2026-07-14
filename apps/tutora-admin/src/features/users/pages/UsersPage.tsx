import { UserPlus } from 'lucide-react';
import { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router';

import { ErrorView, Page, PageHeader, TablePagination } from '@shared/components';
import { useDebouncedValue } from '@shared/hooks/useDebouncedValue';
import type { UserRole } from '@shared/rbac';
import { Button, Card, Separator, Skeleton } from '@shared/ui';

import { CreateUserDialog } from '../components/CreateUserDialog';
import { EditUserDialog } from '../components/EditUserDialog';
import { UserDetailDialog } from '../components/UserDetailDialog';
import { UserLifecycleDialog } from '../components/UserLifecycleDialog';
import { UsersFilters } from '../components/UsersFilters';
import { UsersTable } from '../components/UsersTable';
import { USERS_PAGE_SIZE } from '../constants';
import { useUsersQuery } from '../hooks/useUsers';
import type { AdminUser, ListUsersParams } from '../types';

/** Loading placeholder that mirrors the table's row rhythm. */
function TableSkeleton() {
  return (
    <div className="space-y-4 p-4">
      {Array.from({ length: 6 }).map((_, index) => (
        <div key={index} className="flex items-center gap-3">
          <Skeleton className="size-9 rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-3 w-40" />
            <Skeleton className="h-3 w-24" />
          </div>
        </div>
      ))}
    </div>
  );
}

/** Users / Students / Tutors management (#62): search, filter, view, edit, suspend. */
export function UsersPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [search, setSearch] = useState('');
  const [role, setRole] = useState<UserRole | undefined>(undefined);
  const [includeDeleted, setIncludeDeleted] = useState(false);
  const [page, setPage] = useState(1);
  const debouncedSearch = useDebouncedValue(search.trim(), 300);

  const [detailUser, setDetailUser] = useState<AdminUser | null>(null);
  const [editUser, setEditUser] = useState<AdminUser | null>(null);
  const [lifecycleUser, setLifecycleUser] = useState<AdminUser | null>(null);
  const [createOpen, setCreateOpen] = useState(false);

  const params: ListUsersParams = {
    page,
    limit: USERS_PAGE_SIZE,
    role,
    q: debouncedSearch || undefined,
    includeDeleted,
  };
  const { data, isLoading, isError, isFetching, refetch } = useUsersQuery(params);

  // Any filter change resets to the first page so results stay coherent.
  const handleSearch = (value: string) => {
    setSearch(value);
    setPage(1);
  };
  const handleRole = (next: UserRole | undefined) => {
    setRole(next);
    setPage(1);
  };
  const handleIncludeDeleted = (value: boolean) => {
    setIncludeDeleted(value);
    setPage(1);
  };
  const handleReview = useCallback(
    (user: AdminUser) => navigate(`/verifications?q=${encodeURIComponent(user.email)}`),
    [navigate],
  );

  return (
    <Page>
      <PageHeader
        title={t('users.title')}
        description={t('users.subtitle')}
        actions={
          <Button size="sm" onClick={() => setCreateOpen(true)}>
            <UserPlus />
            {t('users.add')}
          </Button>
        }
      />

      <div className="space-y-4">
        <UsersFilters
          search={search}
          onSearchChange={handleSearch}
          role={role}
          onRoleChange={handleRole}
          includeDeleted={includeDeleted}
          onIncludeDeletedChange={handleIncludeDeleted}
        />

        <Card className="overflow-hidden">
          {isError ? (
            <ErrorView onRetry={() => void refetch()} />
          ) : isLoading ? (
            <TableSkeleton />
          ) : (
            <>
              <UsersTable
                users={data?.data ?? []}
                emptyLabel={t('users.empty.title')}
                onView={setDetailUser}
                onEdit={setEditUser}
                onLifecycle={setLifecycleUser}
                onReview={handleReview}
              />
              {data ? (
                <>
                  <Separator />
                  <TablePagination
                    page={data.meta.page}
                    totalPages={data.meta.totalPages}
                    total={data.meta.total}
                    onPageChange={setPage}
                    disabled={isFetching}
                  />
                </>
              ) : null}
            </>
          )}
        </Card>
      </div>

      {detailUser ? (
        <UserDetailDialog
          key={detailUser.id}
          user={detailUser}
          onOpenChange={(open) => !open && setDetailUser(null)}
        />
      ) : null}
      {editUser ? (
        <EditUserDialog
          key={editUser.id}
          user={editUser}
          onOpenChange={(open) => !open && setEditUser(null)}
        />
      ) : null}
      {lifecycleUser ? (
        <UserLifecycleDialog
          key={lifecycleUser.id}
          user={lifecycleUser}
          onOpenChange={(open) => !open && setLifecycleUser(null)}
        />
      ) : null}
      {createOpen ? <CreateUserDialog onOpenChange={setCreateOpen} /> : null}
    </Page>
  );
}
