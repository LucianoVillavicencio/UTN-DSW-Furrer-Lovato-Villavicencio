import { UserX } from 'lucide-react';
import Container from '../common/Container';
import FormAlert from '../common/FormAlert';
import TrainerCard from './TrainerCard';
import { useTrainers } from './useTrainers';

// Same structure as ClassEnrollmentSection: the page builds the layout and the
// section owns the data — loading, error and empty states.
const TrainersSection = () => {
  const { trainers, isLoading, loadError } = useTrainers();

  return (
    <section id="trainers" className="bg-background py-20">
      <Container>
        {loadError && (
          <div className="mb-8">
            <FormAlert type="error" message={loadError} />
          </div>
        )}

        {isLoading ? (
          <div className="flex h-64 items-center justify-center">
            <div className="flex flex-col items-center gap-3">
              <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
              <p className="text-sm font-medium text-text-muted">
                Cargando nuestro equipo de profesores...
              </p>
            </div>
          </div>
        ) : trainers.length === 0 ? (
          <div className="rounded-2xl border border-border bg-surface/40 py-16 text-center">
            <UserX className="mx-auto h-12 w-12 text-text-muted/50" />
            <h3 className="mt-4 text-lg font-semibold text-text">
              No hay profesores para mostrar
            </h3>
            <p className="mt-1 text-sm text-text-muted">
              Estamos actualizando el equipo. Volvé a intentarlo en unos
              minutos.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {trainers.map((trainer) => (
              <TrainerCard key={trainer.dni} trainer={trainer} />
            ))}
          </div>
        )}
      </Container>
    </section>
  );
};

export default TrainersSection;
