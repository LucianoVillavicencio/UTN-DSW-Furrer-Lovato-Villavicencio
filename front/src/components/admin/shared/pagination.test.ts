import { describe, expect, it } from 'vitest';
import { paginate } from './pagination';

const rows = Array.from({ length: 12 }, (_, i) => i + 1);

describe('paginate', () => {
  it('returns the first page', () => {
    const page = paginate(rows, 1, 5);
    expect(page.pageRows).toEqual([1, 2, 3, 4, 5]);
    expect(page).toMatchObject({
      page: 1,
      pageCount: 3,
      from: 1,
      to: 5,
      total: 12,
      hasPrevious: false,
      hasNext: true,
    });
  });

  it('returns a partial last page', () => {
    const page = paginate(rows, 3, 5);
    expect(page.pageRows).toEqual([11, 12]);
    expect(page).toMatchObject({
      from: 11,
      to: 12,
      hasPrevious: true,
      hasNext: false,
    });
  });

  it('clamps a page past the end to the last page', () => {
    expect(paginate(rows, 9, 5).page).toBe(3);
  });

  it('clamps a page below 1 to the first page', () => {
    expect(paginate(rows, 0, 5).page).toBe(1);
  });

  it('reports an empty list as one empty page', () => {
    expect(paginate([], 1, 5)).toEqual({
      pageRows: [],
      page: 1,
      pageCount: 1,
      from: 0,
      to: 0,
      total: 0,
      hasPrevious: false,
      hasNext: false,
    });
  });
});
