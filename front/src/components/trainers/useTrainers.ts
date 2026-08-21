import { useEffect, useState } from 'react';
import type { Trainer } from '../../types/trainer';
import { getTrainers } from '../../services/trainer.service';

// Fetches the trainer listing (GET /api/v1/trainer, public) and exposes the
// loading/error state TrainersSection consumes.
export const useTrainers = () => {
  const [trainers, setTrainers] = useState<Trainer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTrainers = async () => {
      setIsLoading(true);
      setLoadError(null);
      try {
        const data = await getTrainers();
        setTrainers(Array.isArray(data) ? data : []);
      } catch (error) {
        setLoadError(
          error instanceof Error
            ? error.message
            : 'Error al obtener lista de profesores',
        );
        setTrainers([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTrainers();
  }, []);

  return { trainers, isLoading, loadError };
};
