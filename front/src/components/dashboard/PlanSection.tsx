import { useEffect, useState } from 'react';
import { Loader2, AlertCircle } from 'lucide-react';
import Card from '../common/Card';
import Button from '../common/Button';
import FormAlert from '../common/FormAlert';
import PlanCard from '../plans/PlanCard';
import { enrichBackendPlan, type MembershipPlan } from '../plans/plans.data';
import { termSavings } from './saved-card';
import { getPlans } from '../../services/plan.service';
import { getPlanTermsForPlan } from '../../services/planTerm.service';
import {
  getMySubscription,
  changePlan,
} from '../../services/subscription.service';
import type { Subscription } from '../../types/subscription';
import type { PlanTerm } from '../../types/planTerm';
import { formatDateOnly } from '../../lib/date';
import { formatPriceDisplay } from '../../lib/currency';

const stateBadge: Record<string, string> = {
  activa: 'bg-primary/10 text-primary border-primary/30',
  pendiente: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
  vencida: 'bg-red-500/10 text-red-400 border-red-500/30',
  cancelada: 'bg-text-muted/10 text-text-muted border-border',
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

  const [terms, setTerms] = useState<PlanTerm[]>([]);
  const [selectedTermId, setSelectedTermId] = useState<number | null>(null);

  // Every setState lives in an async callback, so the effect below only starts
  // the requests instead of updating state while React renders.
  const fetchPlans = () =>
    Promise.allSettled([getPlans(), getMySubscription()])
      .then(([plansRes, subRes]) => {
        // No hardcoded fallback: showing invented plans hid the failure and let
        // people pick a plan that does not exist in the backend.
        if (plansRes.status === 'fulfilled') {
          setPlans(plansRes.value.map(enrichBackendPlan));
        } else {
          setPlans([]);
          setLoadError(
            plansRes.reason instanceof Error
              ? plansRes.reason.message
              : 'No se pudieron cargar los planes.',
          );
        }

        setSubscription(subRes.status === 'fulfilled' ? subRes.value : null);
      })
      .catch((err: unknown) => {
        setLoadError(
          err instanceof Error
            ? err.message
            : 'No se pudieron cargar los planes.',
        );
      })
      .finally(() => setIsLoading(false));

  useEffect(() => {
    void fetchPlans();
  }, []);

  // Fetches the discounted terms for whichever plan is pending confirmation.
  // A failed or empty fetch does not block the confirm flow — it just leaves
  // `terms` empty, and confirmChange falls back to the 1-month default.
  // Clearing `terms`/`selectedTermId` when the dialog closes or switches plans
  // happens at the call sites below (handleSelect, the Cancel button,
  // confirmChange) rather than here, so this effect never calls setState
  // synchronously in its body — only from the fetch's own callbacks.
  useEffect(() => {
    if (!pendingPlan?.id) return;

    let cancelled = false;
    getPlanTermsForPlan(pendingPlan.id)
      .then((fetched) => {
        if (cancelled) return;
        setTerms(fetched);
        // No API-side notion of a "default" term, so the first one returned
        // (typically the cheapest / shortest) is picked as a reasonable
        // default rather than leaving the selection empty.
        setSelectedTermId(fetched.length > 0 ? fetched[0].id : null);
      })
      .catch(() => {
        if (cancelled) return;
        setTerms([]);
        setSelectedTermId(null);
      });

    return () => {
      cancelled = true;
    };
  }, [pendingPlan?.id]);

  const reload = () => {
    setIsLoading(true);
    setLoadError(null);
    void fetchPlans();
  };

  const handleSelect = (plan: MembershipPlan) => {
    setActionError(null);
    setActionSuccess(null);
    setTerms([]);
    setSelectedTermId(null);
    setPendingPlan(plan);
  };

  const confirmChange = async () => {
    if (!pendingPlan?.id) return;
    setIsChanging(true);
    setActionError(null);
    try {
      const updated = await changePlan(
        pendingPlan.id,
        selectedTermId ?? undefined,
      );
      setSubscription(updated);
      setActionSuccess(
        `Tu cambio de plan a "${pendingPlan.name}" quedó pendiente. Acercate al gimnasio para abonarlo: el plan se activa cuando registremos tu pago, y mientras tanto seguís con tu plan actual.`,
      );
      setPendingPlan(null);
      setTerms([]);
      setSelectedTermId(null);
    } catch (err) {
      setActionError(
        err instanceof Error ? err.message : 'No se pudo cambiar de plan.',
      );
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
      <Card className="text-center hover:translate-y-0 hover:shadow-lg">
        <AlertCircle className="mx-auto h-10 w-10 text-red-400" />
        <p className="mt-3 text-sm text-text-muted">{loadError}</p>
        <Button onClick={reload} variant="secondary" size="sm" className="mt-4">
          Reintentar
        </Button>
      </Card>
    );
  }

  const currentPlanId = subscription?.planId;
  const currentState = (subscription?.state ?? '').toLowerCase();

  return (
    <div className="space-y-8">
      <FormAlert type="success" message={actionSuccess} />
      <FormAlert type="error" message={actionError} />

      <Card className="hover:translate-y-0 hover:shadow-lg">
        <h3 className="font-display text-lg font-semibold text-text">
          Plan actual
        </h3>
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
              {subscription.state ?? 'Sin estado'}
            </span>
          </div>
        ) : (
          <p className="mt-3 text-sm text-text-muted">
            Todavía no tenés un plan activo. Elegí uno abajo para empezar.
          </p>
        )}
      </Card>

      <div>
        <h3 className="font-display text-lg font-semibold text-text">
          Cambiar de plan
        </h3>
        {plans.length === 0 ? (
          <Card className="mt-4 text-center hover:translate-y-0 hover:shadow-lg">
            <p className="text-sm text-text-muted">
              No hay planes disponibles en este momento. Consultá en el gimnasio
              por las opciones vigentes.
            </p>
          </Card>
        ) : (
          <div className="mt-4 grid gap-6 lg:grid-cols-3">
            {plans.map((plan) => (
              <PlanCard
                key={plan.id ?? plan.name}
                plan={plan}
                onSelect={handleSelect}
                isCurrentSubscription={
                  !!plan.id &&
                  plan.id === currentPlanId &&
                  currentState === 'activa'
                }
              />
            ))}
          </div>
        )}
      </div>

      {pendingPlan && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
        >
          <Card className="w-full max-w-md hover:translate-y-0 hover:shadow-lg">
            <h4 className="font-display text-lg font-semibold text-text">
              Confirmar cambio de plan
            </h4>
            <p className="mt-3 text-sm text-text-muted">
              Vas a pasar{' '}
              {subscription
                ? `de "${subscription.plan?.name ?? 'tu plan actual'}" `
                : ''}
              a{' '}
              <span className="font-semibold text-text">
                "{pendingPlan.name}"
              </span>{' '}
              ({pendingPlan.price}
              {pendingPlan.period}). El cambio queda registrado como pendiente:
              el plan se activa cuando abones en el gimnasio y registremos tu
              pago, y mientras tanto seguís con tu plan actual.
            </p>

            {terms.length > 0 && (
              <div className="mt-4 space-y-2">
                <p className="text-xs font-semibold uppercase tracking-wide text-text-muted">
                  Elegí un plazo
                </p>
                {terms.map((term) => {
                  const savings = termSavings(term, pendingPlan.numericPrice);
                  return (
                    <button
                      key={term.id}
                      type="button"
                      onClick={() => setSelectedTermId(term.id)}
                      className={`w-full rounded-xl border p-3 text-left transition-colors ${
                        selectedTermId === term.id
                          ? 'border-primary bg-primary/10'
                          : 'border-border hover:border-primary/40'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-body text-sm font-semibold text-text">
                          {term.months} {term.months === 1 ? 'mes' : 'meses'}
                        </span>
                        <span className="font-body text-sm text-text">
                          ${formatPriceDisplay(term.price)}
                        </span>
                      </div>
                      {savings && (
                        <p className="mt-1 text-xs text-primary">{savings}</p>
                      )}
                    </button>
                  );
                })}
              </div>
            )}

            <div className="mt-6 flex gap-3">
              <Button
                onClick={confirmChange}
                disabled={isChanging}
                className="flex-1"
              >
                {isChanging ? 'Confirmando...' : 'Confirmar'}
              </Button>
              <Button
                variant="secondary"
                onClick={() => {
                  setPendingPlan(null);
                  setTerms([]);
                  setSelectedTermId(null);
                }}
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
