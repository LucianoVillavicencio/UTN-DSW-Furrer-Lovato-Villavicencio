import { useEffect, useState } from 'react';
import { Receipt } from 'lucide-react';
import Button from '../common/Button';
import Card from '../common/Card';
import DataTable, { type DataTableColumn } from './DataTable';
import SectionHeader from './SectionHeader';
import PlanChargeForm from './PlanChargeForm';
import MemberSearchField from './MemberSearchField';
import { getPayments } from '../../services/payment.service';
import { formatPaymentDate } from '../../lib/payment-date';
import { formatPriceDisplay } from '../../lib/currency';
import type { AdminPayment, PaymentPage } from '../../types/payment';
import type { User } from '../../types/user';

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
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
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
        <h4 className="font-display text-xl font-semibold text-text">
          Cobrar un plan
        </h4>
        <Card className="relative mt-4 overflow-hidden p-8 hover:translate-y-0 hover:shadow-lg">
          <span
            aria-hidden="true"
            className="absolute inset-x-0 top-0 h-0.5 bg-primary"
          />
          {selectedUser ? (
            <PlanChargeForm
              selectedUser={selectedUser}
              onRegistered={reload}
              onChangeMember={() => setSelectedUser(null)}
            />
          ) : (
            <MemberSearchField onSelect={setSelectedUser} />
          )}
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
          <div className="mt-3 flex items-center justify-between">
            <p className="text-xs text-text-muted">
              Mostrando {from}-{to} de {page.total}
            </p>
            <div className="flex gap-2">
              <Button
                variant="secondary"
                size="sm"
                disabled={!hasPrevious}
                onClick={() => setOffset(Math.max(0, offset - PAGE_SIZE))}
              >
                Anterior
              </Button>
              <Button
                variant="secondary"
                size="sm"
                disabled={!hasNext}
                onClick={() => setOffset(offset + PAGE_SIZE)}
              >
                Siguiente
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminPaymentsSection;
