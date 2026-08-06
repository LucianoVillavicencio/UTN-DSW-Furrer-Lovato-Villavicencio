import { Clock, ShieldCheck, Sparkles } from "lucide-react";

const ContactHeader = () => {
  return (
    <div className="mx-auto max-w-3xl text-center mb-10 sm:mb-14">
      {/* Badge tag */}
      <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-1.5 text-xs font-semibold text-primary uppercase tracking-wider mb-4 shadow-sm backdrop-blur-md">
        <ShieldCheck className="h-4 w-4" />
        <span>Atención al cliente</span>
        <Sparkles className="h-3.5 w-3.5 text-primary/80" />
      </div>

      {/* Main Title */}
      <h1 className="font-display text-3xl font-extrabold sm:text-4xl lg:text-5xl text-text tracking-tight">
        Ponete en <span className="text-primary underline decoration-primary/30 underline-offset-8">contacto</span> con nosotros
      </h1>

      {/* Subtitle */}
      <p className="mt-4 font-body text-base sm:text-lg text-text-muted leading-relaxed max-w-2xl mx-auto">
        ¿Tenés dudas sobre nuestras clases, planes o entrenadores? Mandanos tu mensaje y te responderemos a la brevedad.
      </p>

      {/* 24-hour SLA highlight badge */}
      <div className="mt-6 inline-flex items-center gap-3 rounded-2xl border border-primary/30 bg-surface/90 backdrop-blur-md px-5 py-3 text-sm text-text shadow-lg shadow-primary/5 hover:border-primary/50 transition-all">
        <Clock className="h-5 w-5 text-primary shrink-0 animate-pulse" />
        <span className="font-body">
          Respuesta garantizada en <strong className="text-primary font-bold">24 horas hábiles</strong>
        </span>
      </div>
    </div>
  );
};

export default ContactHeader;
