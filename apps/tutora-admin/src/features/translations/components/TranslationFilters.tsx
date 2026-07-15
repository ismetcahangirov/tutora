import { useTranslation } from 'react-i18next';

import { Button, Input } from '@shared/ui';

/** Namespace + free-text key filters for the translations table. */
export function TranslationFilters({
  search,
  onSearchChange,
  namespace,
  onNamespaceChange,
  onClear,
}: {
  search: string;
  onSearchChange: (value: string) => void;
  namespace: string;
  onNamespaceChange: (value: string) => void;
  onClear: () => void;
}) {
  const { t } = useTranslation();
  const hasFilters = search.trim() !== '' || namespace.trim() !== '';

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
      <Input
        value={search}
        onChange={(e) => onSearchChange(e.target.value)}
        placeholder={t('translations.search')}
        aria-label={t('translations.search')}
        className="sm:max-w-xs"
      />
      <Input
        value={namespace}
        onChange={(e) => onNamespaceChange(e.target.value)}
        placeholder={t('translations.filters.namespace')}
        aria-label={t('translations.filters.namespace')}
        className="sm:max-w-[12rem]"
      />
      {hasFilters ? (
        <Button variant="ghost" size="sm" onClick={onClear}>
          {t('translations.filters.clear')}
        </Button>
      ) : null}
    </div>
  );
}
