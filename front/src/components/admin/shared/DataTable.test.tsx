// @vitest-environment jsdom
//
// render() needs a DOM; see PlanCard.test.tsx for why this is scoped per
// file rather than global.
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import DataTable, { type DataTableColumn } from './DataTable';

interface Row {
  id: number;
  name: string;
}

const columns: DataTableColumn<Row>[] = [
  { header: 'Nombre', cell: (r) => r.name },
];
const rows: Row[] = [{ id: 1, name: 'Ana' }];

afterEach(() => {
  cleanup();
});

describe('DataTable', () => {
  it('shows no row action when rows are not clickable', () => {
    render(<DataTable columns={columns} rows={rows} rowKey={(r) => r.id} />);
    expect(screen.queryByText('Ver')).toBeNull();
  });

  it('labels clickable rows with the row action', () => {
    render(
      <DataTable
        columns={columns}
        rows={rows}
        rowKey={(r) => r.id}
        onRowClick={() => {}}
        rowActionLabel="Ver ficha"
      />,
    );
    // Once as the header's screen-reader text, once in the row.
    expect(screen.getAllByText('Ver ficha')).toHaveLength(2);
  });

  it('opens a row with the keyboard', () => {
    const onRowClick = vi.fn();
    render(
      <DataTable
        columns={columns}
        rows={rows}
        rowKey={(r) => r.id}
        onRowClick={onRowClick}
      />,
    );
    const row = screen.getByText('Ana').closest('tr');
    if (!row) throw new Error('row not rendered');
    fireEvent.keyDown(row, { key: 'Enter' });
    expect(onRowClick).toHaveBeenCalledWith(rows[0]);
  });
});
