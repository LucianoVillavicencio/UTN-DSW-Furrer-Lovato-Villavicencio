import { Dumbbell, Trophy, Flame, Target } from "lucide-react";
import Container from "../common/Container";
import Card from "../common/Card";
import RegisterForm from "./RegisterForm";

const RegisterSection = () => {
  return (
    <Container className="py-6 sm:py-10">
      <div className="mx-auto max-w-5xl">
        <Card className="grid grid-cols-1 lg:grid-cols-12 gap-0 overflow-hidden p-0 sm:p-2 border-border/80 bg-surface shadow-xl">
          {/* Left Side: Brand Perks Highlight (Desktop) */}
          <div className="relative hidden lg:flex lg:col-span-5 flex-col justify-between rounded-2xl bg-surface p-8 border-r border-border/50 overflow-hidden">
            {/* Header / Logo */}
            <div className="relative z-10">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/20 text-primary border border-primary/30 shadow-inner">
                  <Dumbbell className="h-6 w-6" />
                </div>
                <span className="font-display text-2xl font-bold tracking-tight text-text">
                  FLG<span className="text-primary">.fit</span>
                </span>
              </div>
              <h2 className="mt-8 font-display text-2xl font-bold leading-tight text-text">
                Comienza hoy tu transformación física
              </h2>
              <p className="mt-3 font-body text-sm text-text-muted leading-relaxed">
                Únete a la plataforma líder de entrenamiento, reserva clases personalizadas y alcanza tus metas.
              </p>
            </div>

            {/* Bullet Perks */}
            <div className="relative z-10 my-6 space-y-4">
              <div className="flex items-start gap-3 group">
                <div className="mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary border border-primary/20 group-hover:bg-primary group-hover:text-background transition-all duration-300">
                  <Flame className="h-4 w-4" />
                </div>
                <div>
                  <h4 className="font-display text-xs font-semibold text-text">Rutinas Personalizadas</h4>
                  <p className="font-body text-xs text-text-muted">Diseñadas especialmente según tu nivel actual.</p>
                </div>
              </div>

              <div className="flex items-start gap-3 group">
                <div className="mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary border border-primary/20 group-hover:bg-primary group-hover:text-background transition-all duration-300">
                  <Trophy className="h-4 w-4" />
                </div>
                <div>
                  <h4 className="font-display text-xs font-semibold text-text">Pase Libre a Clases</h4>
                  <p className="font-body text-xs text-text-muted">Acceso a clases grupales con entrenadores certificados.</p>
                </div>
              </div>

              <div className="flex items-start gap-3 group">
                <div className="mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary border border-primary/20 group-hover:bg-primary group-hover:text-background transition-all duration-300">
                  <Target className="h-4 w-4" />
                </div>
                <div>
                  <h4 className="font-display text-xs font-semibold text-text">Seguimiento de Metas</h4>
                  <p className="font-body text-xs text-text-muted">Estadísticas reales de tus progresos semana a semana.</p>
                </div>
              </div>
            </div>

            {/* Motivational Footer Note */}
            <div className="relative z-10 border-t border-border/50 pt-4">
              <p className="font-body text-xs italic text-text-muted">
                "El primer paso no te lleva a donde quieres ir, pero te saca de donde estás."
              </p>
            </div>
          </div>

          {/* Right Side: Register Form */}
          <div className="lg:col-span-7 flex flex-col justify-center p-6 sm:p-8 md:p-10">
            {/* Header */}
            <div className="mb-5 lg:mb-6 text-center lg:text-left">
              <div className="flex justify-center lg:justify-start items-center gap-2 mb-2 lg:hidden">
                <Dumbbell className="h-7 w-7 text-primary" />
                <span className="font-display text-xl font-bold text-text">FLG</span>
              </div>
              <h1 className="font-display text-2xl sm:text-3xl font-extrabold tracking-tight text-text">
                Crear una Cuenta
              </h1>
              <p className="mt-1 font-body text-sm text-text-muted">
                Completa el formulario para registrarte en el gimnasio
              </p>
            </div>

            {/* Form */}
            <RegisterForm />
          </div>
        </Card>
      </div>
    </Container>
  );
};

export default RegisterSection;
