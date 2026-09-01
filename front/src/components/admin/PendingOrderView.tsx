import Button from '../common/Button';
import { statusLabel } from './charge-panel';
import { formatDateOnly } from '../../lib/date';
import { formatPriceDisplay } from '../../lib/currency';
import type { OrderView } from './useMemberCharge';

// The statuses that leave nothing to wait for and nothing to cancel — the only
// way forward is to arm a fresh order. Mirrors charge-panel.ts's terminal set
// minus 'pagada', which gets its own "Nuevo cobro" wording instead.
const RETRYABLE_STATUSES = ['cancelada', 'expirada', 'error'];

interface PendingOrderViewProps {
  order: OrderView;
  onCancel: () => void;
  isCancelling?: boolean;
  // Clears the finished order so the admin can charge the same member again
  // without re-searching them. Optional: the block still renders without it,
  // just with no way out of a terminal state.
  onReset?: () => void;
}

// Lifted from ChargePanel.tsx's live-order block. Purely presentational: it
// renders whatever `order` it's given, including a 'cancelada' status that
// arrived from a poll (someone else cancelled it, or it expired) — the "clear
// it locally on cancel" behavior lives in useMemberCharge's cancelOrder, not
// here.
const PendingOrderView = ({
  order,
  onCancel,
  isCancelling,
  onReset,
}: PendingOrderViewProps) => {
  const isPending = order.status === 'pendiente';

  return (
    <div className="space-y-3 rounded-xl border border-border p-4 text-center">
      <p className="font-display text-lg font-semibold text-text">
        {statusLabel(order.status, order.method)}
      </p>
      <p className="text-sm text-text-muted">
        Monto: ${formatPriceDisplay(order.amount)}
      </p>

      {order.method === 'qr' && isPending && (
        <p className="text-xs text-text-muted">
          Pedile al socio que escanee el QR impreso en el
          mostrador desde la app.
        </p>
      )}

      {order.status === 'pagada' && (
        <div>
          <p className="text-sm text-text">
            Se cobraron ${formatPriceDisplay(order.amount)}.
          </p>
          {order.newEndDate && (
            <p className="text-sm text-text-muted">
              Nueva vigencia: {formatDateOnly(order.newEndDate)}
            </p>
          )}
          {onReset && (
            <Button
              onClick={onReset}
              variant="secondary"
              size="sm"
              className="mt-3"
            >
              Nuevo cobro
            </Button>
          )}
        </div>
      )}

      {onReset && RETRYABLE_STATUSES.includes(order.status) && (
        <Button onClick={onReset} variant="secondary" size="sm">
          Reintentar
        </Button>
      )}

      {isPending && (
        <Button
          onClick={onCancel}
          disabled={isCancelling}
          variant="secondary"
          className="w-full"
        >
          {isCancelling ? 'Cancelando...' : 'Cancelar cobro'}
        </Button>
      )}
    </div>
  );
};

export default PendingOrderView;
