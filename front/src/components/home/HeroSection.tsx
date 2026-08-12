import Badge from "../common/badge/Badge";
import Button from "../common/Button";
import Container from "../common/Container";
import { CheckCircle, Trophy } from "lucide-react";

const stast = [
  { value: "500+", label: "Miembros" },
  { value: "10+", label: "Entrenadores" },
  { value: "24/7+", label: "Acceso" },
];

const HeroSection = () => {
  return (
    <section
      aria-labelledby="home-hero-heading"
      className="relative overflow-hidden bg-bg-secondary py-16 lg:py-24"
    >
      {/* Subtle Background Glow Accent */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-40 -left-40 h-96 w-96 rounded-full bg-primary/10 blur-3xl"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-40 -right-40 h-96 w-96 rounded-full bg-primary/10 blur-3xl"
      />

      <Container className="relative z-10 grid grid-cols-1 items-center gap-12 lg:grid-cols-2 lg:gap-16">
        <div className="flex flex-col items-start text-left">
          <Badge variant="accent" icon={Trophy}>1° Fitness App</Badge>

          <h1
            id="home-hero-heading"
            className="mt-6 text-4xl font-extrabold tracking-tight sm:text-5xl lg:text-6xl text-text leading-[1.15]"
          >
            Transforma tu cuerpo,{" "}
            <span className="text-primary">transforma tu vida</span>
          </h1>

          <p className="mt-6 text-lg sm:text-xl font-sans text-text-muted leading-relaxed max-w-xl">
            Únete a cientos de personas que han alcanzado sus objetivos de
            acondicionamiento físico gracias a nuestros entrenadores expertos y
            equipos de última generación.
          </p>

          <div className="mt-8 flex flex-wrap gap-4 w-full sm:w-auto">
            <Button href="/register" size="md" className="w-full sm:w-auto">
              Empezar ahora
            </Button>
            <Button href="/class" variant="secondary" size="md" className="w-full sm:w-auto">
              Visualizar clases
            </Button>
          </div>

          <div className="mt-8 flex gap-12 text-center border-y border-border py-6 w-full max-w-lg">
            {stast.map((stat) => (
              <div key={stat.label}>
                <p className="font-display text-2xl font-bold text-text sm:text-3xl">
                  {stat.value}
                </p>
                <p className="text-text-muted mt-1">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* video column */}
        <div className="relative w-full max-w-lg mx-auto lg:max-w-none">
          <div className="relative aspect-square w-full overflow-hidden rounded-3xl bg-surface border border-border shadow-2xl transition-transform duration-500 hover:scale-[1.01]">
            <video
              src="/videos/hero-video3.mp4"
              poster="/images/hero-imagen.avif"
              autoPlay
              muted
              loop
              playsInline
              className="h-full w-full object-cover"
            >
              Tu navegador no soporta el elemento de video.
            </video>
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />

            {/* Floating badge */}
            <div className="absolute bottom-6 left-6 right-6 flex items-center gap-3 rounded-2xl border border-white/10 bg-surface/80 p-4 backdrop-blur-md shadow-xl">
              <div className="bg-green-100 p-2 rounded-full">
                <CheckCircle className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-sm font-semibold text-text">
                  Resultados asegurados
                </p>
              </div>
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
};

export default HeroSection;
