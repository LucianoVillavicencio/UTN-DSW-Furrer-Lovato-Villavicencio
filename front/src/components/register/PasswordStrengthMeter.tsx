import { Check, X } from "lucide-react";

interface PasswordStrengthMeterProps {
  password: string;
}

const PasswordStrengthMeter = ({ password }: PasswordStrengthMeterProps) => {
  if (!password) return null;

  const checks = [
    { label: "Mínimo 8 caracteres", valid: password.length >= 8 },
    { label: "Al menos un número", valid: /\d/.exec(password) !== null },
    { label: "Una letra mayúscula", valid: /[A-Z]/.exec(password) !== null },
  ];

  const score = checks.filter((c) => c.valid).length;

  const getStrengthInfo = () => {
    switch (score) {
      case 1:
        return { label: "Débil", color: "bg-red-500", textColor: "text-red-400" };
      case 2:
        return { label: "Aceptable", color: "bg-yellow-500", textColor: "text-yellow-400" };
      case 3:
        return { label: "Excelente", color: "bg-primary", textColor: "text-primary" };
      default:
        return { label: "Muy débil", color: "bg-red-500/50", textColor: "text-red-400/80" };
    }
  };

  const strength = getStrengthInfo();

  return (
    <div className="mt-2 space-y-2 rounded-xl border border-border/60 bg-surface/50 p-3">
      {/* Strength Progress Bar Header */}
      <div className="flex items-center justify-between text-xs font-body">
        <span className="text-text-muted">Fortaleza de la contraseña:</span>
        <span className={`font-semibold ${strength.textColor}`}>{strength.label}</span>
      </div>

      {/* Bar Segments */}
      <div className="grid grid-cols-3 gap-1.5">
        {[1, 2, 3].map((level) => (
          <div
            key={level}
            className={`h-1.5 rounded-full transition-all duration-300 ${
              level <= score ? strength.color : "bg-border"
            }`}
          />
        ))}
      </div>

      {/* Criteria Checklist */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-1 pt-1 text-[11px] font-body text-text-muted">
        {checks.map((c) => (
          <div key={c.label} className="flex items-center gap-1.5">
            {c.valid ? (
              <Check className="h-3 w-3 text-primary shrink-0" />
            ) : (
              <X className="h-3 w-3 text-text-muted/60 shrink-0" />
            )}
            <span className={c.valid ? "text-text" : "text-text-muted/70"}>
              {c.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PasswordStrengthMeter;
