import { Heart, Users, ShieldCheck, Zap } from "lucide-react";
import Card from "../common/Card";
import Container from "../common/Container";

const missionItems = [
  {
    icon: Heart,
    title: "Pasión",
    description:
      "Nos mueve ayudar a cada persona a descubrir su fuerza interior y alcanzar metas que nunca creyeron posibles.",
  },
  {
    icon: Users,
    title: "Comunidad",
    description:
      "Nuestra comunidad crea vínculos duraderos y apoyo constante para que nadie entrene solo.",
  },
  {
    icon: ShieldCheck,
    title: "Excelencia",
    description:
      "Mantenemos los más altos estándares en equipamiento, entrenamiento y servicio al cliente.",
  },
  {
    icon: Zap,
    title: "Innovación",
    description:
      "Evolucionamos continuamente nuestros programas y tecnología para ofrecer la mejor experiencia.",
  },
];

const AboutMissionSection = () => {
  return (
    <section className="bg-background py-20">
      <Container>
        <div className="text-center">
          <span className="inline-block rounded-full border border-border bg-surface px-4 py-1.5 text-sm text-primary">
            Nuestra misión
          </span>

          <h2 className="mt-6 text-4xl font-bold sm:text-5xl">
            Lo que nos inspira
          </h2>

          <p className="mx-auto mt-4 max-w-2xl font-sans text-text-muted leading-relaxed">
            En FitCore, cada programa, cada clase y cada entrenador está diseñado para
            empoderarte y ayudarte a vivir tu mejor versión.
          </p>
        </div>

        <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {missionItems.map((item) => {
            const Icon = item.icon;
            return (
              <Card key={item.title} className="text-center">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-surface text-primary">
                  <Icon className="h-6 w-6" />
                </div>
                <h3 className="mt-6 text-xl font-semibold text-text">{item.title}</h3>
                <p className="mt-3 font-body text-sm text-text-muted leading-relaxed">
                  {item.description}
                </p>
              </Card>
            );
          })}
        </div>
      </Container>
    </section>
  );
};

export default AboutMissionSection;
