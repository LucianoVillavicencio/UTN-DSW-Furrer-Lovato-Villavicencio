import { useEffect, useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import FormAlert from '../common/FormAlert';
import DurationDraftRow from './DurationDraftRow';
import {
  getPlanDurations,
  createPlanDuration,
  deletePlanDuration,
} from '../../services/plan.service';
import { formatPriceDisplay } from '../../lib/currency';
import {
  availableMonths,
  findDurationFormError,
  toDurationPayload,
  type DurationFormState,
} from './plan-durations';
import type { PlanDuration } from '../../types/plan';

interface PlanDurationsFieldProps {
  planId: number;
}

// Optional longer commitments on a plan. A plan with no rows here is sold by
// the month exactly as before, which is why the empty state is not a warning.
const PlanDurationsField = ({ planId }: PlanDurationsFieldProps) => {
  const [durations, setDurations] = useState<PlanDuration[]>([]);
  // The list is tagged with the plan it belongs to, so the spinner is derived
  // from the prop instead of an effect resetting a flag.
  const [loadedFor, setLoadedFor] = useState<number | null>(null);
  const isLoading = loadedFor !== planId;
  const [error, setError] = useState<string | null>(null);
  const [draft, setDraft] = useState<DurationFormState | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Every setState lives in an async callback, so the effect below only starts
  // the request instead of updating state while React renders.
  useEffect(() => {
    void getPlanDurations(planId)
      .then((data) => {
        setDurations(data);
        setError(null);
      })
      .catch((err: unknown) => {
        setError(
          err instanceof Error
            ? err.message
            : 'No se pudieron cargar las duraciones.',
        );
      })
      .finally(() => setLoadedFor(planId));
  }, [planId]);

  const options = availableMonths(durations);

  const handleAdd = async () => {
    if (!draft) return;
    const formError = findDurationFormError(draft, durations);
    if (formError) {
      setError(formError);
      return;
    }
    setError(null);
    setIsSaving(true);
    try {
      const created = await createPlanDuration(planId, toDurationPayload(draft));
      setDurations((prev) => [...prev, created].sort((a, b) => a.months - b.months));
      setDraft(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo guardar.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleRemove = async (duration: PlanDuration) => {
    if (!duration.id) return;
    setError(null);
    setIsSaving(true);
    try {
      await deletePlanDuration(planId, duration.id);
      setDurations((prev) => prev.filter((d) => d.id !== duration.id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo eliminar.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="border-t border-border pt-4">
      <div className="mb-2 flex items-center justify-between">
        <span className="font-body text-xs sm:text-sm font-medium text-text">
          Duraciones con precio propio
        </span>
        {options.length > 0 && !draft && (
          <button
            type="button"
            onClick={() =>
              setDraft({
                months: options[0],
                numDaysText: String(options[0] * 30),
                priceText: '',
              })
            }
            className="flex items-center gap-1 text-xs font-semibold text-primary hover:text-primary-hover"
          >
            <Plus className="h-3 w-3" />
            Agregar
          </button>
        )}
      </div>

      <FormAlert type="error" message={error} />

      {isLoading ? (
        <p className="text-xs text-text-muted">Cargando duraciones...</p>
      ) : durations.length === 0 && !draft ? (
        <p className="text-xs text-text-muted">
          Sin duraciones. El plan se vende por mes al precio de arriba.
        </p>
      ) : (
        <ul className="space-y-2">
          {durations.map((d) => (
            <li
              key={d.id}
              className="flex items-center justify-between rounded-xl border border-border bg-surface px-3 py-2 text-sm"
            >
              <span className="text-text">
                {d.months} meses · {d.numDays} días · $
                {formatPriceDisplay(d.price)}
              </span>
              <button
                type="button"
                onClick={() => void handleRemove(d)}
                disabled={isSaving}
                aria-label={`Quitar la duración de ${d.months} meses`}
                className="rounded-lg p-1.5 text-text-muted hover:text-red-400"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </li>
          ))}
        </ul>
      )}

      {draft && (
        <DurationDraftRow
          draft={draft}
          options={options}
          isSaving={isSaving}
          onChange={setDraft}
          onSave={() => void handleAdd()}
          onCancel={() => {
            setDraft(null);
            setError(null);
          }}
        />
      )}

      <p className="mt-2 text-xs text-text-muted">
        Cada duración tiene su propio precio total. Cambiarlo no afecta a las
        suscripciones ya vendidas.
      </p>
    </div>
  );
};

export default PlanDurationsField;
