import Button from "../common/Button";
import Container from "../common/Container";
import { CheckCircle } from "lucide-react";

const stast = [
  { value: "500+", label: "Miembros" },
  { value: "10+", label: "Entrenadores" },
  { value: "24/7+", label: "Acceso" },
];

const HeroSection = () => {
  return (
    <section className="relative overflow-hidden bg-background py-20">
      <Container className="grid grid-cols-1 items-center gap-20 lg:grid-cols-2">
        <div>
          <span className="inline-block rounded-full border border-border bg-surface px-4 py-1.5 text-sm text-primary">
            1° Fitness App
          </span>

          <h1 className="mt-6 text-5xl font-bold leading-tight sm:text-6xl lg:text-6xl">
            Transforma tu cuerpo,{" "}
            <span className="text-primary">transforma tu vida</span>
          </h1>

          <p className="mt-6 text-xl max-w-lg font-sans text-text-muted leading-relaxed">
            Únete a cientos de personas que han alcanzado sus objetivos de
            acondicionamiento físico gracias a nuestros entrenadores expertos y
            equipos de última generación.
          </p>

          <div className="mt-8 flex flex-wrap gap-4">
            <Button href="/register" size="md">
              Empezar ahora
            </Button>
            <Button href="/class" variant="secondary" size="md">
              Visualizar clases
            </Button>
          </div>

          <div className="mt-12 flex gap-12 text-center">
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
        <div className="relative">
          <div className="aspect-square w-full overflow-hidden rounded-2xl">
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
          </div>

          {/* Floating badge */}
          <div className="absolute bottom-5 left-6 flex items-center gap-3 rounded-xl border border-border bg-background/80  px-4 py-3 backdrop-blur-sm ">
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
      </Container>
    </section>
  );
};

export default HeroSection;
