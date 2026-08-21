import { AlertCircle, CheckCircle2, AlertTriangle } from 'lucide-react';

interface FormAlertProps {
  type: 'error' | 'success' | 'warning';
  message: string | null;
}

const FormAlert = ({ type, message }: FormAlertProps) => {
  if (!message) return null;

  if (type === 'error') {
    return (
      <div
        role="alert"
        aria-live="assertive"
        className="flex items-start gap-3 rounded-xl border border-red-500/30 bg-red-500/10 p-3.5 text-xs sm:text-sm text-red-400 animate-fadeIn"
      >
        <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
        <span className="font-body leading-relaxed">{message}</span>
      </div>
    );
  }

  if (type === 'warning') {
    return (
      <div
        role="alert"
        aria-live="polite"
        className="flex items-start gap-3 rounded-xl border border-amber-500/30 bg-amber-500/10 p-3.5 text-xs sm:text-sm text-amber-400 animate-fadeIn"
      >
        <AlertTriangle className="h-5 w-5 shrink-0 mt-0.5" />
        <span className="font-body leading-relaxed">{message}</span>
      </div>
    );
  }

  return (
    <div
      role="status"
      aria-live="polite"
      className="flex items-start gap-3 rounded-xl border border-primary/30 bg-primary/10 p-3.5 text-xs sm:text-sm text-primary animate-fadeIn"
    >
      <CheckCircle2 className="h-5 w-5 shrink-0 mt-0.5" />
      <span className="font-body leading-relaxed">{message}</span>
    </div>
  );
};

export default FormAlert;
