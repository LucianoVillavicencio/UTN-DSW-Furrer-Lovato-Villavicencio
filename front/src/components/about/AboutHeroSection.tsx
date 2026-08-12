import { useState } from "react";
import Container from "../common/Container";
import Button from "../common/Button";
import Badge from "../common/badge/Badge";
import { Shield, Users, Trophy , HeartHandshake } from "lucide-react";

const AboutHeroSection = () => {
  const [imgSrc, setImgSrc] = useState("/images/hero-imagen.avif");

  const handleImageError = () => {
    // High-quality SVG fallback in case local or external asset fails
    setImgSrc(
      "data:image/svg+xml;charset=UTF-8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='800' height='800' viewBox='0 0 800 800'%3E%3Cdefs%3E%3ClinearGradient id='bg' x1='0%25' y1='0%25' x2='100%25' y2='100%25'%3E%3Cstop offset='0%25' stop-color='%230f172a'/%3E%3Cstop offset='100%25' stop-color='%231e293b'/%3E%3C/linearGradient%3E%3C/defs%3E%3Crect width='800' height='800' fill='url(%23bg)'/%3E%3Ccircle cx='400' cy='350' r='140' fill='%236366f1' opacity='0.15'/%3E%3Cpath d='M320 420 L480 420 M400 300 L400 420' stroke='%236366f1' stroke-width='16' stroke-linecap='round'/%3E%3Ctext x='50%25' y='65%25' dominant-baseline='middle' text-anchor='middle' fill='%23f8fafc' font-family='sans-serif' font-size='32' font-weight='bold'%3EFitCore Gym%3C/text%3E%3C/svg%3E"
    );
  };

  return (
    <section
      aria-labelledby="hero-heading"
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
        {/* Left Column: Text & Content */}
        <div className="flex flex-col items-start text-left">
          <Badge variant="accent" icon={HeartHandshake}>
            Sobre FitCore
          </Badge>

          <h1
            id="hero-heading"
            className="mt-6 text-4xl font-extrabold tracking-tight sm:text-5xl lg:text-6xl text-text leading-[1.15]"
          >
            Tu camino hacia el <span className="text-primary">bienestar</span> y la superación
          </h1>

          <p className="mt-6 text-lg sm:text-xl font-sans text-text-muted leading-relaxed max-w-xl">
            En FitCore creemos que el fitness es mucho más que ejercicio físico: es una comunidad sólida, crecimiento personal constante y la construcción de un estilo de vida pleno y saludable.
          </p>

          {/* Key Quick Highlights */}
          <div className="mt-8 grid grid-cols-3 gap-4 border-y border-border py-6 w-full max-w-lg">
            <div className="flex items-center gap-2">
              <Trophy className="h-5 w-5 text-primary shrink-0" />
              <div>
                <p className="text-sm font-bold text-text">10+ Años</p>
                <p className="text-xs text-text-muted">Experiencia</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-primary shrink-0" />
              <div>
                <p className="text-sm font-bold text-text">+5000</p>
                <p className="text-xs text-text-muted">Atletas</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-primary shrink-0" />
              <div>
                <p className="text-sm font-bold text-text">100%</p>
                <p className="text-xs text-text-muted">Compromiso</p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="mt-8 flex flex-wrap gap-4 w-full sm:w-auto">
            <Button href="/register" size="md" className="w-full sm:w-auto">
              Únete hoy
            </Button>
            <Button href="/class" variant="secondary" size="md" className="w-full sm:w-auto">
              Ver clases
            </Button>
          </div>
        </div>

        {/* Right Column: Hero Image with Floating Badge */}
        <div className="relative w-full max-w-lg mx-auto lg:max-w-none">
          <div className="relative aspect-[4/3] sm:aspect-square w-full overflow-hidden rounded-3xl bg-surface border border-border shadow-2xl transition-transform duration-500 hover:scale-[1.01]">
            <img
              src={imgSrc}
              onError={handleImageError}
              alt="Instalaciones de entrenamiento y atletas en FitCore Gym"
              loading="eager"
              width={800}
              height={800}
              className="h-full w-full object-cover transition-all duration-700 hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />

            {/* Floating Glassmorphism Overlay Card */}
            <div className="absolute bottom-6 left-6 right-6 rounded-2xl border border-white/10 bg-surface/80 p-4 backdrop-blur-md shadow-xl flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-text-muted uppercase tracking-wider">Centro Oficial</p>
                <p className="text-base font-bold text-text">Equipamiento & Coaching Premium</p>
              </div>
              <span className="flex h-3 w-3 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-primary"></span>
              </span>
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
};

export default AboutHeroSection;

