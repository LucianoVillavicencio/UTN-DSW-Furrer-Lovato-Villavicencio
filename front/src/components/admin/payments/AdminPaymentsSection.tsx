// "Pagos presenciales" tab of the admin dashboard. Top: ChargePanel to charge
// a member at the counter. Bottom: paginated history of all payments (date,
// member, amount, method, who registered it), reloaded after each charge.

import { useEffect, useState } from 'react';
import { Receipt } from 'lucide-react';
import Card from '../../common/Card';
import DataTable, { type DataTableColumn } from '../shared/DataTable';
import PaginationFooter from '../shared/PaginationFooter';
import ChargePanel from './ChargePanel';
import SectionHeader from '../shared/SectionHeader';
import { getPayments } from '../../../services/payment.service';
import { formatPaymentDate } from '../../../lib/payment-date';
import { formatPriceDisplay } from '../../../lib/currency';
import type { AdminPayment, PaymentPage } from '../../../types/payment';

const PAGE_SIZE = 25;

const columns: DataTableColumn<AdminPayment>[] = [
  { header: 'Fecha', cell: (p) => formatPaymentDate(p.date) },
  {
    header: 'Socio',
    cell: (p) =>
      p.subscription?.user
        ? `${p.subscription.user.name} ${p.subscription.user.surname}`
        : '—',
  },
  { header: 'Monto', cell: (p) => `$${formatPriceDisplay(p.amount)}` },
  { header: 'Método', cell: (p) => p.payMethod },
  {
    header: 'Registrado por',
    cell: (p) => p.registeredByName ?? '—',
  },
];

const AdminPaymentsSection = () => {
  const [page, setPage] = useState<PaymentPage>({ items: [], total: 0 });
  const [offset, setOffset] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Every setState lives in an async callback, so the effect below only starts
  // the request instead of updating state while React renders.
  const fetchPayments = (nextOffset: number) =>
    getPayments({ limit: PAGE_SIZE, offset: nextOffset })
      .then((data) => {
        setPage(data);
        setLoadError(null);
      })
      .catch((err: unknown) => {
        setLoadError(
          err instanceof Error ? err.message : 'No se pudo cargar el historial.',
        );
      })
      .finally(() => setIsLoading(false));

  useEffect(() => {
    void fetchPayments(offset);
  }, [offset]);

  const reload = () => {
    setIsLoading(true);
    setOffset(0);
    return fetchPayments(0);
  };

  const from = page.total === 0 ? 0 : offset + 1;
  const to = Math.min(offset + page.items.length, page.total);
  const hasPrevious = offset > 0;
  const hasNext = offset + PAGE_SIZE < page.total;

  return (
    <div className="space-y-10">
      <SectionHeader
        title="Pagos presenciales"
        icon={Receipt}
        description="Cobros en el mostrador e historial de pagos."
      />

      {/* This is the screen an admin opens fifty times a day, so it gets the
          panel's one accent motif and more generous spacing than the other
          five tabs — quick maintenance elsewhere, the counter here. */}
      <div>
        <h3 className="font-display text-lg font-semibold text-text">
          Cobrar a un socio
        </h3>
        <Card className="relative mt-4 overflow-hidden p-8 hover:translate-y-0 hover:shadow-lg">
          <span
            aria-hidden="true"
            className="absolute inset-x-0 top-0 h-0.5 bg-primary"
          />
          <ChargePanel onCharged={reload} />
        </Card>
      </div>

      <div>
        <h4 className="font-display text-lg font-semibold text-text">
          Pagos recientes
        </h4>
        <div className="mt-4">
          {loadError && (
            <p className="mb-3 text-sm text-red-400">{loadError}</p>
          )}
          <DataTable
            columns={columns}
            rows={page.items}
            rowKey={(p) => p.id}
            isLoading={isLoading}
            emptyMessage="Todavía no hay pagos registrados."
          />
          <PaginationFooter
            from={from}
            to={to}
            total={page.total}
            hasPrevious={hasPrevious}
            hasNext={hasNext}
            onPrevious={() => setOffset(Math.max(0, offset - PAGE_SIZE))}
            onNext={() => setOffset(offset + PAGE_SIZE)}
          />
        </div>
      </div>
    </div>
  );
};

export default AdminPaymentsSection;
