import { Check, X } from "lucide-react";

interface PasswordStrengthMeterProps {
  password: string;
}

const PasswordStrengthMeter = ({ password }: PasswordStrengthMeterProps) => {
  if (!password) return null;

  const checks = [
    { label: "Mínimo 8 caracteres", valid: password.length >= 8 },
    { label: "Una letra minúscula", valid: /[a-z]/.test(password) },
    { label: "Una letra mayúscula", valid: /[A-Z]/.test(password) },
    { label: "Un número", valid: /\d/.test(password) },
    { label: "Un carácter especial (!@#$%...)", valid: /[^A-Za-z0-9]/.test(password) },
  ];

  const score = checks.filter((c) => c.valid).length;

  const getStrengthInfo = () => {
    if (score <= 2) {
      return { label: "Débil", color: "bg-red-500", textColor: "text-red-400" };
    }
    if (score <= 4) {
      return { label: "Media", color: "bg-amber-500", textColor: "text-amber-400" };
    }
    return { label: "Excelente", color: "bg-primary", textColor: "text-primary" };
  };

  const strength = getStrengthInfo();

  return (
    <div className="mt-2 space-y-2.5 rounded-xl border border-border/70 bg-surface/60 p-3.5 animate-fadeIn">
      {/* Strength Progress Bar Header */}
      <div className="flex items-center justify-between text-xs font-body">
        <span className="text-text-muted">Fortaleza de la contraseña:</span>
        <span className={`font-semibold tracking-wide ${strength.textColor}`}>{strength.label}</span>
      </div>

      {/* Bar Segments */}
      <div className="grid grid-cols-5 gap-1.5">
        {[1, 2, 3, 4, 5].map((level) => (
          <div
            key={level}
            className={`h-1.5 rounded-full transition-all duration-300 ${
              level <= score ? strength.color : "bg-border/60"
            }`}
          />
        ))}
      </div>

      {/* Criteria Checklist */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 pt-1 text-[11px] font-body text-text-muted">
        {checks.map((c) => (
          <div key={c.label} className="flex items-center gap-1.5">
            {c.valid ? (
              <Check className="h-3.5 w-3.5 text-primary shrink-0" />
            ) : (
              <X className="h-3.5 w-3.5 text-text-muted/50 shrink-0" />
            )}
            <span className={c.valid ? "text-text font-medium" : "text-text-muted/70"}>
              {c.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PasswordStrengthMeter;
