import { useTranslation } from 'react-i18next';

import { SUPPORTED_LANGUAGES } from '@shared/i18n/languages';
import { Button, Input, Select } from '@shared/ui';

import { CONTENT_STATUSES, type ContentStatus } from '../types';

/** Search + locale + status filters for the content table. */
export function ContentFilters({
  search,
  onSearchChange,
  locale,
  onLocaleChange,
  status,
  onStatusChange,
  onClear,
}: {
  search: string;
  onSearchChange: (value: string) => void;
  locale: string | undefined;
  onLocaleChange: (locale: string | undefined) => void;
  status: ContentStatus | undefined;
  onStatusChange: (status: ContentStatus | undefined) => void;
  onClear: () => void;
}) {
  const { t } = useTranslation();
  const hasFilters = search.trim() !== '' || locale !== undefined || status !== undefined;

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
      <Input
        value={search}
        onChange={(e) => onSearchChange(e.target.value)}
        placeholder={t('cms.search')}
        aria-label={t('cms.search')}
        className="sm:max-w-xs"
      />
      <Select
        value={locale ?? ''}
        onChange={(e) => onLocaleChange(e.target.value || undefined)}
        aria-label={t('cms.filters.locale')}
        className="sm:max-w-[10rem]"
      >
        <option value="">{t('cms.filters.allLocales')}</option>
        {SUPPORTED_LANGUAGES.map((lang) => (
          <option key={lang} value={lang}>
            {lang.toUpperCase()}
          </option>
        ))}
      </Select>
      <Select
        value={status ?? ''}
        onChange={(e) => onStatusChange((e.target.value || undefined) as ContentStatus | undefined)}
        aria-label={t('cms.filters.status')}
        className="sm:max-w-[12rem]"
      >
        <option value="">{t('cms.filters.allStatuses')}</option>
        {CONTENT_STATUSES.map((option) => (
          <option key={option} value={option}>
            {t(`cms.status.${option}`)}
          </option>
        ))}
      </Select>
      {hasFilters ? (
        <Button variant="ghost" size="sm" onClick={onClear}>
          {t('cms.filters.clear')}
        </Button>
      ) : null}
    </div>
  );
}
