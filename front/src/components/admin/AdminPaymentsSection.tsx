import { useEffect, useState } from "react";
import Card from "../common/Card";
import DataTable, { type DataTableColumn } from "./DataTable";
import RegisterPaymentForm from "./RegisterPaymentForm";
import { getPayments } from "../../services/payment.service";
import { formatDateOnly } from "../../lib/date";
import { formatPriceDisplay } from "../../lib/currency";
import type { Payment } from "../../types/payment";

const AdminPaymentsSection = () => {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const load = async () => {
    setIsLoading(true);
    setLoadError(null);
    try {
      const data = await getPayments();
      setPayments(data.sort((a, b) => (a.date < b.date ? 1 : -1)));
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : "No se pudo cargar el historial.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const columns: DataTableColumn<Payment>[] = [
    { header: "Fecha", cell: (p) => formatDateOnly(p.date.slice(0, 10)) },
    {
      header: "Socio",
      cell: (p) =>
        p.subscription?.user ? `${p.subscription.user.name} ${p.subscription.user.surname}` : "—",
    },
    { header: "Monto", cell: (p) => `$${formatPriceDisplay(p.amount)}` },
    { header: "Método", cell: (p) => p.payMethod },
    { header: "Registrado por", cell: (p) => (p.registeredByDni ? `DNI ${p.registeredByDni}` : "—") },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h3 className="font-display text-lg font-semibold text-text">Registrar pago presencial</h3>
        <Card className="mt-4 hover:-translate-y-0 hover:shadow-lg">
          <RegisterPaymentForm onRegistered={load} />
        </Card>
      </div>

      <div>
        <h3 className="font-display text-lg font-semibold text-text">Pagos recientes</h3>
        <div className="mt-4">
          {loadError && <p className="mb-3 text-sm text-red-400">{loadError}</p>}
          <DataTable
            columns={columns}
            rows={payments.slice(0, 25)}
            rowKey={(p) => p.id ?? Math.random()}
            isLoading={isLoading}
            emptyMessage="Todavía no hay pagos registrados."
          />
        </div>
      </div>
    </div>
  );
};

export default AdminPaymentsSection;
