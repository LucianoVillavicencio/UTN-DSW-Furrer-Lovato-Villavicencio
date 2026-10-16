// Editor for a trainer's weekly work shifts inside TrainerForm: one row per
// weekday with a checkbox and its start/end time, editable once the day is
// ticked, plus a shortcut that repeats the first day's hours on the rest.
// The state changes are the pure helpers in trainer-schedule.ts.

import Checkbox from '../../common/CheckBox';
import { WEEKDAYS } from '../../../lib/weekday';
import {
  copyFirstShiftToAll,
  findShift,
  toggleShiftDay,
  updateShiftHours,
} from './trainer-schedule';

import type { TrainerWorkShift } from '../../../types/trainer';

interface TrainerScheduleFieldProps {
  value: TrainerWorkShift[];
  onChange: (shifts: TrainerWorkShift[]) => void;
}

const TIME_INPUT_CLASS_NAME =
  'rounded-lg border border-border bg-surface px-2 py-1.5 text-sm text-text disabled:opacity-40';

const TrainerScheduleField = ({
  value,
  onChange,
}: TrainerScheduleFieldProps) => (
  <div className="space-y-2">
    <p className="font-body text-xs font-medium text-text sm:text-sm">
      Horario de trabajo
    </p>

    <ul className="divide-y divide-border rounded-xl border border-border">
      {WEEKDAYS.map((day) => {
        const shift = findShift(value, day.value);
        return (
          <li
            key={day.value}
            className="flex flex-wrap items-center justify-between gap-3 px-3 py-2"
          >
            <Checkbox
              label={day.label}
              checked={!!shift}
              onChange={() => onChange(toggleShiftDay(value, day.value))}
              className="w-28"
            />
            <div className="flex items-center gap-2">
              <input
                type="time"
                value={shift?.startTime ?? ''}
                disabled={!shift}
                aria-label={`Hora de inicio (${day.label})`}
                onChange={(e) =>
                  onChange(
                    updateShiftHours(value, day.value, {
                      startTime: e.target.value,
                    }),
                  )
                }
                className={TIME_INPUT_CLASS_NAME}
              />
              <span className="text-text-muted">–</span>
              <input
                type="time"
                value={shift?.endTime ?? ''}
                disabled={!shift}
                aria-label={`Hora de fin (${day.label})`}
                onChange={(e) =>
                  onChange(
                    updateShiftHours(value, day.value, {
                      endTime: e.target.value,
                    }),
                  )
                }
                className={TIME_INPUT_CLASS_NAME}
              />
            </div>
          </li>
        );
      })}
    </ul>

    {value.length > 1 && (
      <button
        type="button"
        onClick={() => onChange(copyFirstShiftToAll(value))}
        className="text-sm text-primary hover:underline"
      >
        Repetir el primer horario en todos los días marcados
      </button>
    )}
  </div>
);

export default TrainerScheduleField;
