import { useEffect, useState } from 'react';
import { Loader2, AlertCircle, CalendarDays, Clock } from 'lucide-react';
import Card from '../common/Card';
import Button from '../common/Button';
import FormAlert from '../common/FormAlert';
import ConfirmDialog from '../admin/ConfirmDialog';
import {
  getMyEnrollments,
  cancelEnrollment,
} from '../../services/classRegistration.service';
import type { Enrollment, MyEnrollments } from '../../types/classRegistration';
import { formatTimeOfDay, formatWeekdayList } from '../../lib/weekday';

// What the member's plan lets them do with classes, in one line.
const allowanceLine = (mine: MyEnrollments): string => {
  if (!mine.hasActivePlan) return 'Necesitás un plan activo para tomar clases.';
  if (mine.maxClasses === null) return 'Tu plan incluye clases ilimitadas.';
  if (mine.maxClasses === 0) return 'Tu plan no incluye clases grupales.';
  const classes =
    mine.maxClasses === 1 ? 'una clase' : `${mine.maxClasses} clases`;
  const changes =
    mine.changesLeft === 1
      ? 'te queda 1 cambio'
      : `te quedan ${mine.changesLeft} cambios`;
  return `Tu plan incluye ${classes} a la vez, y ${changes} de clase este mes (se renuevan el ${mine.resetsOn}).`;
};

const MyClassesSection = () => {
  const [mine, setMine] = useState<MyEnrollments | null>(null);
  // "Loading" is derived from what is in state, so the effect below only starts
  // the request instead of writing state while React renders.
  const [hasLoaded, setHasLoaded] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [pendingCancel, setPendingCancel] = useState<Enrollment | null>(null);
  const [isCancelling, setIsCancelling] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  const fetchMine = () =>
    getMyEnrollments()
      .then((data) => {
        setMine(data);
        setLoadError(null);
      })
      .catch((err: unknown) => {
        setLoadError(
          err instanceof Error
            ? err.message
            : 'No se pudieron cargar tus clases.',
        );
      })
      .finally(() => setHasLoaded(true));

  useEffect(() => {
    void fetchMine();
  }, []);

  const confirmCancel = async () => {
    if (!pendingCancel) return;
    setIsCancelling(true);
    setActionError(null);
    try {
      setMine(await cancelEnrollment(pendingCancel.group));
      setActionSuccess(
        `Cancelamos tu inscripción a ${pendingCancel.className}.`,
      );
      setPendingCancel(null);
    } catch (err) {
      setActionError(
        err instanceof Error ? err.message : 'No se pudo cancelar.',
      );
    } finally {
      setIsCancelling(false);
    }
  };

  if (!hasLoaded) {
    return (
      <div className="flex h-48 flex-col items-center justify-center gap-3 text-text-muted">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm">Cargando tus clases...</p>
      </div>
    );
  }

  if (loadError || !mine) {
    return (
      <Card className="text-center hover:translate-y-0 hover:shadow-lg">
        <AlertCircle className="mx-auto h-10 w-10 text-red-400" />
        <p className="mt-3 text-sm text-text-muted">{loadError}</p>
        <Button
          onClick={() => {
            setHasLoaded(false);
            void fetchMine();
          }}
          variant="secondary"
          size="sm"
          className="mt-4"
        >
          Reintentar
        </Button>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <FormAlert type="success" message={actionSuccess} />
      <FormAlert type="error" message={actionError} />

      <Card className="hover:translate-y-0 hover:shadow-lg">
        <h3 className="font-display text-lg font-semibold text-text">
          Mis clases
        </h3>
        <p className="mt-2 text-sm text-text-muted">{allowanceLine(mine)}</p>
      </Card>

      {mine.enrollments.length === 0 ? (
        <Card className="text-center hover:translate-y-0 hover:shadow-lg">
          <CalendarDays className="mx-auto h-10 w-10 text-text-muted/60" />
          <p className="mt-3 text-sm text-text-muted">
            Todavía no estás inscripto en ninguna clase.
          </p>
          <Button href="/class" variant="secondary" size="sm" className="mt-4">
            Ver clases disponibles
          </Button>
        </Card>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2">
          {mine.enrollments.map((enrollment) => (
            <Card
              key={enrollment.group}
              className="hover:translate-y-0 hover:shadow-lg"
            >
              <h4 className="font-display text-xl font-bold text-text">
                {enrollment.className}
              </h4>

              <p className="mt-3 flex items-center gap-2 text-sm text-text">
                <Clock className="h-4 w-4 text-primary" />
                {formatTimeOfDay(enrollment.startTime)} hs
              </p>
              <p className="mt-1.5 flex items-center gap-2 text-sm text-text-muted">
                <CalendarDays className="h-4 w-4 text-primary" />
                {formatWeekdayList(enrollment.weekdays)} · todas las semanas
              </p>

              <div className="mt-5 flex flex-wrap gap-3">
                <Button href="/class" variant="secondary" size="sm">
                  Cambiar de clase
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  className="text-red-400 border-red-500/20 hover:bg-red-500/10 hover:text-red-300"
                  onClick={() => {
                    setActionSuccess(null);
                    setPendingCancel(enrollment);
                  }}
                >
                  Cancelar
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {pendingCancel && (
        <ConfirmDialog
          title="Cancelar inscripción"
          description={`Vas a dejar ${pendingCancel.className} de los ${formatWeekdayList(
            pendingCancel.weekdays,
          )} a las ${formatTimeOfDay(pendingCancel.startTime)} hs. Volver a inscribirte este mes cuenta como un cambio.`}
          confirmLabel="Cancelar inscripción"
          danger
          isLoading={isCancelling}
          onConfirm={confirmCancel}
          onCancel={() => setPendingCancel(null)}
        />
      )}
    </div>
  );
};

export default MyClassesSection;
