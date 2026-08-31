import Button from '../common/Button';
import InputField from '../common/InputField';
import FormAlert from '../common/FormAlert';
import { usePlanCharge } from './usePlanCharge';
import { PAY_METHODS } from './plan-charge';
import { parsePriceInput, formatPriceDisplay } from '../../lib/currency';
import type { User } from '../../types/user';

interface PlanChargeFormProps {
  selectedUser: User;
  onRegistered: () => void | Promise<void>;
  onChangeMember: () => void;
}

const PlanChargeForm = ({
  selectedUser,
  onRegistered,
  onChangeMember,
}: PlanChargeFormProps) => {
  const {
    plans, plansError, planId, setPlanId, months, setMonths,
    options, resolvedPrice, amountText, setAmountText,
    payMethod, setPayMethod, isSaving, formError, success, submit,
  } = usePlanCharge(selectedUser);

  const handleSubmit = () => {
    void submit(selectedUser.id, onRegistered);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between rounded-xl border border-border bg-surface p-4">
        <div>
          <p className="font-semibold text-text">
            {selectedUser.name} {selectedUser.surname}
          </p>
          <p className="text-xs text-text-muted">
            DNI {selectedUser.dni ?? 'Sin DNI'} · {selectedUser.email}
          </p>
        </div>
        <button
          type="button"
          onClick={onChangeMember}
          className="text-xs text-text-muted hover:text-primary"
        >
          Cambiar
        </button>
      </div>

      <FormAlert type="error" message={plansError} />

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1.5 block font-body text-xs sm:text-sm font-medium text-text">
            Plan
          </label>
          <select
            value={planId}
            onChange={(e) =>
              setPlanId(e.target.value ? Number(e.target.value) : '')
            }
            className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm text-text focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/40"
          >
            <option value="">Elegí un plan</option>
            {plans.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1.5 block font-body text-xs sm:text-sm font-medium text-text">
            Duración
          </label>
          <select
            value={months}
            onChange={(e) => setMonths(Number(e.target.value) as typeof months)}
            disabled={options.length === 0}
            className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm text-text focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/40 disabled:opacity-50"
          >
            {options.map((o) => (
              <option key={o.months} value={o.months}>
                {o.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <FormAlert
        type="warning"
        message={
          resolvedPrice == null
            ? 'Este plan no tiene un precio para esa duración.'
            : null
        }
      />

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <InputField
            label="Monto"
            type="text"
            inputMode="decimal"
            placeholder="Ej: 19995 o 19.995,50"
            value={amountText}
            onChange={(e) => setAmountText(e.target.value)}
          />
          {amountText &&
            Number.isFinite(parsePriceInput(amountText)) &&
            parsePriceInput(amountText) > 0 && (
              <p className="mt-1 text-xs text-primary">
                Se va a registrar como $
                {formatPriceDisplay(parsePriceInput(amountText))}
              </p>
            )}
        </div>
        <div>
          <label className="mb-1.5 block font-body text-xs sm:text-sm font-medium text-text">
            Método
          </label>
          <select
            value={payMethod}
            onChange={(e) => setPayMethod(e.target.value)}
            className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm text-text focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/40"
          >
            {PAY_METHODS.map((m) => (
              <option key={m.value} value={m.value}>
                {m.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <FormAlert type="error" message={formError} />
      <FormAlert type="success" message={success} />

      <Button
        onClick={handleSubmit}
        disabled={isSaving || resolvedPrice == null}
        className="w-full"
      >
        {isSaving ? 'Registrando...' : 'Registrar cobro'}
      </Button>
    </div>
  );
};

export default PlanChargeForm;
