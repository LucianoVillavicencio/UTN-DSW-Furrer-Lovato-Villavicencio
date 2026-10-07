import { Dumbbell, CalendarCheck, CreditCard, BadgePercent } from 'lucide-react';
import Container from '../common/Container';
import Card from '../common/Card';
import RegisterForm from './RegisterForm';



const REGISTER_FEATURES = [
  {
    icon: CalendarCheck,
    title: 'Reserva tus Clases',
    description: 'Elige tu turno desde el celular y cancélalo si no llegas.',
  },
  {
    icon: CreditCard,
    title: 'Paga tu Cuota Online',
    description: 'Con Mercado Pago, desde tu cuenta y sin pasar por recepción.',
  },
  {
    icon: BadgePercent,
    title: 'Sin Matrícula',
    description: 'Pagas solo el plan que elijas, sin permanencia mínima.',
  },
];

const RegisterSection = () => {
  return (
    <Container className="py-6 sm:py-10">
      <div className="mx-auto max-w-5xl">
        <Card className="grid grid-cols-1 lg:grid-cols-12 gap-0 overflow-hidden p-0 sm:p-2 border-border/80 bg-surface shadow-xl">
          {/* Left Side: green glow panel (Desktop) */}
          <div className="relative isolate hidden flex-col justify-between overflow-hidden rounded-2xl border border-primary/15 bg-linear-to-br from-primary/10 via-primary/1 to-transparent p-8 lg:col-span-5 lg:flex">
            <div
              aria-hidden="true"
              className="pointer-events-none absolute -top-24 -left-24 -z-10 size-72 rounded-full bg-primary/25 blur-3xl"
            />
            <div
              aria-hidden="true"
              className="pointer-events-none absolute -right-32 -bottom-32 -z-10 size-80 rounded-full bg-primary/15 blur-3xl"
            />

            {/* Logo + title */}
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
                Comienza hoy tu transformación física
              </h2>
            </div>

            {/* Features */}
            <ul className="relative space-y-8">
              {REGISTER_FEATURES.map(({ icon: Icon, title, description }) => (
                <li key={title} className="group flex items-center gap-3">
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

          {/* Right Side: Register Form */}
          <div className="lg:col-span-7 flex flex-col justify-center p-6 sm:p-8 md:p-10">
            {/* Header */}
            <div className="mb-5 lg:mb-6 text-center lg:text-left">
              <div className="flex justify-center lg:justify-start items-center gap-2 mb-2 lg:hidden">
                <Dumbbell className="h-7 w-7 text-primary" />
                <span className="font-display text-xl font-bold text-text">
                  FLG
                </span>
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
