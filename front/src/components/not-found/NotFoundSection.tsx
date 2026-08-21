import { Dumbbell, Home, Search } from 'lucide-react';
import Container from '../common/Container';
import Button from '../common/Button';

const NotFoundSection = () => {
  return (
    <Container className="flex flex-col items-center justify-center text-center py-12">
      {/* Visual Badge / Icon */}
      <div className="relative mb-8 flex items-center justify-center">
        <div className="absolute -inset-4 rounded-full bg-primary/10 blur-xl"></div>
        <div className="relative flex h-24 w-24 items-center justify-center rounded-2xl border border-border bg-surface shadow-2xl">
          <Dumbbell className="h-12 w-12 text-primary animate-bounce" />
        </div>
      </div>

      {/* 404 Big Display Text */}
      <h1 className="font-display text-8xl font-extrabold tracking-tight text-text sm:text-9xl">
        4<span className="text-primary">0</span>4
      </h1>

      {/* Title & Description */}
      <h2 className="mt-4 font-display text-2xl font-bold text-text sm:text-3xl">
        ¡Uy! Te has salido de la rutina
      </h2>
      <p className="mt-3 max-w-md font-body text-base text-text-muted sm:text-lg">
        La página o el ejercicio que buscas no existe o fue movida a otra sesión
        de entrenamiento.
      </p>

      {/* Action Buttons */}
      <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4 w-full max-w-xs sm:max-w-none">
        <Button href="/" variant="primary" size="md">
          <Home className="mr-2 h-5 w-5" />
          Volver al Inicio
        </Button>
        <Button href="/class" variant="secondary" size="md">
          <Search className="mr-2 h-5 w-5" />
          Ver Clases
        </Button>
      </div>

      {/* Quick Navigation Cards */}
      <div className="mt-14 grid w-full max-w-2xl grid-cols-1 gap-4 sm:grid-cols-3">
        <a
          href="/class"
          className="flex flex-col items-center rounded-xl border border-border bg-surface p-5 transition-all duration-300 hover:border-primary hover:-translate-y-1"
        >
          <span className="font-display font-semibold text-text">Clases</span>
          <span className="mt-1 text-xs text-text-muted">
            Explora nuestros entrenamientos
          </span>
        </a>
        <a
          href="/trainers"
          className="flex flex-col items-center rounded-xl border border-border bg-surface p-5 transition-all duration-300 hover:border-primary hover:-translate-y-1"
        >
          <span className="font-display font-semibold text-text">
            Entrenadores
          </span>
          <span className="mt-1 text-xs text-text-muted">
            Conoce a nuestro equipo
          </span>
        </a>
        <a
          href="/membership"
          className="flex flex-col items-center rounded-xl border border-border bg-surface p-5 transition-all duration-300 hover:border-primary hover:-translate-y-1"
        >
          <span className="font-display font-semibold text-text">Planes</span>
          <span className="mt-1 text-xs text-text-muted">
            Encuentra la mejor membresía
          </span>
        </a>
      </div>
    </Container>
  );
};

export default NotFoundSection;
