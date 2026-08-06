import { CheckCircle2 } from "lucide-react";
import Button from "../common/Button";

interface ContactSubmittedProps {
  name: string;
  email: string;
  dni: string;
  topic: string;
  isAffiliated: string;
  message: string;
  onReset: () => void;
}

const ContactSubmitted = ({
  name,
  email,
  dni,
  topic,
  isAffiliated,
  message,
  onReset,
}: ContactSubmittedProps) => {
  return (
    <div className="bg-surface/90 border border-border/80 rounded-2xl p-6 sm:p-8 shadow-xl text-center flex flex-col items-center backdrop-blur-md">
      <div className="w-16 h-16 bg-primary/20 text-primary border border-primary/40 rounded-full flex items-center justify-center mb-4 animate-bounce">
        <CheckCircle2 className="h-10 w-10" />
      </div>
      <h3 className="font-display text-2xl font-bold text-text">¡Mensaje enviado con éxito!</h3>
      <p className="mt-3 font-body text-text-muted max-w-md text-sm leading-relaxed">
        Gracias por escribirnos, <strong className="text-text">{name}</strong>. Hemos recibido tu consulta sobre <strong className="text-primary">{topic}</strong> y te responderemos en un plazo máximo de <strong className="text-primary">24 horas hábiles</strong> al correo <strong className="text-text">{email}</strong>.
      </p>

      <div className="mt-6 w-full max-w-md rounded-xl bg-background/60 border border-border p-4 text-left font-body text-xs text-text-muted space-y-1.5">
        <p><span className="text-text font-semibold">DNI:</span> {dni}</p>
        <p><span className="text-text font-semibold">Condición:</span> {isAffiliated === "yes" ? "Socio / Afiliado" : "No socio"}</p>
        <p><span className="text-text font-semibold">Mensaje:</span> "{message}"</p>
      </div>

      <div className="mt-8">
        <Button onClick={onReset} variant="secondary" size="md">
          Enviar otra consulta
        </Button>
      </div>
    </div>
  );
};

export default ContactSubmitted;
