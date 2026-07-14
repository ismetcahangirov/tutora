import type { ColumnDef } from '@tanstack/react-table';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import { DataTable } from '@shared/components';
import { Badge, Button } from '@shared/ui';
import { formatDate } from '@shared/utils/formatDate';

import type { ContentEntry } from '../types';

/** Content listing table for one content type. Presentational; paging is server-side. */
export function ContentTable({
  entries,
  emptyLabel,
  onEdit,
  onDelete,
}: {
  entries: ContentEntry[];
  emptyLabel: string;
  onEdit: (entry: ContentEntry) => void;
  onDelete: (entry: ContentEntry) => void;
}) {
  const { t, i18n } = useTranslation();

  const columns = useMemo<ColumnDef<ContentEntry>[]>(
    () => [
      {
        id: 'title',
        header: t('cms.columns.title'),
        cell: ({ row }) => (
          <div className="space-y-0.5">
            <span className="text-sm font-medium text-foreground">{row.original.title}</span>
            <p className="font-mono text-xs text-muted-foreground">{row.original.slug}</p>
          </div>
        ),
      },
      {
        id: 'locale',
        header: t('cms.columns.locale'),
        cell: ({ row }) => <Badge variant="outline">{row.original.locale.toUpperCase()}</Badge>,
      },
      {
        id: 'status',
        header: t('cms.columns.status'),
        cell: ({ row }) => (
          <Badge variant={row.original.status === 'PUBLISHED' ? 'success' : 'neutral'}>
            {t(`cms.status.${row.original.status}`)}
          </Badge>
        ),
      },
      {
        id: 'order',
        header: t('cms.columns.order'),
        cell: ({ row }) => <span className="text-sm text-foreground">{row.original.order}</span>,
      },
      {
        id: 'updated',
        header: t('cms.columns.updated'),
        cell: ({ row }) => (
          <span className="whitespace-nowrap text-sm text-muted-foreground">
            {formatDate(row.original.updatedAt, i18n.language)}
          </span>
        ),
      },
      {
        id: 'actions',
        header: () => <span className="sr-only">{t('cms.columns.actions')}</span>,
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
      data={entries}
      getRowId={(entry) => entry.id}
      emptyLabel={emptyLabel}
    />
  );
}
