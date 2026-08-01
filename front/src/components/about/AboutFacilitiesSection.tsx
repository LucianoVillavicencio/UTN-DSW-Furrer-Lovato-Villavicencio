import { Dumbbell, HeartPulse, Wind, Sparkles, ShieldCheck, Coffee } from "lucide-react";
import Card from "../common/Card";
import Container from "../common/Container";

const facilities = [
  {
    icon: Dumbbell,
    title: "Zona de fuerza",
    description:
      "Pesas libres, plataformas olímpicas y máquinas de entrenamiento de última generación.",
  },
  {
    icon: Wind,
    title: "Zona cardio",
    description:
      "Cintas, elípticas, bicicletas y remadoras con sistemas de entretenimiento.",
  },
  {
    icon: Sparkles,
    title: "Estudios grupales",
    description:
      "Salas amplias con sonido profesional para clases y entrenamientos colectivos.",
  },
  {
    icon: Coffee,
    title: "Bar de nutrición",
    description:
      "Smoothies, batidos de proteínas y snacks saludables para recargar energía.",
  },
  {
    icon: ShieldCheck,
    title: "Locker premium",
    description:
      "Vestidores limpios con duchas, toallas y servicios personalizados.",
  },
  {
    icon: HeartPulse,
    title: "Zona de recuperación",
    description:
      "Área de estiramiento, rodillos y sillas de masaje para cuidar tu cuerpo.",
  },
];

const AboutFacilitiesSection = () => {
  return (
    <section className="bg-background py-20">
      <Container>
        <div className="text-center">
          <span className="inline-block rounded-full border border-border bg-surface px-4 py-1.5 text-sm text-primary">
            Nuestras instalaciones
          </span>

          <h2 className="mt-6 text-4xl font-bold sm:text-5xl">
            Equipamiento de primer nivel
          </h2>

          <p className="mx-auto mt-4 max-w-2xl font-sans text-text-muted leading-relaxed">
            Un espacio moderno y completo para entrenar con seguridad, comodidad y estilo.
          </p>
        </div>

        <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {facilities.map((feature) => {
            const Icon = feature.icon;
            return (
              <Card key={feature.title} className="bg-surface">
                <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-primary/10 text-primary">
                  <Icon className="h-7 w-7" />
                </div>
                <h3 className="mt-6 text-xl font-semibold text-text">{feature.title}</h3>
                <p className="mt-3 font-body text-sm text-text-muted leading-relaxed">
                  {feature.description}
                </p>
              </Card>
            );
          })}
        </div>
      </Container>
    </section>
  );
};

export default AboutFacilitiesSection;
