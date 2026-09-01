import { Banknote, CreditCard, QrCode } from 'lucide-react';
import { CHARGE_METHODS, type ChargeMethod } from './plan-charge';

// The cash family (efectivo/debito/credito/transferencia) shares Banknote;
// Point and QR each get their own icon — see ChargePanel.tsx's old METHODS
// array, which this table replaces now that CHARGE_METHODS has six entries.
const ICONS: Record<ChargeMethod, typeof Banknote> = {
  efectivo: Banknote,
  debito: Banknote,
  credito: Banknote,
  transferencia: Banknote,
  point: CreditCard,
  qr: QrCode,
};

interface ChargeMethodTilesProps {
  value: ChargeMethod;
  onChange: (method: ChargeMethod) => void;
  disabled?: boolean;
  unavailable?: Partial<Record<ChargeMethod, string>>;
}

const ChargeMethodTiles = ({
  value,
  onChange,
  disabled,
  unavailable,
}: ChargeMethodTilesProps) => (
  <div className="flex flex-wrap gap-2">
    {CHARGE_METHODS.map((m) => {
      const unavailableMessage = unavailable?.[m.value];
      const isDisabled = disabled || Boolean(unavailableMessage);
      const Icon = ICONS[m.value];
      return (
        <button
          key={m.value}
          type="button"
          disabled={isDisabled}
          title={unavailableMessage}
          onClick={() => onChange(m.value)}
          className={`flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
            value === m.value
              ? 'border-primary bg-primary/10 text-primary'
              : 'border-border text-text hover:border-primary/40'
          }`}
        >
          <Icon className="h-4 w-4" />
          {m.label}
        </button>
      );
    })}
  </div>
);

export default ChargeMethodTiles;
