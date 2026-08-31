import Card from '../common/Card';
import Button from '../common/Button';
import FormAlert from '../common/FormAlert';
import OwnerPasswordPrompt from './OwnerPasswordPrompt';
import { useOwnerAnalytics } from './useOwnerAnalytics';
import { RevenueChart, BreakdownList } from './analytics-charts';
import { formatPriceDisplay } from '../../lib/currency';

// Locked, this shows the password prompt. Unlocked, it shows stats, a
// revenue chart and two breakdowns. A failed request never renders zeroes:
// the FormAlert + retry stay up and the previous overview (if any) stays on
// screen underneath it, so a transient failure never reads as "no revenue".
const OwnerAnalyticsPanel = () => {
  const {
    isUnlocked,
    overview,
    isLoading,
    error,
    granularity,
    unlock,
    reload,
    lock,
  } = useOwnerAnalytics();

  if (!isUnlocked) {
    return (
      <OwnerPasswordPrompt isLoading={isLoading} error={error} onUnlock={unlock} />
    );
  }

  const planTotal = overview?.byPlan.reduce((sum, p) => sum + p.total, 0) ?? 0;
  const methodTotal = overview?.byMethod.reduce((sum, m) => sum + m.total, 0) ?? 0;
  const hasRevenue = (overview?.revenue.length ?? 0) > 0;

  return (
    <Card className="hover:translate-y-0 hover:shadow-lg">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="font-display text-lg font-bold text-text">Panel financiero</h3>
        <Button type="button" variant="secondary" size="sm" onClick={lock}>
          Bloquear
        </Button>
      </div>

      {error && (
        <div className="mb-4 space-y-2">
          <FormAlert type="error" message={error} />
          <button
            type="button"
            onClick={() => void reload(granularity)}
            className="text-xs font-body text-primary hover:underline"
          >
            Reintentar
          </button>
        </div>
      )}

      {overview && (
        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-xl border border-border bg-background p-4">
              <p className="text-sm text-text-muted">Suscripciones activas</p>
              <p className="mt-1 font-display text-2xl font-bold text-text">
                {overview.activeSubscriptions}
              </p>
            </div>
            <div className="rounded-xl border border-border bg-background p-4">
              <p className="text-sm text-text-muted">MRR estimado</p>
              <p className="mt-1 font-display text-2xl font-bold text-text">
                ${formatPriceDisplay(overview.estimatedMrr)}
              </p>
              <p className="mt-1 text-xs text-text-muted">
                Proyección a partir de las suscripciones activas — no es
                ingreso ya facturado.
              </p>
            </div>
          </div>

          <div>
            <div className="mb-3 flex items-center justify-between">
              <h4 className="font-body text-sm font-semibold text-text">Ingresos</h4>
              <div className="flex gap-1 rounded-full border border-border p-1">
                {(['month', 'day'] as const).map((option) => (
                  <button
                    key={option}
                    type="button"
                    disabled={isLoading}
                    onClick={() => void reload(option)}
                    className={`rounded-full px-3 py-1 text-xs font-body transition-colors disabled:opacity-50 ${
                      granularity === option
                        ? 'bg-primary text-background'
                        : 'text-text-muted hover:text-text'
                    }`}
                  >
                    {option === 'month' ? 'Mensual' : 'Diario'}
                  </button>
                ))}
              </div>
            </div>
            {hasRevenue ? (
              <RevenueChart points={overview.revenue} />
            ) : (
              <p className="text-sm text-text-muted">
                No se registraron pagos en el período seleccionado.
              </p>
            )}
          </div>

          <div className="grid gap-6 sm:grid-cols-2">
            <BreakdownList
              title="Por plan"
              rows={overview.byPlan.map((p) => ({
                key: String(p.planId),
                label: p.planName,
                total: p.total,
              }))}
              total={planTotal}
            />
            <BreakdownList
              title="Por método de pago"
              rows={overview.byMethod.map((m) => ({
                key: m.payMethod,
                label: m.payMethod,
                total: m.total,
              }))}
              total={methodTotal}
            />
          </div>
        </div>
      )}
    </Card>
  );
};

export default OwnerAnalyticsPanel;
