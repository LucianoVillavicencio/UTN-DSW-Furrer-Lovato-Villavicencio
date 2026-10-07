// Generic typed table used by every admin list (payments, classes, turnos,
// trainers, plans, users). Callers describe columns as a header plus a cell
// renderer; the table handles the loading row, the empty message and
// optional clickable rows, which get a trailing "Ver ›" cue and keyboard
// access.

import type { ReactNode } from 'react';
import { ChevronRight, Loader2, Inbox } from 'lucide-react';

export interface DataTableColumn<T> {
  header: string;
  cell: (row: T) => ReactNode;
  className?: string;
}

interface DataTableProps<T> {
  columns: DataTableColumn<T>[];
  rows: T[];
  rowKey: (row: T) => string | number;
  isLoading?: boolean;
  emptyMessage?: string;
  onRowClick?: (row: T) => void;
  // Text of the trailing "open" cue on clickable rows, e.g. "Ver ficha".
  rowActionLabel?: string;
}

function DataTable<T>({
  columns,
  rows,
  rowKey,
  isLoading = false,
  emptyMessage = 'No hay resultados.',
  onRowClick,
  rowActionLabel = 'Ver',
}: DataTableProps<T>) {
  const columnCount = columns.length + (onRowClick ? 1 : 0);

  return (
    <div className="overflow-x-auto rounded-2xl border border-border">
      <table className="w-full min-w-max text-left text-sm">
        <thead className="border-b border-border bg-surface">
          <tr>
            {columns.map((col) => (
              <th
                key={col.header}
                scope="col"
                className="px-5 py-3.5 font-body text-xs font-semibold uppercase tracking-wide text-text-muted"
              >
                {col.header}
              </th>
            ))}
            {onRowClick && (
              <th scope="col" className="px-5 py-3.5">
                <span className="sr-only">{rowActionLabel}</span>
              </th>
            )}
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {isLoading ? (
            <tr>
              <td
                colSpan={columnCount}
                className="px-5 py-10 text-center text-text-muted"
              >
                <Loader2 className="mx-auto h-6 w-6 animate-spin text-primary" />
              </td>
            </tr>
          ) : rows.length === 0 ? (
            <tr>
              <td
                colSpan={columnCount}
                className="px-5 py-10 text-center text-text-muted"
              >
                <Inbox className="mx-auto h-8 w-8 text-text-muted" />
                <p className="mt-2 text-sm">{emptyMessage}</p>
              </td>
            </tr>
          ) : (
            rows.map((row) => (
              <tr
                key={rowKey(row)}
                onClick={onRowClick ? () => onRowClick(row) : undefined}
                // A clickable row acts as a button, so it also takes focus and
                // answers Enter/Space like one — but only for keys pressed on
                // the row itself, not on a control inside one of its cells.
                tabIndex={onRowClick ? 0 : undefined}
                onKeyDown={
                  onRowClick
                    ? (e) => {
                        if (e.target !== e.currentTarget) return;
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          onRowClick(row);
                        }
                      }
                    : undefined
                }
                className={`group bg-background font-body text-text transition-colors ${
                  onRowClick
                    ? 'cursor-pointer hover:bg-surface-hover focus-visible:bg-surface-hover focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-primary'
                    : ''
                }`}
              >
                {columns.map((col) => (
                  <td
                    key={col.header}
                    className={`px-5 py-3.5 ${col.className ?? ''}`}
                  >
                    {col.cell(row)}
                  </td>
                ))}
                {onRowClick && (
                  <td className="px-5 py-3.5 text-right">
                    <span className="inline-flex items-center gap-1 text-xs font-semibold text-text-muted transition-colors group-hover:text-primary group-focus-visible:text-primary">
                      {rowActionLabel}
                      <ChevronRight
                        aria-hidden="true"
                        className="h-4 w-4 transition-transform group-hover:translate-x-0.5"
                      />
                    </span>
                  </td>
                )}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

export default DataTable;
