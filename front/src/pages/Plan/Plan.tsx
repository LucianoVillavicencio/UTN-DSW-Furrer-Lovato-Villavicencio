import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Check, CreditCard, Loader2, AlertCircle } from "lucide-react";
import Navbar from "../../components/layout/Navbar";
import Footer from "../../components/layout/Footer";
import PageHeader from "../../components/common/PageHeader";
import Container from "../../components/common/Container";
import CTASection from "../../components/common/CTASection";
import Button from "../../components/common/Button";
import PlanCard from "../../components/plans/PlanCard";
import {
  MEMBERSHIP_PLANS,
  enrichBackendPlan,
  type MembershipPlan,
} from "../../components/plans/plans.data";
import { getPlans } from "../../services/plan.service";
import { changePlan, getMySubscription } from "../../services/subscription.service";
import type { User } from "../../types/user";
import type { Subscription } from "../../types/subscription";

function Plan() {
  const navigate = useNavigate();
  const [plans, setPlans] = useState<MembershipPlan[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Synchronously initialize currentUser from localStorage
  const [currentUser] = useState<User | null>(() => {
    const stored = localStorage.getItem("user");
    if (!stored) return null;
    try {
      return JSON.parse(stored);
    } catch {
      return null;
    }
  });

  // Suscripción activa del usuario actual (self-service; ver Dashboard).
  const [activeSubscription, setActiveSubscription] = useState<Subscription | null>(null);
  const [subscribingId, setSubscribingId] = useState<number | null>(null);
  const [actionFeedback, setActionFeedback] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  // Fetch plans from backend on mount
  useEffect(() => {
    const fetchPlanData = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const [plansRes, subRes] = await Promise.allSettled([
          getPlans(),
          currentUser ? getMySubscription() : Promise.resolve(null),
        ]);

        if (plansRes.status === "fulfilled" && Array.isArray(plansRes.value) && plansRes.value.length > 0) {
          const mapped = plansRes.value.map(enrichBackendPlan);
          setPlans(mapped);
        } else {
          // Graceful fallback to rich default plans
          setPlans(MEMBERSHIP_PLANS);
        }

        if (subRes.status === "fulfilled") {
          setActiveSubscription(subRes.value);
        }
      } catch (err) {
        console.warn("Backend error fetching plans, using fallback:", err);
        setPlans(MEMBERSHIP_PLANS);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPlanData();
  }, [currentUser]);

  // Check if current user has an active subscription to a given plan
  const hasActiveSubscriptionToPlan = (planId?: number) => {
    if (!planId || !activeSubscription) return false;
    return (
      Number(activeSubscription.planId) === Number(planId) &&
      activeSubscription.state?.toLowerCase() === "activa" &&
      !activeSubscription.deleted
    );
  };

  // Handle plan selection
  const handleSelectPlan = async (selectedPlan: MembershipPlan) => {
    setActionFeedback(null);

    // 1. Guest flow -> Redirect to login/register
    if (!currentUser) {
      navigate("/login", {
        state: {
          message: "Iniciá sesión o registrate para elegir tu plan.",
          selectedPlanId: selectedPlan.id,
        },
      });
      return;
    }

    const planIdNum = selectedPlan.id ?? 1;

    if (hasActiveSubscriptionToPlan(planIdNum)) {
      setActionFeedback({
        type: "success",
        message: `Ya tenés una suscripción activa al plan ${selectedPlan.name}.`,
      });
      return;
    }

    setSubscribingId(planIdNum);

    try {
      const updated = await changePlan(planIdNum);
      setActiveSubscription(updated);

      setActionFeedback({
        type: "success",
        message: `Tu cambio de plan a "${selectedPlan.name}" fue registrado. Acercate al gimnasio para abonar.`,
      });
    } catch (err: unknown) {
      setActionFeedback({
        type: "error",
        message: err instanceof Error ? err.message : "No se pudo procesar la suscripción. Intentalo de nuevo.",
      });
    } finally {
      setSubscribingId(null);
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-background text-text">
      <Navbar />

      <main className="flex-1">
        <PageHeader
          badge="Planes de membresía"
          icon={CreditCard}
          title={
            <>
              Elegí tu <span className="text-primary">plan fitness</span>
            </>
          }
          subtitle="Opciones de membresía flexibles diseñadas para tu estilo de vida y presupuesto. Comenzá tu transformación hoy sin contratos a largo plazo."
        />

        <section className="bg-background py-20">
          <Container>
            {/* Feedback Alert */}
            {actionFeedback && (
              <div
                className={`mx-auto mb-10 max-w-2xl rounded-2xl border p-4 text-center transition-all ${
                  actionFeedback.type === "success"
                    ? "border-primary/30 bg-primary/10 text-primary"
                    : "border-red-500/30 bg-red-500/10 text-red-400"
                }`}
              >
                <p className="text-sm font-semibold">{actionFeedback.message}</p>
              </div>
            )}

            {/* Badges Bar */}
            <div className="mx-auto mb-12 flex max-w-3xl flex-col items-center justify-center gap-4 sm:flex-row sm:gap-8">
              {[
                "Sin contratos de permanencia",
                "Cancelá cuando quieras",
                "Acceso inmediato a la app",
              ].map((item) => (
                <div
                  key={item}
                  className="flex items-center gap-3 rounded-full border border-border bg-surface px-5 py-3 text-sm text-text-muted shadow-sm"
                >
                  <Check className="h-4 w-4 text-primary shrink-0" />
                  <span>{item}</span>
                </div>
              ))}
            </div>

            {/* Stage: Loading, Error, or Plans Grid */}
            {isLoading ? (
              <div className="flex h-64 flex-col items-center justify-center gap-4">
                <Loader2 className="h-10 w-10 animate-spin text-primary" />
                <p className="text-sm text-text-muted">Cargando planes de membresía...</p>
              </div>
            ) : error ? (
              <div className="mx-auto max-w-md rounded-2xl border border-border bg-surface/50 p-8 text-center">
                <AlertCircle className="mx-auto h-12 w-12 text-red-400" />
                <h3 className="mt-4 text-lg font-semibold text-text">Error al cargar planes</h3>
                <p className="mt-2 text-sm text-text-muted">{error}</p>
                <Button
                  onClick={() => window.location.reload()}
                  variant="secondary"
                  size="sm"
                  className="mt-6"
                >
                  Reintentar
                </Button>
              </div>
            ) : (
              <div className="grid gap-6 lg:grid-cols-3">
                {plans.map((plan) => (
                  <PlanCard
                    key={plan.id || plan.name}
                    plan={plan}
                    onSelect={handleSelectPlan}
                    isLoading={subscribingId === plan.id}
                    isCurrentSubscription={hasActiveSubscriptionToPlan(plan.id)}
                  />
                ))}
              </div>
            )}
          </Container>
        </section>

        <CTASection
          title="¿Listo para transformar tu entrenamiento?"
          subtitle="Elegí el plan que mejor se adapte a tus objetivos y obtené acceso a todas nuestras facilidades y contenidos exclusivos."
          primaryButton={{ label: "Unirme ahora", href: "/register" }}
        />
      </main>

      <Footer />
    </div>
  );
}

export default Plan;

