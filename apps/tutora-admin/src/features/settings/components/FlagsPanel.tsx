import type { ColumnDef } from '@tanstack/react-table';
import { Plus } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { ConfirmDialog, DataTable, ErrorView } from '@shared/components';
import { Badge, Button, Card, Skeleton } from '@shared/ui';
import { formatDate } from '@shared/utils/formatDate';

import { useDeleteFeatureFlag, useFeatureFlagsQuery } from '../hooks/useFeatureFlags';
import type { FeatureFlag } from '../types';
import { FeatureFlagFormDialog } from './FeatureFlagFormDialog';

function TableSkeleton() {
  return (
    <div className="space-y-4 p-4">
      {Array.from({ length: 3 }).map((_, index) => (
        <div key={index} className="flex items-center gap-3">
          <Skeleton className="h-4 w-40" />
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-4 w-24" />
        </div>
      ))}
    </div>
  );
}

/** Feature-flag administration (#70): list flags, create, edit, and delete. */
export function FlagsPanel() {
  const { t, i18n } = useTranslation();
  const { data: flags, isLoading, isError, refetch } = useFeatureFlagsQuery();
  const deleteFlag = useDeleteFeatureFlag();

  const [createOpen, setCreateOpen] = useState(false);
  const [editFlag, setEditFlag] = useState<FeatureFlag | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<FeatureFlag | null>(null);

  const handleDelete = () => {
    if (!deleteTarget) return;
    deleteFlag.mutate(deleteTarget.id, { onSuccess: () => setDeleteTarget(null) });
  };

  const columns = useMemo<ColumnDef<FeatureFlag>[]>(
    () => [
      {
        id: 'key',
        header: t('settings.flagsColumns.key'),
        cell: ({ row }) => (
          <div className="space-y-0.5">
            <span className="font-mono text-sm font-medium text-foreground">
              {row.original.key}
            </span>
            {row.original.description ? (
              <p className="max-w-md text-xs text-muted-foreground">{row.original.description}</p>
            ) : null}
          </div>
        ),
      },
      {
        id: 'status',
        header: t('settings.flagsColumns.status'),
        cell: ({ row }) => (
          <Badge variant={row.original.enabled ? 'success' : 'neutral'}>
            {t(row.original.enabled ? 'settings.flagForm.on' : 'settings.flagForm.off')}
          </Badge>
        ),
      },
      {
        id: 'rollout',
        header: t('settings.flagsColumns.rollout'),
        cell: ({ row }) => (
          <span className="text-sm text-foreground">
            {t('settings.rolloutValue', { percent: row.original.rolloutPercentage })}
          </span>
        ),
      },
      {
        id: 'updated',
        header: t('settings.flagsColumns.updated'),
        cell: ({ row }) => (
          <span className="whitespace-nowrap text-sm text-muted-foreground">
            {formatDate(row.original.updatedAt, i18n.language)}
          </span>
        ),
      },
      {
        id: 'actions',
        header: () => <span className="sr-only">{t('settings.flagsColumns.actions')}</span>,
        cell: ({ row }) => (
          <div className="flex justify-end gap-2">
            <Button size="sm" variant="secondary" onClick={() => setEditFlag(row.original)}>
              {t('common.edit')}
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setDeleteTarget(row.original)}>
              {t('common.delete')}
            </Button>
          </div>
        ),
      },
    ],
    [t, i18n.language],
  );

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button size="sm" onClick={() => setCreateOpen(true)}>
          <Plus />
          {t('settings.flagForm.add')}
        </Button>
      </div>

      <Card className="overflow-hidden">
        {isError ? (
          <ErrorView onRetry={() => void refetch()} />
        ) : isLoading ? (
          <TableSkeleton />
        ) : (
          <DataTable
            columns={columns}
            data={flags ?? []}
            getRowId={(flag) => flag.id}
            emptyLabel={t('settings.flagsEmpty')}
          />
        )}
      </Card>

      {createOpen ? <FeatureFlagFormDialog flag={null} onOpenChange={setCreateOpen} /> : null}

      {editFlag ? (
        <FeatureFlagFormDialog
          key={editFlag.id}
          flag={editFlag}
          onOpenChange={(open) => !open && setEditFlag(null)}
        />
      ) : null}

      <ConfirmDialog
        open={deleteTarget !== null}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title={t('settings.flagDelete.title')}
        description={t('settings.flagDelete.description', { key: deleteTarget?.key ?? '' })}
        confirmLabel={t('common.delete')}
        onConfirm={handleDelete}
        pending={deleteFlag.isPending}
        destructive
        error={deleteFlag.isError ? t('settings.flagDelete.error') : null}
      />
    </div>
  );
}
