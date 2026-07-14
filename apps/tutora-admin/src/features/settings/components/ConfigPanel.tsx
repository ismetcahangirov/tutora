import type { ColumnDef } from '@tanstack/react-table';
import { Plus } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { ConfirmDialog, DataTable, ErrorView } from '@shared/components';
import { Button, Card, Skeleton } from '@shared/ui';
import { formatDate } from '@shared/utils/formatDate';

import { useDeleteSystemSetting, useSystemSettingsQuery } from '../hooks/useSystemSettings';
import type { SystemSetting } from '../types';
import { SystemSettingFormDialog } from './SystemSettingFormDialog';

/** Longest single-line JSON preview shown in the value column. */
const VALUE_PREVIEW_MAX = 80;

/** Compact, single-line JSON preview of a setting's value. */
function valuePreview(value: unknown): string {
  const json = JSON.stringify(value ?? '');
  return json.length > VALUE_PREVIEW_MAX ? `${json.slice(0, VALUE_PREVIEW_MAX)}…` : json;
}

function TableSkeleton() {
  return (
    <div className="space-y-4 p-4">
      {Array.from({ length: 3 }).map((_, index) => (
        <div key={index} className="flex items-center gap-3">
          <Skeleton className="h-4 w-40" />
          <Skeleton className="h-4 w-48" />
          <Skeleton className="h-4 w-24" />
        </div>
      ))}
    </div>
  );
}

/** System-settings administration (#70): list, create, edit, and delete config. */
export function ConfigPanel() {
  const { t, i18n } = useTranslation();
  const { data: settings, isLoading, isError, refetch } = useSystemSettingsQuery();
  const deleteSetting = useDeleteSystemSetting();

  const [createOpen, setCreateOpen] = useState(false);
  const [editSetting, setEditSetting] = useState<SystemSetting | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<SystemSetting | null>(null);

  const handleDelete = () => {
    if (!deleteTarget) return;
    deleteSetting.mutate(deleteTarget.id, { onSuccess: () => setDeleteTarget(null) });
  };

  const columns = useMemo<ColumnDef<SystemSetting>[]>(
    () => [
      {
        id: 'key',
        header: t('settings.settingsColumns.key'),
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
        id: 'value',
        header: t('settings.settingsColumns.value'),
        cell: ({ row }) => (
          <code className="max-w-xs truncate rounded bg-muted px-2 py-1 text-xs text-foreground">
            {valuePreview(row.original.value)}
          </code>
        ),
      },
      {
        id: 'updated',
        header: t('settings.settingsColumns.updated'),
        cell: ({ row }) => (
          <span className="whitespace-nowrap text-sm text-muted-foreground">
            {formatDate(row.original.updatedAt, i18n.language)}
          </span>
        ),
      },
      {
        id: 'actions',
        header: () => <span className="sr-only">{t('settings.settingsColumns.actions')}</span>,
        cell: ({ row }) => (
          <div className="flex justify-end gap-2">
            <Button size="sm" variant="secondary" onClick={() => setEditSetting(row.original)}>
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
          {t('settings.settingForm.add')}
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
            data={settings ?? []}
            getRowId={(setting) => setting.id}
            emptyLabel={t('settings.settingsEmpty')}
          />
        )}
      </Card>

      {createOpen ? <SystemSettingFormDialog setting={null} onOpenChange={setCreateOpen} /> : null}

      {editSetting ? (
        <SystemSettingFormDialog
          key={editSetting.id}
          setting={editSetting}
          onOpenChange={(open) => !open && setEditSetting(null)}
        />
      ) : null}

      <ConfirmDialog
        open={deleteTarget !== null}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title={t('settings.settingDelete.title')}
        description={t('settings.settingDelete.description', { key: deleteTarget?.key ?? '' })}
        confirmLabel={t('common.delete')}
        onConfirm={handleDelete}
        pending={deleteSetting.isPending}
        destructive
        error={deleteSetting.isError ? t('settings.settingDelete.error') : null}
      />
    </div>
  );
}
