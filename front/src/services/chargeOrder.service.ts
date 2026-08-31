import { getApiErrorMessage } from './api-error';
import api from './api';

// Mirrors back/src/modules/chargeOrder/chargeOrder.controller.ts — admin-only
// front-desk card (Point) and QR charges. See charge-panel.ts for the panel's
// pure polling/label logic that consumes these responses.

export interface CreateChargeOrderPayload {
  subscriptionId: number;
  months: number;
  method: 'point' | 'qr';
  collectionPointId: string;
}

export interface ChargeOrderCreated {
  id: number;
  status: string; // 'pendiente' immediately after creation
  method: 'point' | 'qr';
  amount: number | string; // MySQL DECIMAL — may arrive as a string
  qrPayload: string | null; // only meaningful for 'qr'; null for 'point'
  expiresAt: string; // ISO datetime
}

export interface ChargeOrderStatus {
  status: string; // 'pendiente' | 'pagada' | 'cancelada' | 'expirada' | 'error'
  method: 'point' | 'qr';
  amount: number | string;
  qrPayload: string | null;
  newEndDate: string | null; // only set once status === 'pagada'
  expiresAt: string; // ISO datetime — same value across polls, doesn't move
  updatedAt: string;
}

// Arms a charge order. A 502 means Mercado Pago rejected it (let the admin
// retry); a 409 means the collection point already has a pending order —
// getApiErrorMessage already surfaces the backend's own message for that.
export const createChargeOrder = async (
  payload: CreateChargeOrderPayload,
): Promise<ChargeOrderCreated> => {
  try {
    const { data } = await api.post<ChargeOrderCreated>(
      '/charge-order',
      payload,
    );
    return data;
  } catch (error) {
    throw new Error(
      getApiErrorMessage(error, 'No se pudo iniciar el cobro.'),
      { cause: error },
    );
  }
};

// The polling endpoint the front-desk panel hits while a charge is armed.
export const getChargeOrder = async (id: number): Promise<ChargeOrderStatus> => {
  try {
    const { data } = await api.get<ChargeOrderStatus>(`/charge-order/${id}`);
    return data;
  } catch (error) {
    throw new Error(
      getApiErrorMessage(error, 'No se pudo consultar el estado del cobro.'),
      { cause: error },
    );
  }
};

// Always succeeds locally even if the Mercado Pago side-effect fails (backend
// guarantee) — any 2xx here means the order is now cancelled.
export const cancelChargeOrder = async (id: number): Promise<void> => {
  try {
    await api.patch(`/charge-order/${id}/cancel`);
  } catch (error) {
    throw new Error(
      getApiErrorMessage(error, 'No se pudo cancelar el cobro.'),
      { cause: error },
    );
  }
};
