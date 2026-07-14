import type { ColumnDef } from '@tanstack/react-table';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import { DataTable } from '@shared/components';
import { Button } from '@shared/ui';
import { formatDateTime } from '@shared/utils/formatDate';

import type { AuditLog } from '../types';
import { CategoryBadge } from './CategoryBadge';

/** Presentational audit-log grid. Fetching, filtering, and paging live upstream. */
export function AuditLogsTable({
  logs,
  emptyLabel,
  onView,
}: {
  logs: AuditLog[];
  emptyLabel: string;
  onView: (log: AuditLog) => void;
}) {
  const { t, i18n } = useTranslation();

  const columns = useMemo<ColumnDef<AuditLog>[]>(
    () => [
      {
        id: 'time',
        header: t('logs.columns.time'),
        cell: ({ row }) => (
          <span className="whitespace-nowrap text-sm text-muted-foreground">
            {formatDateTime(row.original.createdAt, i18n.language)}
          </span>
        ),
      },
      {
        id: 'actor',
        header: t('logs.columns.actor'),
        cell: ({ row }) => (
          <span className="text-sm text-foreground">{row.original.actorEmail}</span>
        ),
      },
      {
        id: 'category',
        header: t('logs.columns.category'),
        cell: ({ row }) => <CategoryBadge category={row.original.category} />,
      },
      {
        id: 'action',
        header: t('logs.columns.action'),
        cell: ({ row }) => (
          <span className="font-mono text-sm text-foreground">{row.original.action}</span>
        ),
      },
      {
        id: 'entity',
        header: t('logs.columns.entity'),
        cell: ({ row }) =>
          row.original.entityType ? (
            <span className="text-sm text-muted-foreground">{row.original.entityType}</span>
          ) : (
            <span className="text-sm text-muted-foreground">—</span>
          ),
      },
      {
        id: 'actions',
        header: () => <span className="sr-only">{t('logs.columns.actions')}</span>,
        cell: ({ row }) => (
          <div className="flex justify-end">
            <Button size="sm" variant="secondary" onClick={() => onView(row.original)}>
              {t('logs.view')}
            </Button>
          </div>
        ),
      },
    ],
    [t, i18n.language, onView],
  );

  return (
    <DataTable columns={columns} data={logs} getRowId={(log) => log.id} emptyLabel={emptyLabel} />
  );
}
