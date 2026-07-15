import type { ColumnDef } from '@tanstack/react-table';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import { DataTable } from '@shared/components';
import { Badge, Button } from '@shared/ui';
import { formatDate } from '@shared/utils/formatDate';

import type { Translation } from '../types';
import { LocaleCoverage } from './LocaleCoverage';

/** Translation listing table. Presentational; paging is server-side. */
export function TranslationTable({
  translations,
  emptyLabel,
  onEdit,
  onDelete,
}: {
  translations: Translation[];
  emptyLabel: string;
  onEdit: (entry: Translation) => void;
  onDelete: (entry: Translation) => void;
}) {
  const { t, i18n } = useTranslation();

  const columns = useMemo<ColumnDef<Translation>[]>(
    () => [
      {
        id: 'key',
        header: t('translations.columns.key'),
        cell: ({ row }) => (
          <div className="space-y-0.5">
            <span className="font-mono text-sm font-medium text-foreground">
              {row.original.key}
            </span>
            {row.original.description ? (
              <p className="text-xs text-muted-foreground">{row.original.description}</p>
            ) : null}
          </div>
        ),
      },
      {
        id: 'namespace',
        header: t('translations.columns.namespace'),
        cell: ({ row }) => <Badge variant="outline">{row.original.namespace}</Badge>,
      },
      {
        id: 'locales',
        header: t('translations.columns.locales'),
        cell: ({ row }) => <LocaleCoverage values={row.original.values} />,
      },
      {
        id: 'updated',
        header: t('translations.columns.updated'),
        cell: ({ row }) => (
          <span className="whitespace-nowrap text-sm text-muted-foreground">
            {formatDate(row.original.updatedAt, i18n.language)}
          </span>
        ),
      },
      {
        id: 'actions',
        header: () => <span className="sr-only">{t('translations.columns.actions')}</span>,
        cell: ({ row }) => (
          <div className="flex justify-end gap-2">
            <Button size="sm" variant="secondary" onClick={() => onEdit(row.original)}>
              {t('common.edit')}
            </Button>
            <Button size="sm" variant="ghost" onClick={() => onDelete(row.original)}>
              {t('common.delete')}
            </Button>
          </div>
        ),
      },
    ],
    [t, i18n.language, onEdit, onDelete],
  );

  return (
    <DataTable
      columns={columns}
      data={translations}
      getRowId={(entry) => entry.id}
      emptyLabel={emptyLabel}
    />
  );
}
