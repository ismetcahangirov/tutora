import { useTranslation } from 'react-i18next';

import { Input, Select } from '@shared/ui';

import { VERIFICATION_STATUSES, type VerificationStatus } from '../types';

/** Search + verification-status filters for the queue. Fully controlled. */
export function VerificationsFilters({
  search,
  onSearchChange,
  status,
  onStatusChange,
}: {
  search: string;
  onSearchChange: (value: string) => void;
  status: VerificationStatus | undefined;
  onStatusChange: (status: VerificationStatus | undefined) => void;
}) {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
      <Input
        type="search"
        value={search}
        onChange={(event) => onSearchChange(event.target.value)}
        placeholder={t('verifications.search')}
        aria-label={t('verifications.search')}
        className="sm:max-w-xs"
      />
      <Select
        value={status ?? ''}
        onChange={(event) =>
          onStatusChange(VERIFICATION_STATUSES.find((s) => s === event.target.value))
        }
        aria-label={t('verifications.filters.status')}
        className="sm:max-w-[220px]"
      >
        <option value="">{t('verifications.filters.allStatuses')}</option>
        {VERIFICATION_STATUSES.map((s) => (
          <option key={s} value={s}>
            {t(`verifications.status.${s}`)}
          </option>
        ))}
      </Select>
    </div>
  );
}
