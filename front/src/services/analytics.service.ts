import type { AnalyticsOverview } from '../types/analytics';
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

// The password travels in the body, never in the URL: the backend writes
// request.url to its security log. It is passed on every call — the panel
// keeps no "unlocked" flag that outlives the value.
export const getAnalyticsOverview = async (
  ownerPassword: string,
  query: { from?: string; to?: string; granularity?: 'day' | 'month' } = {},
): Promise<AnalyticsOverview> => {
  try {
    const { data } = await api.post<AnalyticsOverview>('/analytics/overview', {
      ownerPassword,
      ...query,
    });
    return data;
  } catch (error) {
    throw new Error(
      getErrorMessage(error, 'No se pudo obtener la información financiera.'),
      { cause: error },
    );
  }
};
