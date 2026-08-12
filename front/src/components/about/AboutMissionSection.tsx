import { Heart, Users, ShieldCheck, Zap } from "lucide-react";
import Container from "../common/Container";

const missionItems = [
  {
    id: "mission-pasion",
    icon: Heart,
    title: "Pasión",
    description:
      "Nos mueve ayudar a cada persona a descubrir su fuerza interior y alcanzar metas que nunca creyeron posibles.",
    badge: "Energía & Motivación",
  },
  {
    id: "mission-comunidad",
    icon: Users,
    title: "Comunidad",
    description:
      "Nuestra comunidad crea vínculos duraderos y un entorno de apoyo constante para que nunca entrenes solo.",
    badge: "Familia FitCore",
  },
  {
    id: "mission-excelencia",
    icon: ShieldCheck,
    title: "Excelencia",
    description:
      "Mantenemos los más altos estándares en equipamiento, entrenadores certificados y servicio de primer nivel.",
    badge: "Calidad Garantizada",
  },
  {
    id: "mission-innovacion",
    icon: Zap,
    title: "Innovación",
    description:
      "Evolucionamos continuamente nuestros programas de entrenamiento y tecnología para ofrecer la mejor experiencia.",
    badge: "Tecnología Vanguardista",
  },
];

const AboutMissionSection = () => {
  return (
    <section
      aria-labelledby="mission-heading"
      className="relative bg-background py-20 lg:py-28 border-y border-border/50"
    >
      <Container>
        <div className="text-center max-w-3xl mx-auto">
          <span className="inline-block rounded-full border border-primary/20 bg-primary/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-primary shadow-sm">
            Nuestra Misión & Valores
          </span>

          <h2
            id="mission-heading"
            className="mt-6 text-3xl font-extrabold tracking-tight sm:text-4xl lg:text-5xl text-text"
          >
            Lo que nos impulsa e inspira cada día
          </h2>

          <p className="mt-4 font-sans text-base sm:text-lg text-text-muted leading-relaxed">
            En FitCore, cada programa, cada clase y cada entrenador está enfocado en empoderarte para alcanzar tu mejor versión física y mental.
          </p>
        </div>

        <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {missionItems.map((item) => {
            const Icon = item.icon;
            return (
              <article
                key={item.id}
                className="group relative flex flex-col justify-between rounded-3xl border border-border bg-surface p-8 shadow-sm transition-all duration-300 hover:-translate-y-1.5 hover:border-primary/40 hover:shadow-xl hover:shadow-primary/5"
              >
                <div>
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary transition-colors duration-300 group-hover:bg-primary group-hover:text-background">
                    <Icon className="h-7 w-7" />
                  </div>

                  <h3 className="mt-6 text-xl font-bold text-text group-hover:text-primary transition-colors duration-300">
                    {item.title}
                  </h3>

                  <p className="mt-3 font-sans text-sm text-text-muted leading-relaxed">
                    {item.description}
                  </p>
                </div>

                <div className="mt-6 pt-4 border-t border-border/60">
                  <span className="text-xs font-medium text-primary">
                    {item.badge}
                  </span>
                </div>
              </article>
            );
          })}
        </div>
      </Container>
    </section>
  );
};

export default AboutMissionSection;

