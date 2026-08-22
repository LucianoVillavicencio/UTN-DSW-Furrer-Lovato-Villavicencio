import { useEffect, useState } from 'react';
import { getClass } from '../../services/class.service';
import { getClassSession } from '../../services/classSession.service';
import { groupSessionsByHour, type ClassHour } from '../classes/class-hours';
import type { Class } from '../../types/class';
import type { ClassSession } from '../../types/classSession';

export interface ClassOption extends ClassHour {
  className: string;
}

export const classOptionKey = (
  option: Pick<ClassOption, 'classId' | 'startTime'>,
): string => `${option.classId}-${option.startTime}`;

const buildOptions = (
  classes: Class[],
  sessions: ClassSession[],
): ClassOption[] =>
  classes.flatMap((c) =>
    groupSessionsByHour(sessions, c.id ?? 0).map((hour) => ({
      ...hour,
      className: c.name,
    })),
  );

/**
 * Every class-at-an-hour an admin can put a member into. Loaded once per
 * mount; shared by the Users panel and the new-member wizard.
 */
export const useClassOptions = (): {
  options: ClassOption[];
  isLoading: boolean;
  error: string | null;
} => {
  const [options, setOptions] = useState<ClassOption[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Every setState lives in an async callback, so the effect below only starts
  // the requests instead of updating state while React renders.
  useEffect(() => {
    void Promise.all([getClass(), getClassSession()])
      .then(([classes, sessions]) => {
        setOptions(buildOptions(classes, sessions));
        setError(null);
      })
      .catch((err: unknown) => {
        setError(
          err instanceof Error
            ? err.message
            : 'No se pudieron cargar las clases.',
        );
      })
      .finally(() => setIsLoading(false));
  }, []);

  return { options, isLoading, error };
};
