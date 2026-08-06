import { Calendar, Users, Award, Smile } from "lucide-react";
import Container from "../common/Container";

const metrics = [
  {
    id: "metric-years",
    icon: Calendar,
    value: "10+",
    label: "Años de excelencia",
    subtext: "Liderando la industria",
  },
  {
    id: "metric-members",
    icon: Users,
    value: "5,000+",
    label: "Miembros transformados",
    subtext: "Comunidad activa",
  },
  {
    id: "metric-trainers",
    icon: Award,
    value: "50+",
    label: "Entrenadores expertos",
    subtext: "Certificación internacional",
  },
  {
    id: "metric-satisfaction",
    icon: Smile,
    value: "98%",
    label: "Satisfacción garantizada",
    subtext: "Reseñas 5 estrellas",
  },
];

const AboutImpactSection = () => {
  return (
    <section
      aria-labelledby="impact-heading"
      className="relative bg-background py-20 lg:py-28"
    >
      <Container>
        <div className="text-center max-w-3xl mx-auto">
          <span className="inline-block rounded-full border border-primary/20 bg-primary/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-primary shadow-sm">
            Nuestro Impacto & Resultados
          </span>

          <h2
            id="impact-heading"
            className="mt-6 text-3xl font-extrabold tracking-tight sm:text-4xl lg:text-5xl text-text"
          >
            Números que reflejan nuestro compromiso
          </h2>

          <p className="mt-4 font-sans text-base sm:text-lg text-text-muted leading-relaxed">
            Cada meta alcanzada es el fruto de la disciplina, el trabajo constante y un equipo apasionado que te acompaña paso a paso.
          </p>
        </div>

        <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {metrics.map((metric) => {
            const Icon = metric.icon;
            return (
              <article
                key={metric.id}
                className="group relative flex flex-col items-center justify-between rounded-3xl border border-border bg-surface p-8 text-center shadow-sm transition-all duration-300 hover:-translate-y-1.5 hover:border-primary/40 hover:shadow-xl hover:shadow-primary/5"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary transition-transform duration-300 group-hover:scale-110">
                  <Icon className="h-6 w-6" />
                </div>

                <div className="mt-6">
                  <p className="text-4xl font-extrabold tracking-tight text-text sm:text-5xl group-hover:text-primary transition-colors duration-300">
                    {metric.value}
                  </p>
                  <p className="mt-3 text-base font-semibold text-text">
                    {metric.label}
                  </p>
                </div>

                <p className="mt-4 text-xs font-medium text-text-muted border-t border-border/60 pt-3 w-full">
                  {metric.subtext}
                </p>
              </article>
            );
          })}
        </div>
      </Container>
    </section>
  );
};

export default AboutImpactSection;

