import { useEffect, useState } from 'react';
import Button from '../common/Button';
import FormAlert from '../common/FormAlert';
import { getPlans } from '../../services/plan.service';
import { assignPlanToMember } from '../../services/subscription.service';
import { formatPriceDisplay } from '../../lib/currency';
import type { Plan } from '../../types/plan';

interface AssignPlanFormProps {
  userId: number;
  onAssigned: () => void | Promise<void>;
}

// Shared by the Users panel and the new-member wizard: an admin picks a plan
// and the member's active subscription is replaced by one on that plan.
const AssignPlanForm = ({ userId, onAssigned }: AssignPlanFormProps) => {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [selectedPlanId, setSelectedPlanId] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Every setState lives in an async callback, so the effect below only starts
  // the request instead of updating state while React renders.
  useEffect(() => {
    void getPlans()
      .then((data) => setPlans(data.filter((p) => !p.deleted)))
      .catch((err: unknown) => {
        setError(
          err instanceof Error
            ? err.message
            : 'No se pudieron cargar los planes.',
        );
      });
  }, []);

  const handleAssign = async () => {
    setError(null);
    if (!selectedPlanId) {
      setError('Elegí un plan.');
      return;
    }
    setIsSaving(true);
    try {
      await assignPlanToMember(userId, Number(selectedPlanId));
      setSelectedPlanId('');
      await onAssigned();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'No se pudo asignar el plan.',
      );
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-2">
      <div className="grid gap-2 sm:grid-cols-[1fr_auto]">
        <select
          value={selectedPlanId}
          onChange={(e) => setSelectedPlanId(e.target.value)}
          aria-label="Plan"
          className="rounded-xl border border-border bg-surface px-3 py-2 text-sm text-text focus:border-primary focus:outline-none"
        >
          <option value="">Elegir plan...</option>
          {plans.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name} — ${formatPriceDisplay(p.price)} · {p.numDays} días
            </option>
          ))}
        </select>
        <Button
          size="sm"
          onClick={() => void handleAssign()}
          disabled={isSaving || !selectedPlanId}
        >
          {isSaving ? 'Asignando...' : 'Asignar plan'}
        </Button>
      </div>
      <p className="text-xs text-text-muted">
        Reemplaza la suscripción activa, si tiene una.
      </p>
      <FormAlert type="error" message={error} />
    </div>
  );
};

export default AssignPlanForm;
