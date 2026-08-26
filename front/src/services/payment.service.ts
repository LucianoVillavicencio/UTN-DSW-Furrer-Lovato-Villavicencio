import type { Payment, ManualPaymentPayload } from '../types/payment';
import { AxiosError } from 'axios';
import api from './api';

interface NestErrorBody {
  message?: string | string[];
  error?: string;
  statusCode?: number;
}

const getErrorMessage = (error: unknown, fallback: string): string => {
  if (!(error instanceof AxiosError)) return fallback;
  if (!error.response) {
    return 'No se pudo conectar con el servidor. Verifica tu conexión a internet.';
  }
  const data = error.response.data as NestErrorBody | undefined;
  const backendMessage = Array.isArray(data?.message)
    ? data.message.join(', ')
    : data?.message;
  return backendMessage || fallback;
};

// Self-service: payment history of the authenticated user.
export const getMyPayments = async (): Promise<Payment[]> => {
  try {
    const { data } = await api.get<Payment[]>('/Payment/me');
    return data;
  } catch (error) {
    throw new Error(
      getErrorMessage(error, 'No se pudo obtener tu historial de pagos.'),
      { cause: error },
    );
  }
};

// Admin-only: in-person payment.
export const createManualPayment = async (
  payload: ManualPaymentPayload,
): Promise<Payment> => {
  try {
    const { data } = await api.post<Payment>('/Payment/manual', payload);
    return data;
  } catch (error) {
    throw new Error(getErrorMessage(error, 'No se pudo registrar el pago.'), {
      cause: error,
    });
  }
};

// Admin-only: every payment, for the "Pagos presenciales" section.
export const getPayments = async (): Promise<Payment[]> => {
  try {
    const { data } = await api.get<Payment[]>('/Payment');
    return data;
  } catch (error) {
    throw new Error(getErrorMessage(error, 'Error al obtener lista de pagos'), {
      cause: error,
    });
  }
};

// Admin-only: payment history of one specific user (Users panel).
export const getPaymentsByUser = async (
  userId: number,
): Promise<Payment[]> => {
  try {
    const { data } = await api.get<Payment[]>(`/Payment/by-user/${userId}`);
    return data;
  } catch (error) {
    throw new Error(
      getErrorMessage(error, 'No se pudo obtener el historial de pagos.'),
      { cause: error },
    );
  }
};
