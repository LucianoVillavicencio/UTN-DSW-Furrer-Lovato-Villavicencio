import type { SavedCard } from '../types/savedCard';
import { getApiErrorMessage } from './api-error';
import api from './api';

// Self-service: the member's own saved card, mounted at api/v1/saved-card.
export const getMySavedCard = async (): Promise<SavedCard | null> => {
  try {
    const { data } = await api.get<SavedCard | null>('/saved-card');
    return data ?? null;
  } catch (error) {
    throw new Error(
      getApiErrorMessage(error, 'No se pudo obtener tu tarjeta guardada.'),
      { cause: error },
    );
  }
};

// Saves the token the Card Payment Brick returned. Replaces the member's
// active card server-side — nothing else to do here on that front.
export const saveCard = async (cardToken: string): Promise<SavedCard> => {
  try {
    const { data } = await api.post<SavedCard>('/saved-card', { cardToken });
    return data;
  } catch (error) {
    throw new Error(getApiErrorMessage(error, 'No se pudo guardar la tarjeta.'), {
      cause: error,
    });
  }
};

export const deleteCard = async (id: number): Promise<void> => {
  try {
    await api.delete(`/saved-card/${id}`);
  } catch (error) {
    throw new Error(getApiErrorMessage(error, 'No se pudo eliminar la tarjeta.'), {
      cause: error,
    });
  }
};
