import { useEffect, useState } from "react";
import type { Trainer } from "../../types/trainer";
import { getTrainers } from "../../services/trainer.service";

// Trae el listado de profesores desde el backend (GET /api/v1/trainer, público)
// y expone los estados de carga/error que consume TrainersSection.
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
            : "Error al obtener lista de profesores",
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
