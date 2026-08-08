import { useState, type ChangeEvent, type FormEvent } from "react";
import { Mail, User, Send, AlertCircle } from "lucide-react";
import Button from "../common/Button";
import FormAlert from "../common/FormAlert";
import ContactSubmitted from "./ContactSubmitted";
import { createContact } from "../../services/contact.service";

interface FormData {
  name: string;
  surname: string;
  email: string;
  message: string;
}

const MAX_MESSAGE_LENGTH = 1000;

const ContactForm = () => {
  const [formData, setFormData] = useState<FormData>({
    name: "",
    surname: "",
    email: "",
    message: "",
  });

  const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {

    const { name, value } = e.target;

    if (name === "message" && value.length > MAX_MESSAGE_LENGTH) return;

    setFormData((prev) => ({ ...prev, [name]: value }));

    if (errors[name as keyof FormData]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }

  };

  const validate = (): boolean => {
    const newErrors: Partial<Record<keyof FormData, string>> = {};

    if (!formData.name.trim()) newErrors.name = "El nombre es requerido.";

    if (!formData.surname.trim()) newErrors.surname = "El apellido es requerido.";

    if (!formData.email.trim()) {
      newErrors.email = "El correo electrónico es requerido.";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
      newErrors.email = "Ingresá un correo electrónico válido.";
    }

    if (!formData.message.trim()) {
      newErrors.message = "El mensaje no puede estar vacío.";

    } else if (formData.message.length > MAX_MESSAGE_LENGTH) {
      newErrors.message = `El mensaje no puede superar los ${MAX_MESSAGE_LENGTH} caracteres.`;
    }

    setErrors(newErrors);
    
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitError(null);
    if (!validate()) return;
    setIsSubmitting(true);
    try {
      await createContact({
        name: formData.name.trim(),
        surname: formData.surname.trim(),
        email: formData.email.trim(),
        message: formData.message.trim(),
      });
      setIsSubmitted(true);
    } catch (error) {
      setSubmitError(
        error instanceof Error
          ? error.message
          : "Ocurrió un error al enviar tu consulta. Por favor reintentá en unos momentos."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    setIsSubmitted(false);
    setSubmitError(null);
    setFormData({ name: "", surname: "", email: "", message: "" });
    setErrors({});
  };

  const charsCount = formData.message.length;
  const progressPercent = Math.min(100, (charsCount / MAX_MESSAGE_LENGTH) * 100);

  if (isSubmitted) {
    return <ContactSubmitted {...formData} onReset={handleReset} />;
  }

  return (
    <div className="bg-surface/90 border border-border/80 rounded-2xl p-6 sm:p-8 shadow-xl backdrop-blur-md">
      <form onSubmit={handleSubmit} className="space-y-5" noValidate>
        <div>
          <h2 className="font-display text-xl font-bold text-text mb-1">Formulario de Consulta</h2>
          <p className="font-body text-xs text-text-muted">Completá todos los campos para enviarnos tu mensaje.</p>
        </div>

        {submitError && <FormAlert type="error" message={submitError} />}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="contact-name" className="block font-body text-xs font-semibold text-text uppercase tracking-wider mb-1.5">
              Nombre <span className="text-primary">*</span>
            </label>
            <div className="relative">
              <User className="pointer-events-none absolute left-3.5 top-3 h-4 w-4 text-text-muted" />
              <input
                id="contact-name"
                type="text"
                name="name"
                autoComplete="given-name"
                disabled={isSubmitting}
                aria-required="true"
                aria-invalid={!!errors.name}
                aria-describedby={errors.name ? "name-error" : undefined}
                value={formData.name}
                onChange={handleChange}
                placeholder="Ej. Juan"
                className={`w-full rounded-xl border ${errors.name ? "border-red-500/80 bg-red-500/5" : "border-border bg-background"} py-2.5 pl-10 pr-4 text-sm text-text placeholder-text-muted font-body focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary disabled:opacity-60`}
              />
            </div>
            {errors.name && <p id="name-error" className="mt-1 text-xs text-red-400 font-body flex items-center gap-1"><AlertCircle className="h-3 w-3" />{errors.name}</p>}
          </div>

          <div>
            <label htmlFor="contact-surname" className="block font-body text-xs font-semibold text-text uppercase tracking-wider mb-1.5">
              Apellido <span className="text-primary">*</span>
            </label>
            <div className="relative">
              <User className="pointer-events-none absolute left-3.5 top-3 h-4 w-4 text-text-muted" />
              <input
                id="contact-surname"
                type="text"
                name="surname"
                autoComplete="family-name"
                disabled={isSubmitting}
                aria-required="true"
                aria-invalid={!!errors.surname}
                aria-describedby={errors.surname ? "surname-error" : undefined}
                value={formData.surname}
                onChange={handleChange}
                placeholder="Ej. Pérez"
                className={`w-full rounded-xl border ${errors.surname ? "border-red-500/80 bg-red-500/5" : "border-border bg-background"} py-2.5 pl-10 pr-4 text-sm text-text placeholder-text-muted font-body focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary disabled:opacity-60`}
              />
            </div>
            {errors.surname && <p id="surname-error" className="mt-1 text-xs text-red-400 font-body flex items-center gap-1"><AlertCircle className="h-3 w-3" />{errors.surname}</p>}
          </div>
        </div>

        <div>
          <label htmlFor="contact-email" className="block font-body text-xs font-semibold text-text uppercase tracking-wider mb-1.5">
            Correo electrónico <span className="text-primary">*</span>
          </label>
          <div className="relative">
            <Mail className="pointer-events-none absolute left-3.5 top-3 h-4 w-4 text-text-muted" />
            <input
              id="contact-email"
              type="email"
              name="email"
              autoComplete="email"
              disabled={isSubmitting}
              aria-required="true"
              aria-invalid={!!errors.email}
              aria-describedby={errors.email ? "email-error" : undefined}
              value={formData.email}
              onChange={handleChange}
              placeholder="ejemplo@correo.com"
              className={`w-full rounded-xl border ${errors.email ? "border-red-500/80 bg-red-500/5" : "border-border bg-background"} py-2.5 pl-10 pr-4 text-sm text-text placeholder-text-muted font-body focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary disabled:opacity-60`}
            />
          </div>
          {errors.email && <p id="email-error" className="mt-1 text-xs text-red-400 font-body flex items-center gap-1"><AlertCircle className="h-3 w-3" />{errors.email}</p>}
        </div>

        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label htmlFor="contact-message" className="block font-body text-xs font-semibold text-text uppercase tracking-wider">
              Mensaje <span className="text-primary">*</span>
            </label>
            <span className={`text-xs font-body font-mono ${charsCount >= 950 ? "text-amber-400 font-bold" : "text-text-muted"}`}>
              {charsCount} / {MAX_MESSAGE_LENGTH}
            </span>
          </div>

          <div className="relative">
            <textarea
              id="contact-message"
              name="message"
              rows={4}
              disabled={isSubmitting}
              aria-required="true"
              aria-invalid={!!errors.message}
              aria-describedby={errors.message ? "message-error" : undefined}
              value={formData.message}
              onChange={handleChange}
              maxLength={MAX_MESSAGE_LENGTH}
              placeholder="Escribí aquí tu mensaje o consulta (máximo 1000 caracteres)..."
              className={`w-full rounded-xl border ${errors.message ? "border-red-500/80 bg-red-500/5" : "border-border bg-background"} p-3.5 text-sm text-text placeholder-text-muted font-body focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary resize-none disabled:opacity-60`}
            />
            <div className="w-full bg-border h-1 rounded-full overflow-hidden mt-1">
              <div
                className={`h-full transition-all duration-200 ${progressPercent > 90 ? "bg-amber-400" : "bg-primary"}`}
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
          {errors.message && <p id="message-error" className="mt-1 text-xs text-red-400 font-body flex items-center gap-1"><AlertCircle className="h-3 w-3" />{errors.message}</p>}
        </div>

        <Button
          type="submit"
          variant="primary"
          size="lg"
          className="w-full flex items-center justify-center gap-2 py-3.5 font-bold shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all cursor-pointer"
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <div className="flex items-center gap-2">
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-background border-t-transparent" />
              <span>Enviando consulta...</span>
            </div>
          ) : (
            <>
              <Send className="h-5 w-5" />
              <span>Enviar Mensaje</span>
            </>
          )}
        </Button>
      </form>
    </div>
  );
};

export default ContactForm;