import InputField from '../common/InputField';
import Button from '../common/Button';
import { formatPriceDisplay, parsePriceInput } from '../../lib/currency';
import type { DurationFormState } from './plan-durations';
import type { DurationMonths } from '../../types/plan';

interface DurationDraftRowProps {
  draft: DurationFormState;
  options: DurationMonths[];
  isSaving: boolean;
  onChange: (draft: DurationFormState) => void;
  onSave: () => void;
  onCancel: () => void;
}

// The three inputs for a new duration row: the month count (only the ones not
// already priced), the day count, and a free-text price with the same live
// preview PlansSection renders for the plan's own price. Split out of
// PlanDurationsField to keep that file under ~200 lines.
const DurationDraftRow = ({
  draft,
  options,
  isSaving,
  onChange,
  onSave,
  onCancel,
}: DurationDraftRowProps) => {
  const price = parsePriceInput(draft.priceText);
  const showPricePreview = draft.priceText && Number.isFinite(price) && price > 0;

  return (
    <div className="mt-2 space-y-3 rounded-xl border border-border bg-surface p-3">
      <div className="grid gap-3 sm:grid-cols-3">
        <div>
          <label className="block font-body text-xs sm:text-sm font-medium text-text mb-1.5">
            Meses
          </label>
          <select
            value={draft.months}
            onChange={(e) =>
              onChange({
                ...draft,
                months: Number(e.target.value) as DurationMonths,
              })
            }
            className="w-full rounded-xl border border-border bg-surface px-3 py-2.5 text-sm text-text focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/40"
          >
            {options.map((m) => (
              <option key={m} value={m}>
                {m} meses
              </option>
            ))}
          </select>
        </div>
        <InputField
          label="Días"
          type="number"
          value={draft.numDaysText}
          onChange={(e) => onChange({ ...draft, numDaysText: e.target.value })}
        />
        <div>
          <InputField
            label="Precio"
            type="text"
            inputMode="decimal"
            placeholder="Ej: 19995 o 19.995,50"
            value={draft.priceText}
            onChange={(e) => onChange({ ...draft, priceText: e.target.value })}
          />
          {showPricePreview && (
            <p className="mt-1 text-xs text-primary">
              Se va a guardar como ${formatPriceDisplay(price)}
            </p>
          )}
        </div>
      </div>
      <div className="flex gap-3">
        <Button size="sm" onClick={onSave} disabled={isSaving}>
          {isSaving ? 'Guardando...' : 'Guardar duración'}
        </Button>
        <Button
          variant="secondary"
          size="sm"
          onClick={onCancel}
          disabled={isSaving}
        >
          Cancelar
        </Button>
      </div>
    </div>
  );
};

export default DurationDraftRow;
