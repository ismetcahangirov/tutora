import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { Plus } from 'lucide-react';

import { ConfirmDialog, ErrorView, Page, PageHeader, TablePagination } from '@shared/components';
import { useDebouncedValue } from '@shared/hooks/useDebouncedValue';
import { Button, Card, Separator, Skeleton } from '@shared/ui';

import { ContentFilters } from '../components/ContentFilters';
import { ContentFormDialog } from '../components/ContentFormDialog';
import { ContentTable } from '../components/ContentTable';
import { ContentTypeTabs } from '../components/ContentTypeTabs';
import { CONTENT_PAGE_SIZE } from '../constants';
import { useContentQuery, useDeleteContent } from '../hooks/useContent';
import type { ContentEntry, ContentStatus, ContentType, ListContentParams } from '../types';

function TableSkeleton() {
  return (
    <div className="space-y-4 p-4">
      {Array.from({ length: 4 }).map((_, index) => (
        <div key={index} className="flex items-center gap-3">
          <Skeleton className="h-4 w-48" />
          <Skeleton className="h-4 w-12" />
          <Skeleton className="h-4 w-20" />
        </div>
      ))}
    </div>
  );
}

/**
 * Content management (#67): manage landing sections, FAQ, and blog posts across
 * a tab per content type, filterable by locale and publish state. Every change
 * is mirrored to the audit trail (#71), visible under the Logs section.
 */
export function ContentPage() {
  const { t } = useTranslation();

  const [type, setType] = useState<ContentType>('LANDING_SECTION');
  const [search, setSearch] = useState('');
  const [locale, setLocale] = useState<string | undefined>(undefined);
  const [status, setStatus] = useState<ContentStatus | undefined>(undefined);
  const [page, setPage] = useState(1);

  const [createOpen, setCreateOpen] = useState(false);
  const [editEntry, setEditEntry] = useState<ContentEntry | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ContentEntry | null>(null);

  const debouncedSearch = useDebouncedValue(search.trim(), 300);
  const deleteEntry = useDeleteContent();

  const params: ListContentParams = {
    page,
    limit: CONTENT_PAGE_SIZE,
    type,
    locale,
    status,
    q: debouncedSearch || undefined,
  };
  const { data, isLoading, isError, isFetching, refetch } = useContentQuery(params);

  const handleTypeChange = (next: ContentType) => {
    setType(next);
    setPage(1);
  };

  const handleClear = () => {
    setSearch('');
    setLocale(undefined);
    setStatus(undefined);
    setPage(1);
  };

  const handleDelete = () => {
    if (!deleteTarget) return;
    deleteEntry.mutate(deleteTarget.id, { onSuccess: () => setDeleteTarget(null) });
  };

  return (
    <Page>
      <PageHeader
        title={t('cms.title')}
        description={t('cms.subtitle')}
        actions={
          <Button size="sm" onClick={() => setCreateOpen(true)}>
            <Plus />
            {t('cms.add')}
          </Button>
        }
      />

      <div className="space-y-4">
        <ContentTypeTabs value={type} onChange={handleTypeChange} />

        <ContentFilters
          search={search}
          onSearchChange={(value) => {
            setSearch(value);
            setPage(1);
          }}
          locale={locale}
          onLocaleChange={(next) => {
            setLocale(next);
            setPage(1);
          }}
          status={status}
          onStatusChange={(next) => {
            setStatus(next);
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
              <ContentTable
                entries={data?.data ?? []}
                emptyLabel={t('cms.empty.title')}
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

      {createOpen ? (
        <ContentFormDialog entry={null} type={type} onOpenChange={setCreateOpen} />
      ) : null}

      {editEntry ? (
        <ContentFormDialog
          key={editEntry.id}
          entry={editEntry}
          type={editEntry.type}
          onOpenChange={(open) => !open && setEditEntry(null)}
        />
      ) : null}

      <ConfirmDialog
        open={deleteTarget !== null}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title={t('cms.delete.title')}
        description={t('cms.delete.description', { title: deleteTarget?.title ?? '' })}
        confirmLabel={t('common.delete')}
        onConfirm={handleDelete}
        pending={deleteEntry.isPending}
        destructive
        error={deleteEntry.isError ? t('cms.delete.error') : null}
      />
    </Page>
  );
}
