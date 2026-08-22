import { useEffect, useState } from 'react';
import Button from '../common/Button';
import FormAlert from '../common/FormAlert';
import { getClass } from '../../services/class.service';
import { getClassSession } from '../../services/classSession.service';
import {
  cancelMemberEnrollment,
  changeMemberClass,
  getMemberEnrollments,
} from '../../services/classRegistration.service';
import { groupSessionsByHour, type ClassHour } from '../classes/class-hours';
import { formatTimeOfDay, formatWeekdayList } from '../../lib/weekday';
import type { MyEnrollments } from '../../types/classRegistration';
import type { Class } from '../../types/class';

interface UserClassSectionProps {
  userDni: number;
}

interface ClassOption extends ClassHour {
  className: string;
}

const optionKey = (o: Pick<ClassOption, 'classId' | 'startTime'>) =>
  `${o.classId}-${o.startTime}`;

const buildOptions = (
  classes: Class[],
  sessions: Parameters<typeof groupSessionsByHour>[0],
): ClassOption[] =>
  classes.flatMap((c) =>
    groupSessionsByHour(sessions, c.id ?? 0).map((hour) => ({
      ...hour,
      className: c.name,
    })),
  );

// Lets an admin change a member's class in person, bypassing the monthly
// change cap the self-service classes page enforces — the plan's class-count
// allowance still applies, only the change limit is skipped.
const UserClassSection = ({ userDni }: UserClassSectionProps) => {
  const [enrollments, setEnrollments] = useState<MyEnrollments | null>(null);
  const [options, setOptions] = useState<ClassOption[]>([]);
  // "Loading" is derived from which member the data in state belongs to, so
  // switching members shows the spinner without this component writing state
  // from inside an effect.
  const [loadedForDni, setLoadedForDni] = useState<number | null>(null);
  const isLoading = loadedForDni !== userDni;
  const [loadError, setLoadError] = useState<string | null>(null);
  const [selectedOption, setSelectedOption] = useState('');
  const [replacingGroup, setReplacingGroup] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const load = () =>
    Promise.all([getMemberEnrollments(userDni), getClass(), getClassSession()])
      .then(([myEnrollments, classes, sessions]) => {
        setEnrollments(myEnrollments);
        setOptions(buildOptions(classes, sessions));
        setLoadError(null);
      })
      .catch((err: unknown) => {
        setLoadError(
          err instanceof Error
            ? err.message
            : 'No se pudieron cargar las clases.',
        );
      })
      .finally(() => setLoadedForDni(userDni));

  // Every setState lives in an async callback, so the effect below only
  // starts the requests instead of updating state while React renders.
  useEffect(() => {
    void load();
  }, [userDni]);

  const activeEnrollments = enrollments?.enrollments ?? [];

  const handleChange = async () => {
    setActionError(null);
    const option = options.find((o) => optionKey(o) === selectedOption);
    if (!option) {
      setActionError('Elegí una clase y un horario.');
      return;
    }
    setIsSaving(true);
    try {
      const result = await changeMemberClass(
        userDni,
        option.classId,
        option.startTime,
        replacingGroup || undefined,
      );
      setEnrollments(result);
      setSelectedOption('');
      setReplacingGroup('');
    } catch (err) {
      setActionError(
        err instanceof Error ? err.message : 'No se pudo cambiar la clase.',
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = async (group: string) => {
    setActionError(null);
    setIsSaving(true);
    try {
      const result = await cancelMemberEnrollment(userDni, group);
      setEnrollments(result);
    } catch (err) {
      setActionError(
        err instanceof Error ? err.message : 'No se pudo cancelar la clase.',
      );
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <section className="border-t border-border pt-4">
      <h4 className="font-display text-sm font-semibold uppercase tracking-wide text-text-muted">
        Clases
      </h4>

      {isLoading ? (
        <p className="mt-3 text-sm text-text-muted">Cargando...</p>
      ) : loadError ? (
        <FormAlert type="error" message={loadError} />
      ) : (
        <>
          {activeEnrollments.length === 0 ? (
            <p className="mt-3 text-sm text-text-muted">
              No tiene clases asignadas.
            </p>
          ) : (
            <ul className="mt-3 space-y-2">
              {activeEnrollments.map((e) => (
                <li
                  key={e.group}
                  className="flex items-center justify-between rounded-xl border border-border bg-surface px-3 py-2 text-sm"
                >
                  <div>
                    <span className="font-semibold text-text">
                      {e.className}
                    </span>{' '}
                    <span className="text-text-muted">
                      — {formatWeekdayList(e.weekdays)} a las{' '}
                      {formatTimeOfDay(e.startTime)} hs
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => void handleCancel(e.group)}
                    disabled={isSaving}
                    className="text-xs font-semibold text-red-400 hover:text-red-300"
                  >
                    Cancelar
                  </button>
                </li>
              ))}
            </ul>
          )}

          <FormAlert type="error" message={actionError} />

          <div className="mt-4 space-y-2">
            <div className="grid gap-2 sm:grid-cols-2">
              <select
                value={selectedOption}
                onChange={(e) => setSelectedOption(e.target.value)}
                className="rounded-xl border border-border bg-surface px-3 py-2 text-sm text-text"
              >
                <option value="">Elegir clase y horario...</option>
                {options.map((o) => (
                  <option key={optionKey(o)} value={optionKey(o)}>
                    {o.className} — {formatWeekdayList(o.weekdays)}{' '}
                    {formatTimeOfDay(o.startTime)} hs
                  </option>
                ))}
              </select>

              {activeEnrollments.length > 0 && (
                <select
                  value={replacingGroup}
                  onChange={(e) => setReplacingGroup(e.target.value)}
                  className="rounded-xl border border-border bg-surface px-3 py-2 text-sm text-text"
                >
                  <option value="">
                    {activeEnrollments.length === 1
                      ? 'Reemplaza la única clase que tiene'
                      : 'Elegir cuál clase reemplazar...'}
                  </option>
                  {activeEnrollments.map((e) => (
                    <option key={e.group} value={e.group}>
                      Reemplazar {e.className} {formatTimeOfDay(e.startTime)}{' '}
                      hs
                    </option>
                  ))}
                </select>
              )}
            </div>

            <Button
              size="sm"
              onClick={() => void handleChange()}
              disabled={isSaving || !selectedOption}
            >
              {isSaving ? 'Guardando...' : 'Asignar clase'}
            </Button>
          </div>
        </>
      )}
    </section>
  );
};

export default UserClassSection;
