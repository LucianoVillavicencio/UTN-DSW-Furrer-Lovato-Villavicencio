import { useEffect, useState } from "react";
import { Loader2, AlertCircle } from "lucide-react";
import Card from "../common/Card";
import Button from "../common/Button";
import FormAlert from "../common/FormAlert";
import PlanCard from "../plans/PlanCard";
import {
  MEMBERSHIP_PLANS,
  enrichBackendPlan,
  type MembershipPlan,
} from "../plans/plans.data";
import { getPlans } from "../../services/plan.service";
import { getMySubscription, changePlan } from "../../services/subscription.service";
import type { Subscription } from "../../types/subscription";
import { formatDateOnly } from "../../lib/date";

const stateBadge: Record<string, string> = {
  activa: "bg-primary/10 text-primary border-primary/30",
  vencida: "bg-red-500/10 text-red-400 border-red-500/30",
  cancelada: "bg-text-muted/10 text-text-muted border-border",
};

const PlanSection = () => {
  const [plans, setPlans] = useState<MembershipPlan[]>([]);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [pendingPlan, setPendingPlan] = useState<MembershipPlan | null>(null);
  const [isChanging, setIsChanging] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  const load = async () => {
    setIsLoading(true);
    setLoadError(null);
    try {
      const [plansRes, subRes] = await Promise.allSettled([
        getPlans(),
        getMySubscription(),
      ]);

      if (plansRes.status === "fulfilled" && plansRes.value.length > 0) {
        setPlans(plansRes.value.map(enrichBackendPlan));
      } else {
        setPlans(MEMBERSHIP_PLANS);
      }

      setSubscription(subRes.status === "fulfilled" ? subRes.value : null);
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : "No se pudieron cargar los planes.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleSelect = (plan: MembershipPlan) => {
    setActionError(null);
    setActionSuccess(null);
    setPendingPlan(plan);
  };

  const confirmChange = async () => {
    if (!pendingPlan?.id) return;
    setIsChanging(true);
    setActionError(null);
    try {
      const updated = await changePlan(pendingPlan.id);
      setSubscription(updated);
      setActionSuccess(
        `Tu cambio de plan a "${pendingPlan.name}" fue registrado. Acercate al gimnasio para abonar.`,
      );
      setPendingPlan(null);
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "No se pudo cambiar de plan.");
    } finally {
      setIsChanging(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-48 flex-col items-center justify-center gap-3 text-text-muted">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm">Cargando tu plan...</p>
      </div>
    );
  }

  if (loadError) {
    return (
      <Card className="text-center hover:-translate-y-0 hover:shadow-lg">
        <AlertCircle className="mx-auto h-10 w-10 text-red-400" />
        <p className="mt-3 text-sm text-text-muted">{loadError}</p>
        <Button onClick={load} variant="secondary" size="sm" className="mt-4">
          Reintentar
        </Button>
      </Card>
    );
  }

  const currentPlanId = subscription?.planId;
  const currentState = (subscription?.state ?? "").toLowerCase();

  return (
    <div className="space-y-8">
      <FormAlert type="success" message={actionSuccess} />
      <FormAlert type="error" message={actionError} />

      <Card className="hover:-translate-y-0 hover:shadow-lg">
        <h3 className="font-display text-lg font-semibold text-text">Plan actual</h3>
        {subscription ? (
          <div className="mt-4 flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="font-display text-2xl font-bold text-text">
                {subscription.plan?.name ?? `Plan #${subscription.planId}`}
              </p>
              <p className="mt-1 text-sm text-text-muted">
                Vence el {formatDateOnly(subscription.endDate)}
              </p>
            </div>
            <span
              className={`rounded-full border px-3 py-1 text-xs font-semibold capitalize ${
                stateBadge[currentState] ?? stateBadge.cancelada
              }`}
            >
              {subscription.state ?? "Sin estado"}
            </span>
          </div>
        ) : (
          <p className="mt-3 text-sm text-text-muted">
            Todavía no tenés un plan activo. Elegí uno abajo para empezar.
          </p>
        )}
      </Card>

      <div>
        <h3 className="font-display text-lg font-semibold text-text">Cambiar de plan</h3>
        <div className="mt-4 grid gap-6 lg:grid-cols-3">
          {plans.map((plan) => (
            <PlanCard
              key={plan.id ?? plan.name}
              plan={plan}
              onSelect={handleSelect}
              isCurrentSubscription={!!plan.id && plan.id === currentPlanId && currentState === "activa"}
            />
          ))}
        </div>
      </div>

      {pendingPlan && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
        >
          <Card className="w-full max-w-sm hover:-translate-y-0 hover:shadow-lg">
            <h4 className="font-display text-lg font-semibold text-text">Confirmar cambio de plan</h4>
            <p className="mt-3 text-sm text-text-muted">
              Vas a pasar {subscription ? `de "${subscription.plan?.name ?? "tu plan actual"}" ` : ""}
              a <span className="font-semibold text-text">"{pendingPlan.name}"</span> ({pendingPlan.price}
              {pendingPlan.period}). El cambio queda registrado con el pago pendiente hasta que lo abones
              en el gimnasio.
            </p>
            <div className="mt-6 flex gap-3">
              <Button onClick={confirmChange} disabled={isChanging} className="flex-1">
                {isChanging ? "Confirmando..." : "Confirmar"}
              </Button>
              <Button
                variant="secondary"
                onClick={() => setPendingPlan(null)}
                disabled={isChanging}
              >
                Cancelar
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};

export default PlanSection;
