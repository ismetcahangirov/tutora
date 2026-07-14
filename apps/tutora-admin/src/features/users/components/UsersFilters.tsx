import { useTranslation } from 'react-i18next';

import { USER_ROLES, type UserRole } from '@shared/rbac';
import { Input, Select } from '@shared/ui';

/** Search + role + lifecycle filters for the users table. Fully controlled. */
export function UsersFilters({
  search,
  onSearchChange,
  role,
  onRoleChange,
  includeDeleted,
  onIncludeDeletedChange,
}: {
  search: string;
  onSearchChange: (value: string) => void;
  role: UserRole | undefined;
  onRoleChange: (role: UserRole | undefined) => void;
  includeDeleted: boolean;
  onIncludeDeletedChange: (value: boolean) => void;
}) {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
      <Input
        type="search"
        value={search}
        onChange={(event) => onSearchChange(event.target.value)}
        placeholder={t('users.search')}
        aria-label={t('users.search')}
        className="sm:max-w-xs"
      />
      <Select
        value={role ?? ''}
        // Options are exactly USER_ROLES, so `find` narrows without a cast.
        onChange={(event) => onRoleChange(USER_ROLES.find((r) => r === event.target.value))}
        aria-label={t('users.filters.role')}
        className="sm:max-w-[200px]"
      >
        <option value="">{t('users.filters.allRoles')}</option>
        {USER_ROLES.map((r) => (
          <option key={r} value={r}>
            {t(`roles.${r}`)}
          </option>
        ))}
      </Select>
      <label className="flex items-center gap-2 text-sm text-muted-foreground">
        <input
          type="checkbox"
          checked={includeDeleted}
          onChange={(event) => onIncludeDeletedChange(event.target.checked)}
          className="size-4 rounded border-input text-primary focus-visible:ring-2 focus-visible:ring-ring"
        />
        {t('users.filters.includeSuspended')}
      </label>
    </div>
  );
}
