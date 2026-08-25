import { Plus, X } from 'lucide-react';
import InputField from '../common/InputField';
import FormAlert from '../common/FormAlert';
import Button from '../common/Button';
import type { Class } from '../../types/class';
import { WEEKDAYS } from '../../lib/weekday';
import type { ClassSessionFormState } from './class-session-form';

interface ClassSessionFormProps {
  form: ClassSessionFormState;
  classes: Class[];
  error: string | null;
  isSaving: boolean;
  // Editing moves one existing slot; creating fills the weekly grid.
  isEditing: boolean;
  onChange: (form: ClassSessionFormState) => void;
  onSubmit: () => void;
  onCancel: () => void;
}

const ClassSessionForm = ({
  form,
  classes,
  error,
  isSaving,
  isEditing,
  onChange,
  onSubmit,
  onCancel,
}: ClassSessionFormProps) => {
  const toggleWeekday = (value: number) => {
    if (isEditing) {
      onChange({ ...form, weekdays: [value] });
      return;
    }
    onChange({
      ...form,
      weekdays: form.weekdays.includes(value)
        ? form.weekdays.filter((d) => d !== value)
        : [...form.weekdays, value],
    });
  };

  const setTime = (index: number, value: string) => {
    onChange({
      ...form,
      times: form.times.map((t, i) => (i === index ? value : t)),
    });
  };

  const slotCount = form.weekdays.length * form.times.filter((t) => t).length;

  return (
    <div className="space-y-4">
      <FormAlert type="error" message={error} />

      <div>
        <label className="mb-1.5 block font-body text-xs sm:text-sm font-medium text-text">
          Clase
        </label>
        <select
          value={form.classId || ''}
          onChange={(e) =>
            onChange({ ...form, classId: Number(e.target.value) })
          }
          className="w-full rounded-xl border border-border bg-surface px-4 py-2.5 text-sm text-text focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/40"
        >
          <option value="">Elegir clase...</option>
          {classes.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </div>

      <div>
        <span className="font-body text-xs sm:text-sm font-medium text-text">
          {isEditing ? 'Día' : 'Días de la semana'}
        </span>
        <div className="mt-2 flex flex-wrap gap-2">
          {WEEKDAYS.map((day) => {
            const isPicked = form.weekdays.includes(day.value);
            return (
              <button
                key={day.value}
                type="button"
                onClick={() => toggleWeekday(day.value)}
                aria-pressed={isPicked}
                className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors ${
                  isPicked
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'border-border text-text-muted hover:text-text'
                }`}
              >
                {day.short}
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <div className="mb-2 flex items-center justify-between">
          <span className="font-body text-xs sm:text-sm font-medium text-text">
            {isEditing ? 'Hora de inicio' : 'Horarios'}
          </span>
          {!isEditing && (
            <button
              type="button"
              onClick={() => onChange({ ...form, times: [...form.times, ''] })}
              className="flex items-center gap-1 text-xs font-semibold text-primary hover:text-primary-hover"
            >
              <Plus className="h-3 w-3" />
              Agregar horario
            </button>
          )}
        </div>

        <ul className="space-y-2">
          {form.times.map((time, index) => (
            <li key={index} className="flex items-center gap-2">
              <input
                type="time"
                value={time}
                onChange={(e) => setTime(index, e.target.value)}
                className="flex-1 rounded-xl border border-border bg-surface px-3 py-2 text-sm text-text focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/40"
              />
              {!isEditing && form.times.length > 1 && (
                <button
                  type="button"
                  onClick={() =>
                    onChange({
                      ...form,
                      times: form.times.filter((_, i) => i !== index),
                    })
                  }
                  aria-label="Quitar horario"
                  className="shrink-0 rounded-lg p-1.5 text-text-muted hover:text-red-400"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </li>
          ))}
        </ul>
      </div>

      <InputField
        label="Cupo máximo"
        type="number"
        min={1}
        value={form.maxCapacity}
        onChange={(e) => onChange({ ...form, maxCapacity: e.target.value })}
      />

      <p className="text-[11px] text-text-muted">
        {isEditing
          ? 'El turno se dicta todas las semanas ese día a esa hora. Cambiar el cupo no da de baja a los inscriptos.'
          : `Se crea un turno por cada combinación de día y horario${
              slotCount > 0 ? ` (${slotCount} en total)` : ''
            }. Cada turno se repite todas las semanas, y los socios ya inscriptos en esa clase y horario quedan anotados también en los días nuevos.`}
      </p>

      <div className="flex gap-3 pt-2">
        <Button onClick={onSubmit} disabled={isSaving} className="flex-1">
          {isSaving ? 'Guardando...' : 'Guardar'}
        </Button>
        <Button variant="secondary" onClick={onCancel} disabled={isSaving}>
          Cancelar
        </Button>
      </div>
    </div>
  );
};

export default ClassSessionForm;
