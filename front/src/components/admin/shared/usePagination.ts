// Page state for a client-side paginated admin list: keeps the requested page
// and derives the visible slice with paginate(). Sections call resetPage()
// when their filter changes (e.g. "Mostrar eliminados").

import { useState } from 'react';
import { paginate, type PageWindow } from './pagination';

export interface Pagination<T> extends PageWindow<T> {
  goPrevious: () => void;
  goNext: () => void;
  resetPage: () => void;
}

export function usePagination<T>(rows: T[], pageSize: number): Pagination<T> {
  const [requestedPage, setRequestedPage] = useState(1);
  const current = paginate(rows, requestedPage, pageSize);

  // Steps from the clamped page, not the requested one: after the list
  // shrinks, "Anterior" must go to the page before the one on screen.
  return {
    ...current,
    goPrevious: () => setRequestedPage(current.page - 1),
    goNext: () => setRequestedPage(current.page + 1),
    resetPage: () => setRequestedPage(1),
  };
}
