import { Check, CreditCard } from "lucide-react";
import Navbar from "../../components/layout/Navbar";
import Footer from "../../components/layout/Footer";
import PageHeader from "../../components/common/PageHeader";
import Container from "../../components/common/Container";
import CTASection from "../../components/common/CTASection";
import PlanCard from "../../components/plans/PlanCard";
import { MEMBERSHIP_PLANS } from "../../components/plans/plans.data";

function Plan() {
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
            <div className="mx-auto mb-12 flex max-w-3xl flex-col items-center justify-center gap-4 sm:flex-row sm:gap-8">
              {[
                "Sin contratos",
                "Cancelá en cualquier momento",
                "Primera semana gratis",
              ].map((item) => (
                <div
                  key={item}
                  className="flex items-center gap-3 rounded-full border border-border bg-surface px-5 py-3 text-sm text-text-muted"
                >
                  <Check className="h-4 w-4 text-primary" />
                  {item}
                </div>
              ))}
            </div>

            <div className="grid gap-6 lg:grid-cols-3">
              {MEMBERSHIP_PLANS.map((plan) => (
                <PlanCard key={plan.name} plan={plan} />
              ))}
            </div>
          </Container>
        </section>

        <CTASection
          title="Listo para transformar tu entrenamiento?"
          subtitle="Elegí el plan que mejor se adapte a tus objetivos y obtené acceso a todas nuestras facilidades y contenidos exclusivos."
          primaryButton={{ label: "Unirme ahora", href: "/register" }}
        />
      </main>

      <Footer />
    </div>
  );
}

export default Plan;
