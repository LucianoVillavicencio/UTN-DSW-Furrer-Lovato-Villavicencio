import { useEffect, useState } from 'react';
import { Info, Receipt, Loader2 } from 'lucide-react';
import Card from '../common/Card';
import { getMyPayments } from '../../services/payment.service';
import { formatDateOnly } from '../../lib/date';
import { formatPriceDisplay } from '../../lib/currency';
import type { Payment } from '../../types/payment';

const stateBadge: Record<string, string> = {
  completado: 'bg-primary/10 text-primary border-primary/30',
  pendiente: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
  rechazado: 'bg-red-500/10 text-red-400 border-red-500/30',
  reembolsado: 'bg-text-muted/10 text-text-muted border-border',
};

const PaymentsSection = () => {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getMyPayments()
      .then(setPayments)
      .catch((err) =>
        setError(
          err instanceof Error
            ? err.message
            : 'No se pudo cargar tu historial.',
        ),
      )
      .finally(() => setIsLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-start gap-3 rounded-xl border border-primary/30 bg-primary/10 p-3.5 text-sm text-primary">
        <Info className="h-5 w-5 shrink-0 mt-0.5" />
        <span>Los pagos online estarán disponibles próximamente.</span>
      </div>

      {isLoading ? (
        <div className="flex h-32 items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      ) : error ? (
        <Card className="text-center hover:-translate-y-0 hover:shadow-lg">
          <p className="text-sm text-red-400">{error}</p>
        </Card>
      ) : payments.length === 0 ? (
        <Card className="text-center hover:-translate-y-0 hover:shadow-lg">
          <Receipt className="mx-auto h-10 w-10 text-text-muted" />
          <p className="mt-3 font-body text-sm text-text-muted">
            Todavía no tenés pagos registrados. Los pagos presenciales que
            registre el gimnasio van a aparecer acá.
          </p>
        </Card>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-border">
          <table className="w-full min-w-max text-left text-sm">
            <thead className="bg-surface">
              <tr>
                {['Fecha', 'Monto', 'Método', 'Estado'].map((h) => (
                  <th
                    key={h}
                    className="px-4 py-3 font-body text-xs font-semibold uppercase tracking-wide text-text-muted"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {payments.map((p) => (
                <tr key={p.id} className="bg-background font-body text-text">
                  <td className="px-4 py-3">
                    {formatDateOnly(p.date.slice(0, 10))}
                  </td>
                  <td className="px-4 py-3">${formatPriceDisplay(p.amount)}</td>
                  <td className="px-4 py-3 capitalize">{p.payMethod}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-full border px-2 py-0.5 text-xs font-semibold capitalize ${
                        stateBadge[p.state?.toLowerCase() ?? ''] ??
                        stateBadge.completado
                      }`}
                    >
                      {p.state}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Card className="relative overflow-hidden opacity-70 hover:-translate-y-0 hover:shadow-lg">
        <span className="absolute right-4 top-4 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
          Próximamente
        </span>
        <h3 className="font-display text-lg font-semibold text-text">
          Forma de pago
        </h3>
        <p className="mt-2 text-sm text-text-muted">
          Renovación automática, método de pago guardado y pagos recurrentes vía
          Mercado Pago.
        </p>
      </Card>
    </div>
  );
};

export default PaymentsSection;
