import type { ColumnDef } from '@tanstack/react-table';
import { MoreHorizontal, Pencil, Trash2 } from 'lucide-react';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import { DataTable } from '@shared/components';
import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@shared/ui';

import type { TaxonomyItem, TaxonomyKindConfig } from '../types';

type TaxonomyTableProps = {
  items: TaxonomyItem[];
  config: TaxonomyKindConfig;
  /** Resolves a subject's `categoryId` to a display name. */
  categoryNameById: Map<string, string>;
  onEdit: (item: TaxonomyItem) => void;
  onDelete: (item: TaxonomyItem) => void;
  emptyLabel: string;
};

/** Per-row action menu: edit or delete. */
function RowActions({
  item,
  onEdit,
  onDelete,
}: {
  item: TaxonomyItem;
  onEdit: (item: TaxonomyItem) => void;
  onDelete: (item: TaxonomyItem) => void;
}) {
  const { t } = useTranslation();
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" aria-label={t('taxonomy.actions.menu')}>
          <MoreHorizontal />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuItem onSelect={() => onEdit(item)}>
          <Pencil />
          {t('taxonomy.actions.edit')}
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onSelect={() => onDelete(item)}
          className="text-destructive focus:text-destructive"
        >
          <Trash2 />
          {t('taxonomy.actions.delete')}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

/** Generic taxonomy grid. Columns adapt to the kind's config. */
export function TaxonomyTable({
  items,
  config,
  categoryNameById,
  onEdit,
  onDelete,
  emptyLabel,
}: TaxonomyTableProps) {
  const { t } = useTranslation();

  const columns = useMemo<ColumnDef<TaxonomyItem>[]>(() => {
    const cols: ColumnDef<TaxonomyItem>[] = [
      {
        id: 'name',
        header: t('taxonomy.columns.name'),
        cell: ({ row }) => (
          <span className="text-sm font-medium text-foreground">{row.original.name}</span>
        ),
      },
      {
        id: 'identifier',
        header: t(config.field === 'code' ? 'taxonomy.columns.code' : 'taxonomy.columns.slug'),
        cell: ({ row }) => (
          <code className="rounded bg-muted px-1.5 py-0.5 text-xs text-muted-foreground">
            {row.original.slug ?? row.original.code}
          </code>
        ),
      },
    ];

    if (config.hasCategory) {
      cols.push({
        id: 'category',
        header: t('taxonomy.columns.category'),
        cell: ({ row }) => {
          const { categoryId } = row.original;
          const name = categoryId ? categoryNameById.get(categoryId) : undefined;
          return <span className="text-sm text-muted-foreground">{name ?? '—'}</span>;
        },
      });
    }

    cols.push({
      id: 'actions',
      header: () => <span className="sr-only">{t('taxonomy.columns.actions')}</span>,
      cell: ({ row }) => (
        <div className="flex justify-end">
          <RowActions item={row.original} onEdit={onEdit} onDelete={onDelete} />
        </div>
      ),
    });

    return cols;
  }, [t, config.field, config.hasCategory, categoryNameById, onEdit, onDelete]);

  return (
    <DataTable
      columns={columns}
      data={items}
      getRowId={(item) => item.id}
      emptyLabel={emptyLabel}
    />
  );
}
