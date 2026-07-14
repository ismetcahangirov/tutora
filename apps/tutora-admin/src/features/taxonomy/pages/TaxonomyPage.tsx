import { Plus } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { ConfirmDialog, ErrorView, Page, PageHeader } from '@shared/components';
import { Button, Card, Input, Skeleton } from '@shared/ui';

import { TaxonomyFormDialog } from '../components/TaxonomyFormDialog';
import { TaxonomyTable } from '../components/TaxonomyTable';
import { TaxonomyTabs } from '../components/TaxonomyTabs';
import { useTaxonomyQuery } from '../hooks/useTaxonomy';
import { useDeleteTaxonomyItem } from '../hooks/useTaxonomyMutations';
import { TAXONOMY_CONFIGS, type TaxonomyItem, type TaxonomyKind } from '../types';

/** Loading placeholder that mirrors the table's row rhythm. */
function TableSkeleton() {
  return (
    <div className="space-y-4 p-4">
      {Array.from({ length: 6 }).map((_, index) => (
        <div key={index} className="flex items-center gap-3">
          <Skeleton className="h-4 w-40" />
          <Skeleton className="h-4 w-24" />
        </div>
      ))}
    </div>
  );
}

/** Taxonomy management (#65): CRUD for categories, subjects, districts, languages. */
export function TaxonomyPage() {
  const { t } = useTranslation();

  const [kind, setKind] = useState<TaxonomyKind>('subjects');
  const [search, setSearch] = useState('');
  const [createOpen, setCreateOpen] = useState(false);
  const [editItem, setEditItem] = useState<TaxonomyItem | null>(null);
  const [deleteItem, setDeleteItem] = useState<TaxonomyItem | null>(null);

  const config = TAXONOMY_CONFIGS[kind];
  const { data, isLoading, isError, refetch } = useTaxonomyQuery(kind);
  // Categories are needed for the subject form's options and to resolve a
  // subject's category name in the table. Cached and cheap, so always loaded.
  const { data: categories } = useTaxonomyQuery('categories');
  const remove = useDeleteTaxonomyItem(kind);

  const categoryNameById = useMemo(
    () => new Map((categories ?? []).map((category) => [category.id, category.name])),
    [categories],
  );

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    const items = data ?? [];
    if (!query) return items;
    return items.filter(
      (item) =>
        item.name.toLowerCase().includes(query) ||
        (item.slug ?? item.code ?? '').toLowerCase().includes(query),
    );
  }, [data, search]);

  const handleKind = (next: TaxonomyKind) => {
    setKind(next);
    setSearch('');
  };

  const confirmDelete = () => {
    if (!deleteItem) return;
    remove.mutate(deleteItem.id, { onSuccess: () => setDeleteItem(null) });
  };

  return (
    <Page>
      <PageHeader
        title={t('taxonomy.title')}
        description={t('taxonomy.subtitle')}
        actions={
          <Button size="sm" onClick={() => setCreateOpen(true)}>
            <Plus />
            {t('taxonomy.add', { kind: t(`taxonomy.singular.${kind}`) })}
          </Button>
        }
      />

      <div className="space-y-4">
        <TaxonomyTabs value={kind} onChange={handleKind} />

        <Input
          type="search"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder={t('taxonomy.search')}
          aria-label={t('taxonomy.search')}
          className="sm:max-w-xs"
        />

        <Card className="overflow-hidden">
          {isError ? (
            <ErrorView onRetry={() => void refetch()} />
          ) : isLoading ? (
            <TableSkeleton />
          ) : (
            <TaxonomyTable
              items={filtered}
              config={config}
              categoryNameById={categoryNameById}
              emptyLabel={t('taxonomy.empty.title')}
              onEdit={setEditItem}
              onDelete={setDeleteItem}
            />
          )}
        </Card>
      </div>

      {createOpen ? (
        <TaxonomyFormDialog
          kind={kind}
          config={config}
          item={null}
          categories={categories ?? []}
          onOpenChange={setCreateOpen}
        />
      ) : null}

      {editItem ? (
        <TaxonomyFormDialog
          key={editItem.id}
          kind={kind}
          config={config}
          item={editItem}
          categories={categories ?? []}
          onOpenChange={(open) => !open && setEditItem(null)}
        />
      ) : null}

      {deleteItem ? (
        <ConfirmDialog
          open
          onOpenChange={(open) => !open && setDeleteItem(null)}
          title={t('taxonomy.delete.title')}
          description={t('taxonomy.delete.description', { name: deleteItem.name })}
          confirmLabel={t('taxonomy.delete.confirm')}
          onConfirm={confirmDelete}
          pending={remove.isPending}
          destructive
          error={remove.isError ? t('taxonomy.delete.error') : null}
        />
      ) : null}
    </Page>
  );
}
