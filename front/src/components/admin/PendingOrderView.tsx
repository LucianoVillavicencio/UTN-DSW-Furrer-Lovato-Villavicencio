import Button from '../common/Button';
import { statusLabel } from './charge-panel';
import { formatDateOnly } from '../../lib/date';
import { formatPriceDisplay } from '../../lib/currency';
import type { OrderView } from './useMemberCharge';

interface PendingOrderViewProps {
  order: OrderView;
  onCancel: () => void;
  isCancelling?: boolean;
}

// Lifted from ChargePanel.tsx's live-order block. Purely presentational: it
// renders whatever `order` it's given, including a 'cancelada' status that
// arrived from a poll (someone else cancelled it, or it expired) — the "clear
// it locally on cancel" behavior lives in useMemberCharge's cancelOrder, not
// here.
const PendingOrderView = ({ order, onCancel, isCancelling }: PendingOrderViewProps) => {
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
        </div>
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
