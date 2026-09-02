import { useState } from 'react';
import { Check, Copy, KeyRound } from 'lucide-react';

interface MemberCredentialsCardProps {
  username: string;
  password: string;
}

// The loudest thing on the wizard: the password exists in the clear here and
// nowhere else — it is stored as a bcrypt hash and cannot be read back — so a
// closed modal with nothing written down means an unreachable account.
const MemberCredentialsCard = ({
  username,
  password,
}: MemberCredentialsCardProps) => {
  const [copied, setCopied] = useState<'user' | 'pass' | null>(null);

  const copy = (value: string, which: 'user' | 'pass') => {
    void navigator.clipboard?.writeText(value);
    setCopied(which);
    window.setTimeout(() => setCopied(null), 2000);
  };

  const row = (
    label: string,
    value: string,
    which: 'user' | 'pass',
    action: string,
  ) => (
    <div className="flex items-center justify-between gap-3">
      <div className="min-w-0">
        <p className="text-xs text-text-muted">{label}</p>
        <p className="truncate font-mono text-base font-semibold text-text sm:text-lg">
          {value}
        </p>
      </div>
      <button
        type="button"
        aria-label={action}
        onClick={() => copy(value, which)}
        className="shrink-0 rounded-lg border border-border p-2 text-text-muted transition-colors hover:border-primary hover:text-primary"
      >
        {copied === which ? (
          <Check className="h-4 w-4" />
        ) : (
          <Copy className="h-4 w-4" />
        )}
      </button>
    </div>
  );

  return (
    <div className="space-y-3 rounded-2xl border-2 border-primary/60 bg-primary/5 p-4">
      <div className="flex items-center gap-2">
        <KeyRound className="h-4 w-4 text-primary" />
        <p className="font-semibold text-text">Datos de acceso</p>
      </div>
      {row('Usuario', username, 'user', 'Copiar usuario')}
      {row('Contraseña', password, 'pass', 'Copiar contraseña')}
      <p className="text-xs text-text-muted">
        Anotá estos datos: la contraseña se muestra una sola vez y no se puede
        recuperar. El socio la cambia la primera vez que entra.
      </p>
    </div>
  );
};

export default MemberCredentialsCard;
