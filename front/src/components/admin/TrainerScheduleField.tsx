import { Plus, Trash2 } from 'lucide-react';
import { WEEKDAYS } from '../../lib/weekday';

import type { TrainerWorkShift } from '../../types/trainer';

interface TrainerScheduleFieldProps {
  value: TrainerWorkShift[];
  onChange: (shifts: TrainerWorkShift[]) => void;
}

const nextFreeWeekday = (shifts: TrainerWorkShift[]): number =>
  WEEKDAYS.find((day) => !shifts.some((shift) => shift.weekday === day.value))
    ?.value ?? 1;

const TrainerScheduleField = ({
  value,
  onChange,
}: TrainerScheduleFieldProps) => {
  const update = (index: number, patch: Partial<TrainerWorkShift>) =>
    onChange(
      value.map((shift, i) => (i === index ? { ...shift, ...patch } : shift)),
    );

  return (
    <div className="space-y-2">
      <p className="font-body text-xs font-medium text-text sm:text-sm">
        Horario de trabajo
      </p>

      {value.map((shift, index) => (
        <div key={index} className="flex items-center gap-2">
          <select
            value={shift.weekday}
            aria-label="Día"
            onChange={(e) => update(index, { weekday: Number(e.target.value) })}
            className="rounded-lg border border-border bg-surface px-2 py-2 text-sm text-text"
          >
            {WEEKDAYS.map((day) => (
              <option key={day.value} value={day.value}>
                {day.label}
              </option>
            ))}
          </select>

          <input
            type="time"
            value={shift.startTime}
            aria-label="Hora de inicio"
            onChange={(e) => update(index, { startTime: e.target.value })}
            className="rounded-lg border border-border bg-surface px-2 py-2 text-sm text-text"
          />
          <span className="text-text-muted">–</span>
          <input
            type="time"
            value={shift.endTime}
            aria-label="Hora de fin"
            onChange={(e) => update(index, { endTime: e.target.value })}
            className="rounded-lg border border-border bg-surface px-2 py-2 text-sm text-text"
          />

          <button
            type="button"
            onClick={() => onChange(value.filter((_, i) => i !== index))}
            aria-label="Quitar franja"
            className="rounded-lg p-1.5 text-text-muted hover:text-red-400"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      ))}

      {value.length < WEEKDAYS.length && (
        <button
          type="button"
          onClick={() =>
            onChange([
              ...value,
              {
                weekday: nextFreeWeekday(value),
                startTime: '08:00',
                endTime: '12:00',
              },
            ])
          }
          className="flex items-center gap-1.5 text-sm text-primary hover:underline"
        >
          <Plus className="h-4 w-4" />
          Agregar franja
        </button>
      )}
    </div>
  );
};

export default TrainerScheduleField;
