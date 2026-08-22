import { useEffect, useState } from 'react';
import {
  createTrainer,
  deleteTrainer,
  getDeletedTrainers,
  getTrainers,
  restoreTrainer,
  updateTrainer,
} from '../../services/trainer.service';

import type { Trainer } from '../../types/trainer';

export const useAdminTrainers = (showDeleted: boolean) => {
  const [trainers, setTrainers] = useState<Trainer[]>([]);
  // "Loading" is derived from the filter the list in state came from, so
  // toggling the deleted filter shows the spinner without this hook writing
  // state from inside an effect.
  const [loadedFilter, setLoadedFilter] = useState<boolean | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [listError, setListError] = useState<string | null>(null);

  const isLoading = loadedFilter !== showDeleted;

  const fetchTrainers = (deleted: boolean) =>
    (deleted ? getDeletedTrainers() : getTrainers())
      .then((data) => {
        setTrainers(data);
        setLoadError(null);
      })
      .catch((err: unknown) => {
        setLoadError(
          err instanceof Error ? err.message : 'No se pudo cargar la lista.',
        );
      })
      .finally(() => setLoadedFilter(deleted));

  useEffect(() => {
    void fetchTrainers(showDeleted);
  }, [showDeleted]);

  const reload = () => {
    setLoadedFilter(null);
    return fetchTrainers(showDeleted);
  };

  const save = async (form: Trainer, isCreating: boolean): Promise<Trainer> =>
    isCreating ? await createTrainer(form) : await updateTrainer(form);

  const remove = async (trainer: Trainer): Promise<void> => {
    if (showDeleted) {
      await restoreTrainer(trainer.dni);
    } else {
      await deleteTrainer(trainer.dni);
    }
  };

  return {
    trainers,
    isLoading,
    loadError,
    listError,
    setListError,
    reload,
    save,
    remove,
  };
};
