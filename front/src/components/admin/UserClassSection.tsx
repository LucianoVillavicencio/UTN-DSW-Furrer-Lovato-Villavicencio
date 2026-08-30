import { useEffect, useState } from 'react';
import Button from '../common/Button';
import FormAlert from '../common/FormAlert';
import {
  cancelMemberEnrollment,
  changeMemberClass,
  getMemberEnrollments,
} from '../../services/classRegistration.service';
import { formatTimeOfDay, formatWeekdayList } from '../../lib/weekday';
import type { MyEnrollments } from '../../types/classRegistration';
import ClassHourSelect from './ClassHourSelect';
import { classOptionKey, useClassOptions } from './useClassOptions';

interface UserClassSectionProps {
  userId: number;
}

// Lets an admin change a member's class in person, bypassing the monthly
// change cap the self-service classes page enforces — the plan's class-count
// allowance still applies, only the change limit is skipped.
const UserClassSection = ({ userId }: UserClassSectionProps) => {
  const {
    options,
    isLoading: isLoadingOptions,
    error: optionsError,
  } = useClassOptions();
  const [enrollments, setEnrollments] = useState<MyEnrollments | null>(null);
  const [loadedForId, setLoadedForId] = useState<number | null>(null);
  const isLoading = loadedForId !== userId || isLoadingOptions;
  const [loadError, setLoadError] = useState<string | null>(null);
  const [selectedOption, setSelectedOption] = useState('');
  const [replacingGroup, setReplacingGroup] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const load = () =>
    getMemberEnrollments(userId)
      .then((myEnrollments) => {
        setEnrollments(myEnrollments);
        setLoadError(null);
      })
      .catch((err: unknown) => {
        setLoadError(
          err instanceof Error
            ? err.message
            : 'No se pudieron cargar las clases.',
        );
      })
      .finally(() => setLoadedForId(userId));

  // Every setState lives in an async callback, so the effect below only
  // starts the requests instead of updating state while React renders.
  useEffect(() => {
    void load();
  }, [userId]);

  const activeEnrollments = enrollments?.enrollments ?? [];

  const handleChange = async () => {
    setActionError(null);
    const option = options.find((o) => classOptionKey(o) === selectedOption);
    if (!option) {
      setActionError('Elegí una clase y un horario.');
      return;
    }
    setIsSaving(true);
    try {
      const result = await changeMemberClass(
        userId,
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
      const result = await cancelMemberEnrollment(userId, group);
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
      ) : loadError || optionsError ? (
        <FormAlert type="error" message={loadError ?? optionsError} />
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
              <ClassHourSelect
                options={options}
                value={selectedOption}
                onChange={setSelectedOption}
              />

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
