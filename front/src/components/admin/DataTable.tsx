import type { ReactNode } from 'react';
import { Loader2, Inbox } from 'lucide-react';

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
}

function DataTable<T>({
  columns,
  rows,
  rowKey,
  isLoading = false,
  emptyMessage = 'No hay resultados.',
  onRowClick,
}: DataTableProps<T>) {
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
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {isLoading ? (
            <tr>
              <td
                colSpan={columns.length}
                className="px-5 py-10 text-center text-text-muted"
              >
                <Loader2 className="mx-auto h-6 w-6 animate-spin text-primary" />
              </td>
            </tr>
          ) : rows.length === 0 ? (
            <tr>
              <td
                colSpan={columns.length}
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
                className={`bg-background font-body text-text transition-colors ${
                  onRowClick ? 'cursor-pointer hover:bg-surface-hover' : ''
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
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

export default DataTable;
