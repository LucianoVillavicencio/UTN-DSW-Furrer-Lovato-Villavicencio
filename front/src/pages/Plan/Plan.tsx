import { Check, X } from "lucide-react";
import Navbar from "../../components/layout/Navbar";
import Footer from "../../components/layout/Footer";
import PageHeader from "../../components/common/PageHeader";
import SectionTitle from "../../components/common/SectionTitle";
import Container from "../../components/common/Container";
import Card from "../../components/common/Card";
import Button from "../../components/common/Button";
import CTASection from "../../components/common/CTASection";

const membershipPlans = [
  {
    name: "Básico",
    description: "Perfecto para empezar tu camino fitness",
    price: "$29",
    period: "/mes",
    highlight: false,
    features: [
      { label: "Acceso 24/7 al gimnasio", available: true },
      { label: "Cardio y equipamiento de fuerza", available: true },
      { label: "Acceso a vestuarios", available: true },
      { label: "Evaluación física gratis", available: true },
      { label: "Acceso a la app móvil", available: true },
      { label: "Clases grupales", available: false },
      { label: "Sesiones de entrenamiento personal", available: false },
      { label: "Coaching nutricional", available: false },
      { label: "Pases para invitados", available: false },
      { label: "Servicio de toallas", available: false },
    ],
  },
  {
    name: "Premium",
    description: "Nuestro plan más popular con todo lo que necesitás",
    price: "$59",
    period: "/mes",
    highlight: true,
    features: [
      { label: "Todo en Básico", available: true },
      { label: "Clases grupales ilimitadas", available: true },
      { label: "2 sesiones de entrenamiento personal/mes", available: true },
      { label: "Consulta de nutrición", available: true },
      { label: "Pases para invitados (2/mes)", available: true },
      { label: "Servicio de toallas", available: true },
      { label: "Acceso a zona de recuperación", available: true },
      { label: "Descuentos en barra de nutrición", available: true },
      { label: "Entrenamiento personal ilimitado", available: false },
      { label: "Terapia de masajes", available: false },
    ],
  },
  {
    name: "Elite",
    description: "Experiencia fitness definitiva con beneficios premium",
    price: "$99",
    period: "/mes",
    highlight: false,
    features: [
      { label: "Todo en Premium", available: true },
      { label: "Entrenamiento personal ilimitado", available: true },
      { label: "Reservas prioritarias de clases", available: true },
      { label: "Terapia de masajes (1/mes)", available: true },
      { label: "Pases ilimitados para invitados", available: true },
      { label: "Locker premium", available: true },
      { label: "Programa de coaching nutricional", available: true },
      { label: "Eventos exclusivos para socios", available: true },
      { label: "Descuentos en suplementos", available: true },
    ],
  },
];

const addons = [
  {
    title: "Sesión de entrenamiento personal",
    price: "$75",
    subtitle: "Uno a uno con entrenador certificado",
  },
  {
    title: "Coaching nutricional",
    price: "$150/mes",
    subtitle: "Planes alimentarios personalizados y acompañamiento continuo",
  },
  {
    title: "Masaje terapéutico",
    price: "$90",
    subtitle: "Sesión terapéutica de 60 minutos",
  },
  {
    title: "Locker premium",
    price: "$25/mes",
    subtitle: "Locker amplio con amenidades premium",
  },
];

function Plan() {
  return (
    <div className="flex min-h-screen flex-col bg-background text-text">
      <Navbar />

      <main className="flex-1">
        <PageHeader
          badge="Planes de membresía"
          title={
            <>
              Elegí tu <span className="text-primary">plan fitness</span>
            </>
          }
          subtitle="Opciones de membresía flexibles diseñadas para tu estilo de vida y presupuesto. Comenzá tu transformación hoy sin contratos a largo plazo."
        />

        <section className="bg-black py-20">
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
              {membershipPlans.map((plan) => (
                <Card
                  key={plan.name}
                  className={`relative flex h-full flex-col justify-between gap-6 p-8 ${
                    plan.highlight
                      ? "border border-primary bg-bg-secondary shadow-[0_0_30px_rgba(34,197,94,0.15)]"
                      : "border-border"
                  }`}
                >
                  {plan.highlight && (
                    <span className="absolute left-6 top-4 z-10 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                      Más popular
                    </span>
                  )}

                  <div className="space-y-5">
                    <div>
                      <h3 className="text-3xl font-bold text-text">{plan.name}</h3>
                      <p className="mt-2 text-sm text-text-muted">{plan.description}</p>
                    </div>

                    <div className="flex items-end gap-3">
                      <span className="text-5xl font-bold text-text">{plan.price}</span>
                      <span className="pb-1 text-base text-text-muted">{plan.period}</span>
                    </div>

                    <ul className="space-y-3">
                      {plan.features.map((feature) => (
                        <li
                          key={feature.label}
                          className={`flex items-center gap-3 text-sm ${
                            feature.available
                              ? "text-text"
                              : "text-text-muted"
                          }`}
                        >
                          {feature.available ? (
                            <Check className="h-4 w-4 text-primary" />
                          ) : (
                            <X className="h-4 w-4 text-text-muted" />
                          )}
                          {feature.label}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <Button href="/register" className="w-full">
                    Elegir plan
                  </Button>
                </Card>
              ))}
            </div>
          </Container>
        </section>

        <section className="bg-bg-secondary py-20">
          <Container>
            <SectionTitle
              badge="Complementos"
              title="Mejorá tu experiencia"
              subtitle="Llevá tu entrenamiento al siguiente nivel con nuestros servicios premium opcionales."
            />

            <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {addons.map((addon) => (
                <Card key={addon.title} className="flex flex-col justify-between gap-6 p-6">
                  <div>
                    <h3 className="text-xl font-semibold text-text">{addon.title}</h3>
                    <p className="mt-4 text-3xl font-bold text-primary">{addon.price}</p>
                    <p className="mt-3 text-sm text-text-muted">{addon.subtitle}</p>
                  </div>
                  <Button href="/register" variant="secondary" className="w-full border-white text-white hover:bg-white/5">
                    Agregar al plan
                  </Button>
                </Card>
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
