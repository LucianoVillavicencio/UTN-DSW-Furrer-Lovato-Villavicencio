// Client-side paging for the admin lists that load every row at once
// (classes, turnos, trainers). Pure so it can be unit-tested; usePagination
// wraps it with the page state. Unit-tested in pagination.test.ts.

export interface PageWindow<T> {
  pageRows: T[];
  // 1-based, already clamped to [1, pageCount].
  page: number;
  pageCount: number;
  // 1-based positions of the first and last row shown; both 0 when empty.
  from: number;
  to: number;
  total: number;
  hasPrevious: boolean;
  hasNext: boolean;
}

/**
 * Slices `rows` to the requested page. An out-of-range page is clamped, so a
 * list that shrank (a delete on the last page) shows its new last page.
 */
export function paginate<T>(
  rows: T[],
  page: number,
  pageSize: number,
): PageWindow<T> {
  const total = rows.length;
  const pageCount = Math.max(1, Math.ceil(total / pageSize));
  const current = Math.min(Math.max(1, page), pageCount);
  const start = (current - 1) * pageSize;
  const pageRows = rows.slice(start, start + pageSize);

  return {
    pageRows,
    page: current,
    pageCount,
    from: total === 0 ? 0 : start + 1,
    to: start + pageRows.length,
    total,
    hasPrevious: current > 1,
    hasNext: current < pageCount,
  };
}
