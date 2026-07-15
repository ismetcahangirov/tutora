import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { Plus } from 'lucide-react';

import { ConfirmDialog, ErrorView, Page, PageHeader, TablePagination } from '@shared/components';
import { useDebouncedValue } from '@shared/hooks/useDebouncedValue';
import { Button, Card, Separator, Skeleton } from '@shared/ui';

import { TranslationFilters } from '../components/TranslationFilters';
import { TranslationFormDialog } from '../components/TranslationFormDialog';
import { TranslationTable } from '../components/TranslationTable';
import { TRANSLATIONS_PAGE_SIZE } from '../constants';
import { useDeleteTranslation, useTranslationsQuery } from '../hooks/useTranslations';
import type { ListTranslationsParams, Translation } from '../types';

function TableSkeleton() {
  return (
    <div className="space-y-4 p-4">
      {Array.from({ length: 4 }).map((_, index) => (
        <div key={index} className="flex items-center gap-3">
          <Skeleton className="h-4 w-48" />
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-4 w-24" />
        </div>
      ))}
    </div>
  );
}

/**
 * Translation management (#85): manage the over-the-air localization layer — a
 * key per row with per-locale copy, filterable by namespace and key. Every
 * change is mirrored to the audit trail (#71), visible under the Logs section.
 */
export function TranslationsPage() {
  const { t } = useTranslation();

  const [search, setSearch] = useState('');
  const [namespace, setNamespace] = useState('');
  const [page, setPage] = useState(1);

  const [createOpen, setCreateOpen] = useState(false);
  const [editEntry, setEditEntry] = useState<Translation | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Translation | null>(null);

  const debouncedSearch = useDebouncedValue(search.trim(), 300);
  const debouncedNamespace = useDebouncedValue(namespace.trim(), 300);
  const deleteEntry = useDeleteTranslation();

  const params: ListTranslationsParams = {
    page,
    limit: TRANSLATIONS_PAGE_SIZE,
    namespace: debouncedNamespace || undefined,
    q: debouncedSearch || undefined,
  };
  const { data, isLoading, isError, isFetching, refetch } = useTranslationsQuery(params);

  const handleClear = () => {
    setSearch('');
    setNamespace('');
    setPage(1);
  };

  const handleDelete = () => {
    if (!deleteTarget) return;
    deleteEntry.mutate(deleteTarget.id, { onSuccess: () => setDeleteTarget(null) });
  };

  return (
    <Page>
      <PageHeader
        title={t('translations.title')}
        description={t('translations.subtitle')}
        actions={
          <Button size="sm" onClick={() => setCreateOpen(true)}>
            <Plus />
            {t('translations.add')}
          </Button>
        }
      />

      <div className="space-y-4">
        <TranslationFilters
          search={search}
          onSearchChange={(value) => {
            setSearch(value);
            setPage(1);
          }}
          namespace={namespace}
          onNamespaceChange={(value) => {
            setNamespace(value);
            setPage(1);
          }}
          onClear={handleClear}
        />

        <Card className="overflow-hidden">
          {isError ? (
            <ErrorView onRetry={() => void refetch()} />
          ) : isLoading ? (
            <TableSkeleton />
          ) : (
            <>
              <TranslationTable
                translations={data?.data ?? []}
                emptyLabel={t('translations.empty.title')}
                onEdit={setEditEntry}
                onDelete={setDeleteTarget}
              />
              {data ? (
                <>
                  <Separator />
                  <TablePagination
                    page={data.meta.page}
                    totalPages={data.meta.totalPages}
                    total={data.meta.total}
                    onPageChange={setPage}
                    disabled={isFetching}
                  />
                </>
              ) : null}
            </>
          )}
        </Card>
      </div>

      {createOpen ? <TranslationFormDialog entry={null} onOpenChange={setCreateOpen} /> : null}

      {editEntry ? (
        <TranslationFormDialog
          key={editEntry.id}
          entry={editEntry}
          onOpenChange={(open) => !open && setEditEntry(null)}
        />
      ) : null}

      <ConfirmDialog
        open={deleteTarget !== null}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title={t('translations.delete.title')}
        description={t('translations.delete.description', {
          key: deleteTarget ? `${deleteTarget.namespace}.${deleteTarget.key}` : '',
        })}
        confirmLabel={t('common.delete')}
        onConfirm={handleDelete}
        pending={deleteEntry.isPending}
        destructive
        error={deleteEntry.isError ? t('translations.delete.error') : null}
      />
    </Page>
  );
}
