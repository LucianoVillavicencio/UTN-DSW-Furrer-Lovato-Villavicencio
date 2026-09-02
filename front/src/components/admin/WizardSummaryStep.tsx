import { formatPriceDisplay } from '../../lib/currency';
import type { ChargeSummary } from './plan-charge';
import type { User } from '../../types/user';

interface WizardSummaryStepProps {
  user: User;
  summary: ChargeSummary | null;
}

// Everything the admin needs on the slip, in one place, at the end of the
// flow. The credentials card lives in WizardContextRail now, not here — it
// stays visible from step 1 onward instead of being shown only at the end.
const WizardSummaryStep = ({ user, summary }: WizardSummaryStepProps) => (
  <div className="space-y-4">
    <div className="rounded-xl border border-border bg-surface p-4">
      <p className="font-semibold text-text">
        {user.name} {user.surname}
      </p>
      <p className="text-xs text-text-muted">DNI {user.dni ?? 'Sin DNI'}</p>
    </div>

    {summary ? (
      <dl className="space-y-2 rounded-xl border border-border bg-surface p-4 text-sm">
        <div className="flex justify-between">
          <dt className="text-text-muted">Plan</dt>
          <dd className="font-semibold text-text">{summary.plan.name}</dd>
        </div>
        <div className="flex justify-between">
          <dt className="text-text-muted">Período</dt>
          <dd className="font-semibold text-text">{summary.termLabel}</dd>
        </div>
        <div className="flex justify-between">
          <dt className="text-text-muted">Cobrado</dt>
          <dd className="font-semibold text-text">
            ${formatPriceDisplay(summary.amount)}
          </dd>
        </div>
      </dl>
    ) : (
      <p className="rounded-xl border border-border bg-surface p-4 text-sm text-text-muted">
        No se registró ningún cobro. El socio todavía no tiene una suscripción
        activa.
      </p>
    )}
  </div>
);

export default WizardSummaryStep;
