import type { RefundQuote } from '../types/refund';
import type { Payment } from '../types/payment';
import { getApiErrorMessage } from './api-error';
import api from './api';

// Mirrors back/src/modules/refund/refund.controller.ts — admin-only pro-rata
// refund preview + issue. See membership-actions.ts for the pure Spanish
// summary/reason logic that consumes RefundQuote.

// Pure read, no side effects — safe to call as soon as the refund dialog
// opens. 404s when the subscription doesn't exist or has no current-term
// payment to refund.
export const getRefundQuote = async (
  subscriptionId: number,
): Promise<RefundQuote> => {
  try {
    const { data } = await api.get<RefundQuote>(
      `/refund/quote/${subscriptionId}`,
    );
    return data;
  } catch (error) {
    throw new Error(
      getApiErrorMessage(error, 'No se pudo calcular el reembolso.'),
      { cause: error },
    );
  }
};

// Issues the refund: calls Mercado Pago first (if applicable), then cancels
// the subscription, then marks the payment REFUNDED. 409s if the payment was
// already refunded.
export const issueRefund = async (subscriptionId: number): Promise<Payment> => {
  try {
    const { data } = await api.post<Payment>(`/refund/${subscriptionId}`);
    return data;
  } catch (error) {
    throw new Error(
      getApiErrorMessage(error, 'No se pudo emitir el reembolso.'),
      { cause: error },
    );
  }
};
