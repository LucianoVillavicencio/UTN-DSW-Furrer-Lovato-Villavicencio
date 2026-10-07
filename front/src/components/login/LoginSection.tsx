import { Dumbbell, ShieldCheck, Users, Zap } from 'lucide-react';
import Container from '../common/Container';
import Card from '../common/Card';
import LoginForm from './LoginForm';

const FEATURES = [
  {
    icon: ShieldCheck,
    title: 'Acceso Seguro',
    description: 'Tus datos e historial de clases protegidos.',
  },
  {
    icon: Zap,
    title: 'Reservas Rápidas',
    description: 'Reserva tu lugar en segundos en cualquier rutina.',
  },
  {
    icon: Users,
    title: 'Comunidad Activa',
    description: 'Entrena junto a los mejores profesores y compañeros.',
  },
];

const LoginSection = () => {
  return (
    <Container className="py-6 sm:py-12">
      <div className="mx-auto max-w-5xl">
        <Card className="grid grid-cols-1 gap-0 overflow-hidden border-border/90 bg-surface p-0 shadow-xl sm:p-2 lg:grid-cols-12">
          {/* ── Left side: green glow panel + welcome (desktop only) ── */}
          <div className="relative isolate hidden flex-col justify-between overflow-hidden rounded-2xl border border-primary/15 bg-linear-to-br from-primary/10 via-primary/1 to-transparent p-8 lg:col-span-5 lg:flex">
            {/* Two blurred green glows in opposite corners, the same idea as
                the Clases page header. Raise or lower the /25 and /15 to make
                the panel greener or darker. */}
            <div
              aria-hidden="true"
              className="pointer-events-none absolute -top-24 -left-24 -z-10 size-72 rounded-full bg-primary/25 blur-3xl"
            />
            <div
              aria-hidden="true"
              className="pointer-events-none absolute -right-32 -bottom-32 -z-10 size-80 rounded-full bg-primary/15 blur-3xl"
            />

            {/* Top: logo + welcome, kept together so the heading sits
                right under the logo instead of floating mid-panel. */}
            <div className="relative">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-primary/30 bg-primary/20 text-primary">
                  <Dumbbell className="h-6 w-6" aria-hidden="true" />
                </div>
                <span className="font-display text-2xl font-bold tracking-tight text-text">
                  FLG
                </span>
              </div>

              <h2 className="mt-8 font-display text-3xl leading-tight font-bold text-text">
                Bienvenido de nuevo a tu comunidad de entrenamiento
              </h2>
            </div>

            {/* features */}
            <ul className="relative space-y-8">
              {FEATURES.map(({ icon: Icon, title, description }) => (
                <li key={title} className="group flex items-start gap-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-primary/20 bg-primary/10 text-primary transition-all duration-300 group-hover:bg-primary group-hover:text-background">
                    <Icon className="h-4 w-4" aria-hidden="true" />
                  </div>
                  <div>
                    <h3 className="font-display text-xs font-semibold text-text">
                      {title}
                    </h3>
                    <p className="font-body text-xs text-text-muted">
                      {description}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          {/* ── Right side: login form (unchanged) ── */}
          <div className="flex flex-col justify-center p-6 sm:p-10 md:p-12 lg:col-span-7">
            {/* Header (Visible on Mobile & Tablet) */}
            <div className="mb-6 text-center lg:mb-8 lg:text-left">
              <div className="mb-2 flex items-center justify-center gap-2 lg:hidden lg:justify-start">
                <Dumbbell className="h-7 w-7 text-primary" />
                <span className="font-display text-xl font-bold text-text">
                  FLG
                </span>
              </div>
              <h1 className="font-display text-2xl font-extrabold tracking-tight text-text sm:text-3xl">
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