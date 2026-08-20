import { useEffect, useState } from "react";
import { CreditCard, Receipt } from "lucide-react";
import Card from "../common/Card";
import Button from "../common/Button";
import { useAuth } from "../../context/AuthContext";
import { getMySubscription } from "../../services/subscription.service";
import { getMyPayments } from "../../services/payment.service";
import type { Subscription } from "../../types/subscription";
import type { Payment } from "../../types/payment";
import { formatDateOnly } from "../../lib/date";

interface OverviewSectionProps {
  onNavigate: (tab: string) => void;
}

const OverviewSection = ({ onNavigate }: OverviewSectionProps) => {
  const { user } = useAuth();
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [lastPayment, setLastPayment] = useState<Payment | null>(null);
  const [isLoadingPayment, setIsLoadingPayment] = useState(true);

  useEffect(() => {
    getMySubscription()
      .then(setSubscription)
      .catch(() => setSubscription(null))
      .finally(() => setIsLoading(false));

    getMyPayments()
      .then((payments) => setLastPayment(payments[0] ?? null))
      .catch(() => setLastPayment(null))
      .finally(() => setIsLoadingPayment(false));
  }, []);

  return (
    <div className="space-y-6">
      <p className="font-body text-text-muted">
        Hola {user?.name}, este es el resumen de tu cuenta.
      </p>

      <div className="grid gap-6 sm:grid-cols-2">
        <Card className="hover:-translate-y-0 hover:shadow-lg">
          <div className="flex items-center gap-2 text-primary">
            <CreditCard className="h-5 w-5" />
            <h3 className="font-display text-sm font-semibold uppercase tracking-wide">Mi plan</h3>
          </div>
          {isLoading ? (
            <p className="mt-3 text-sm text-text-muted">Cargando...</p>
          ) : subscription ? (
            <>
              <p className="mt-3 font-display text-2xl font-bold text-text">
                {subscription.plan?.name ?? `Plan #${subscription.planId}`}
              </p>
              <p className="mt-1 text-sm text-text-muted">
                Vence el {formatDateOnly(subscription.endDate)}
              </p>
            </>
          ) : (
            <p className="mt-3 text-sm text-text-muted">No tenés un plan activo.</p>
          )}
          <Button
            variant="secondary"
            size="sm"
            className="mt-4"
            onClick={() => onNavigate("plan")}
          >
            {subscription ? "Cambiar plan" : "Elegir un plan"}
          </Button>
        </Card>

        <Card className="hover:-translate-y-0 hover:shadow-lg">
          <div className="flex items-center gap-2 text-primary">
            <Receipt className="h-5 w-5" />
            <h3 className="font-display text-sm font-semibold uppercase tracking-wide">
              Último pago
            </h3>
          </div>
          {isLoadingPayment ? (
            <p className="mt-3 text-sm text-text-muted">Cargando...</p>
          ) : lastPayment ? (
            <>
              <p className="mt-3 font-display text-2xl font-bold text-text">${lastPayment.amount}</p>
              <p className="mt-1 text-sm text-text-muted capitalize">
                {formatDateOnly(lastPayment.date.slice(0, 10))} · {lastPayment.payMethod}
              </p>
            </>
          ) : (
            <p className="mt-3 text-sm text-text-muted">Sin pagos registrados.</p>
          )}
          <Button
            variant="secondary"
            size="sm"
            className="mt-4"
            onClick={() => onNavigate("pagos")}
          >
            Ver historial
          </Button>
        </Card>
      </div>
    </div>
  );
};

export default OverviewSection;
