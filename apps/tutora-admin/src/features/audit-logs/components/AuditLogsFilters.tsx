import { useTranslation } from 'react-i18next';

import { Button, Input, Select } from '@shared/ui';

import { AUDIT_CATEGORIES, type AuditCategory } from '../types';

/** Filter bar for the audit-log table: free-text search + category. */
export function AuditLogsFilters({
  search,
  onSearchChange,
  category,
  onCategoryChange,
  onClear,
}: {
  search: string;
  onSearchChange: (value: string) => void;
  category: AuditCategory | undefined;
  onCategoryChange: (category: AuditCategory | undefined) => void;
  onClear: () => void;
}) {
  const { t } = useTranslation();
  const hasFilters = search.trim() !== '' || category !== undefined;

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
      <Input
        value={search}
        onChange={(e) => onSearchChange(e.target.value)}
        placeholder={t('logs.search')}
        aria-label={t('logs.search')}
        className="sm:max-w-xs"
      />
      <Select
        value={category ?? ''}
        onChange={(e) =>
          onCategoryChange((e.target.value || undefined) as AuditCategory | undefined)
        }
        aria-label={t('logs.filters.category')}
        className="sm:max-w-[12rem]"
      >
        <option value="">{t('logs.filters.allCategories')}</option>
        {AUDIT_CATEGORIES.map((option) => (
          <option key={option} value={option}>
            {t(`logs.categories.${option}`)}
          </option>
        ))}
      </Select>
      {hasFilters ? (
        <Button variant="ghost" size="sm" onClick={onClear}>
          {t('logs.filters.clear')}
        </Button>
      ) : null}
    </div>
  );
}
