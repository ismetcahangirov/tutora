import { flexRender, getCoreRowModel, useReactTable, type ColumnDef } from '@tanstack/react-table';
import { useTranslation } from 'react-i18next';

import { Button, Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@shared/ui';

/**
 * Generic, headless-backed data table. The feature owns fetching, filtering, and
 * pagination (all server-side), so this component is purely presentational: give
 * it `columns` + the current page of `data` and it renders the grid. Shared
 * across every admin section that lists rows (#59).
 */
export function DataTable<TData>({
  columns,
  data,
  getRowId,
  emptyLabel,
}: {
  columns: ColumnDef<TData>[];
  data: TData[];
  /** Stable row id (defaults to the row index). */
  getRowId?: (row: TData) => string;
  /** Message shown as a spanning row when there are no rows. */
  emptyLabel?: string;
}) {
  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getRowId: getRowId ? (row) => getRowId(row) : undefined,
    manualPagination: true,
  });

  const rows = table.getRowModel().rows;

  return (
    <Table>
      <TableHeader>
        {table.getHeaderGroups().map((headerGroup) => (
          <TableRow key={headerGroup.id} className="hover:bg-transparent">
            {headerGroup.headers.map((header) => (
              <TableHead key={header.id}>
                {header.isPlaceholder
                  ? null
                  : flexRender(header.column.columnDef.header, header.getContext())}
              </TableHead>
            ))}
          </TableRow>
        ))}
      </TableHeader>
      <TableBody>
        {rows.length === 0 ? (
          <TableRow className="hover:bg-transparent">
            <TableCell
              colSpan={columns.length}
              className="py-10 text-center text-sm text-muted-foreground"
            >
              {emptyLabel}
            </TableCell>
          </TableRow>
        ) : (
          rows.map((row) => (
            <TableRow key={row.id}>
              {row.getVisibleCells().map((cell) => (
                <TableCell key={cell.id}>
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </TableCell>
              ))}
            </TableRow>
          ))
        )}
      </TableBody>
    </Table>
  );
}

/** Server-side pagination controls paired with {@link DataTable}. */
export function TablePagination({
  page,
  totalPages,
  total,
  onPageChange,
  disabled = false,
}: {
  page: number;
  totalPages: number;
  total: number;
  onPageChange: (page: number) => void;
  disabled?: boolean;
}) {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-sm text-muted-foreground">
        {t('table.total', { total })} · {t('table.page', { page, totalPages })}
      </p>
      <div className="flex items-center gap-2">
        <Button
          variant="secondary"
          size="sm"
          disabled={disabled || page <= 1}
          onClick={() => onPageChange(page - 1)}
        >
          {t('table.previous')}
        </Button>
        <Button
          variant="secondary"
          size="sm"
          disabled={disabled || page >= totalPages}
          onClick={() => onPageChange(page + 1)}
        >
          {t('table.next')}
        </Button>
      </div>
    </div>
  );
}
