import { Dumbbell, ShieldCheck, Zap, Users } from 'lucide-react';
import Container from '../common/Container';
import Card from '../common/Card';
import LoginForm from './LoginForm';

const LoginSection = () => {
  return (
    <Container className="py-6 sm:py-12">
      <div className="mx-auto max-w-5xl">
        <Card className="grid grid-cols-1 lg:grid-cols-12 gap-0 overflow-hidden p-0 sm:p-2 border-border/80 bg-surface shadow-xl">
          {/* Left Side: Brand & Feature Highlights (Desktop) */}
          <div className="relative hidden lg:flex lg:col-span-5 flex-col justify-between rounded-2xl bg-surface p-8 border-r border-border/50 overflow-hidden">
            {/* Header / Logo */}
            <div className="relative z-10">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/20 text-primary border border-primary/30 shadow-inner">
                  <Dumbbell className="h-6 w-6" />
                </div>
                <span className="font-display text-2xl font-bold tracking-tight text-text">
                  FLG
                </span>
              </div>
              <h2 className="mt-8 font-display text-2xl font-bold leading-tight text-text">
                Bienvenido de nuevo a tu comunidad de entrenamiento
              </h2>
              <p className="mt-3 font-body text-sm text-text-muted leading-relaxed">
                Accede a tu panel personalizado, reserva tus clases y sigue tus
                progresos diarios.
              </p>
            </div>

            {/* Bullet features */}
            <div className="relative z-10 my-8 space-y-4">
              <div className="flex items-start gap-3 group">
                <div className="mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary border border-primary/20 group-hover:bg-primary group-hover:text-background transition-all duration-300">
                  <ShieldCheck className="h-4 w-4" />
                </div>
                <div>
                  <h4 className="font-display text-xs font-semibold text-text">
                    Acceso Seguro
                  </h4>
                  <p className="font-body text-xs text-text-muted">
                    Tus datos e historial de clases protegidos.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 group">
                <div className="mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary border border-primary/20 group-hover:bg-primary group-hover:text-background transition-all duration-300">
                  <Zap className="h-4 w-4" />
                </div>
                <div>
                  <h4 className="font-display text-xs font-semibold text-text">
                    Reservas Rápidas
                  </h4>
                  <p className="font-body text-xs text-text-muted">
                    Reserva tu lugar en segundos en cualquier rutina.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 group">
                <div className="mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary border border-primary/20 group-hover:bg-primary group-hover:text-background transition-all duration-300">
                  <Users className="h-4 w-4" />
                </div>
                <div>
                  <h4 className="font-display text-xs font-semibold text-text">
                    Comunidad Activa
                  </h4>
                  <p className="font-body text-xs text-text-muted">
                    Entrena junto a los mejores profesores y compañeros.
                  </p>
                </div>
              </div>
            </div>

            {/* Motivational Quote */}
            <div className="relative z-10 border-t border-border/50 pt-4">
              <p className="font-body text-xs italic text-text-muted">
                "La disciplina es la clave entre lo que quieres ahora y lo que
                más deseas."
              </p>
            </div>
          </div>

          {/* Right Side: Login Form */}
          <div className="lg:col-span-7 flex flex-col justify-center p-6 sm:p-10 md:p-12">
            {/* Header (Visible on Mobile & Tablet) */}
            <div className="mb-6 lg:mb-8 text-center lg:text-left">
              <div className="flex justify-center lg:justify-start items-center gap-2 mb-2 lg:hidden">
                <Dumbbell className="h-7 w-7 text-primary" />
                <span className="font-display text-xl font-bold text-text">
                  FLG
                </span>
              </div>
              <h1 className="font-display text-2xl sm:text-3xl font-extrabold tracking-tight text-text">
                Iniciar Sesión
              </h1>
              <p className="mt-1 font-body text-sm text-text-muted">
                Ingresa tus credenciales para acceder a tu cuenta
              </p>
            </div>

            {/* Form */}
            <LoginForm />
          </div>
        </Card>
      </div>
    </Container>
  );
};

export default LoginSection;
