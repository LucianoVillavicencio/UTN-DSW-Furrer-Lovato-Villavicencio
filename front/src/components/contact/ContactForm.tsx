import { useState, type ChangeEvent, type FormEvent } from "react";
import {
  Mail,
  User,
  IdCard,
  MessageSquare,
  Send,
  HelpCircle,
  AlertCircle,
} from "lucide-react";
import Button from "../common/Button";
import FormAlert from "../common/FormAlert";
import ContactSubmitted from "./ContactSubmitted";

interface FormData {
  name: string;
  email: string;
  isAffiliated: string;
  dni: string;
  topic: string;
  message: string;
}

const MAX_MESSAGE_LENGTH = 1000;

const TOPIC_OPTIONS = [
  { value: "", label: "Seleccioná el tema de tu consulta..." },
  { value: "Membresías y Planes", label: "Membresías y Planes" },
  { value: "Clases y Horarios", label: "Clases y Horarios" },
  { value: "Entrenadores y Rutinas", label: "Entrenadores y Rutinas" },
  { value: "Pagos y Facturación", label: "Pagos y Facturación" },
  { value: "Sugerencias o Reclamos", label: "Sugerencias o Reclamos" },
  { value: "Otra consulta", label: "Otra consulta" },
];

const ContactForm = () => {
  const [formData, setFormData] = useState<FormData>({
    name: "",
    email: "",
    isAffiliated: "",
    dni: "",
    topic: "",
    message: "",
  });

  const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const handleChange = (
    e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;

    if (name === "dni") {
      const sanitized = value.replace(/\D/g, "").slice(0, 8);
      setFormData((prev) => ({ ...prev, dni: sanitized }));
      if (errors.dni) setErrors((prev) => ({ ...prev, dni: undefined }));
      return;
    }

    if (name === "message" && value.length > MAX_MESSAGE_LENGTH) return;

    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name as keyof FormData]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  const validate = (): boolean => {
    const newErrors: Partial<Record<keyof FormData, string>> = {};
    if (!formData.name.trim()) newErrors.name = "El nombre completo es requerido.";
    if (!formData.email.trim()) {
      newErrors.email = "El correo electrónico es requerido.";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
      newErrors.email = "Ingresá un correo electrónico válido.";
    }
    if (!formData.isAffiliated) newErrors.isAffiliated = "Por favor indicá si sos socio o afiliado.";
    if (!formData.dni.trim()) {
      newErrors.dni = "El DNI es requerido.";
    } else if (!/^\d{7,8}$/.test(formData.dni.trim())) {
      newErrors.dni = "El DNI debe contener entre 7 y 8 números.";
    }
    if (!formData.topic) newErrors.topic = "Seleccioná el tema de tu consulta.";
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
      await new Promise((resolve) => setTimeout(resolve, 800));
      setIsSubmitted(true);
    } catch {
      setSubmitError("Ocurrió un error al enviar tu consulta. Por favor reintentá en unos momentos.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    setIsSubmitted(false);
    setSubmitError(null);
    setFormData({ name: "", email: "", isAffiliated: "", dni: "", topic: "", message: "" });
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
          <p className="font-body text-xs text-text-muted">Completá todos los campos marcados con (*) para enviarnos tu mensaje.</p>
        </div>

        {submitError && <FormAlert type="error" message={submitError} />}

        {/* Name & Email */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="contact-name" className="block font-body text-xs font-semibold text-text uppercase tracking-wider mb-1.5">
              Nombre completo <span className="text-primary">*</span>
            </label>
            <div className="relative">
              <User className="pointer-events-none absolute left-3.5 top-3 h-4 w-4 text-text-muted" />
              <input
                id="contact-name"
                type="text"
                name="name"
                autoComplete="name"
                disabled={isSubmitting}
                aria-required="true"
                aria-invalid={!!errors.name}
                aria-describedby={errors.name ? "name-error" : undefined}
                value={formData.name}
                onChange={handleChange}
                placeholder="Ej. Juan Pérez"
                className={`w-full rounded-xl border ${errors.name ? "border-red-500/80 bg-red-500/5" : "border-border bg-background"} py-2.5 pl-10 pr-4 text-sm text-text placeholder-text-muted font-body focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary disabled:opacity-60`}
              />
            </div>
            {errors.name && <p id="name-error" className="mt-1 text-xs text-red-400 font-body flex items-center gap-1"><AlertCircle className="h-3 w-3" />{errors.name}</p>}
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
        </div>

        {/* Affiliated Select & DNI */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="contact-isAffiliated" className="block font-body text-xs font-semibold text-text uppercase tracking-wider mb-1.5">
              ¿Sos socio/afiliado a FLG? <span className="text-primary">*</span>
            </label>
            <div className="relative">
              <HelpCircle className="pointer-events-none absolute left-3.5 top-3 h-4 w-4 text-text-muted" />
              <select
                id="contact-isAffiliated"
                name="isAffiliated"
                disabled={isSubmitting}
                aria-required="true"
                aria-invalid={!!errors.isAffiliated}
                aria-describedby={errors.isAffiliated ? "affiliated-error" : undefined}
                value={formData.isAffiliated}
                onChange={handleChange}
                className={`w-full rounded-xl border ${errors.isAffiliated ? "border-red-500/80 bg-red-500/5" : "border-border bg-background"} py-2.5 pl-10 pr-8 text-sm text-text font-body focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary appearance-none disabled:opacity-60`}
              >
                <option value="" disabled>Seleccioná una opción...</option>
                <option value="yes">Sí, soy socio / afiliado</option>
                <option value="no">No soy socio / afiliado</option>
              </select>
            </div>
            {errors.isAffiliated && <p id="affiliated-error" className="mt-1 text-xs text-red-400 font-body flex items-center gap-1"><AlertCircle className="h-3 w-3" />{errors.isAffiliated}</p>}
          </div>

          <div>
            <label htmlFor="contact-dni" className="block font-body text-xs font-semibold text-text uppercase tracking-wider mb-1.5">
              DNI <span className="text-primary">*</span>
            </label>
            <div className="relative">
              <IdCard className="pointer-events-none absolute left-3.5 top-3 h-4 w-4 text-text-muted" />
              <input
                id="contact-dni"
                type="text"
                name="dni"
                inputMode="numeric"
                disabled={isSubmitting}
                aria-required="true"
                aria-invalid={!!errors.dni}
                aria-describedby={errors.dni ? "dni-error" : undefined}
                value={formData.dni}
                onChange={handleChange}
                placeholder="Ej. 40123456"
                className={`w-full rounded-xl border ${errors.dni ? "border-red-500/80 bg-red-500/5" : "border-border bg-background"} py-2.5 pl-10 pr-4 text-sm text-text placeholder-text-muted font-body focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary disabled:opacity-60`}
              />
            </div>
            {errors.dni && <p id="dni-error" className="mt-1 text-xs text-red-400 font-body flex items-center gap-1"><AlertCircle className="h-3 w-3" />{errors.dni}</p>}
          </div>
        </div>

        {/* Topic Select */}
        <div>
          <label htmlFor="contact-topic" className="block font-body text-xs font-semibold text-text uppercase tracking-wider mb-1.5">
            Tema de la consulta <span className="text-primary">*</span>
          </label>
          <div className="relative">
            <MessageSquare className="pointer-events-none absolute left-3.5 top-3 h-4 w-4 text-text-muted" />
            <select
              id="contact-topic"
              name="topic"
              disabled={isSubmitting}
              aria-required="true"
              aria-invalid={!!errors.topic}
              aria-describedby={errors.topic ? "topic-error" : undefined}
              value={formData.topic}
              onChange={handleChange}
              className={`w-full rounded-xl border ${errors.topic ? "border-red-500/80 bg-red-500/5" : "border-border bg-background"} py-2.5 pl-10 pr-8 text-sm text-text font-body focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary appearance-none disabled:opacity-60`}
            >
              {TOPIC_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value} disabled={opt.value === ""}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
          {errors.topic && <p id="topic-error" className="mt-1 text-xs text-red-400 font-body flex items-center gap-1"><AlertCircle className="h-3 w-3" />{errors.topic}</p>}
        </div>

        {/* Message & Progress Bar */}
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

        {/* Submit Button */}
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
