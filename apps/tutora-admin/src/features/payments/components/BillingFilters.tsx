import { useTranslation } from 'react-i18next';

import { Badge, Button, Select } from '@shared/ui';

/**
 * Shared filter bar for the subscriptions and transactions tables: a status
 * dropdown plus a removable chip when the list is scoped to a single user (via a
 * deep link), so the scope is never applied silently. Fully controlled and
 * generic over the resource's status enum.
 */
export function BillingFilters<TStatus extends string>({
  statuses,
  status,
  onStatusChange,
  getStatusLabel,
  statusFilterLabel,
  allStatusesLabel,
  userId,
  onClearUser,
}: {
  statuses: readonly TStatus[];
  status: TStatus | undefined;
  onStatusChange: (status: TStatus | undefined) => void;
  getStatusLabel: (status: TStatus) => string;
  statusFilterLabel: string;
  allStatusesLabel: string;
  userId: string | undefined;
  onClearUser: () => void;
}) {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
      <Select
        value={status ?? ''}
        onChange={(event) => onStatusChange(statuses.find((s) => s === event.target.value))}
        aria-label={statusFilterLabel}
        className="sm:max-w-[220px]"
      >
        <option value="">{allStatusesLabel}</option>
        {statuses.map((s) => (
          <option key={s} value={s}>
            {getStatusLabel(s)}
          </option>
        ))}
      </Select>

      {userId ? (
        <Badge variant="outline" className="gap-2 py-1.5">
          {t('payments.filters.userScope')}
          <Button
            variant="ghost"
            size="sm"
            className="h-auto px-1 py-0 text-xs"
            onClick={onClearUser}
          >
            {t('payments.filters.clear')}
          </Button>
        </Badge>
      ) : null}
    </div>
  );
}
