import InputField from '../common/InputField';
import FormAlert from '../common/FormAlert';
import Button from '../common/Button';
import type { Class } from '../../types/class';
import type { ClassSessionFormState } from './class-session-form';

interface ClassSessionFormProps {
  form: ClassSessionFormState;
  classes: Class[];
  error: string | null;
  isSaving: boolean;
  onChange: (form: ClassSessionFormState) => void;
  onSubmit: () => void;
  onCancel: () => void;
}

const ClassSessionForm = ({
  form,
  classes,
  error,
  isSaving,
  onChange,
  onSubmit,
  onCancel,
}: ClassSessionFormProps) => (
  <div className="space-y-4">
    <FormAlert type="error" message={error} />

    <div>
      <label className="mb-1.5 block font-body text-xs sm:text-sm font-medium text-text">
        Clase
      </label>
      <select
        value={form.classId || ''}
        onChange={(e) => onChange({ ...form, classId: Number(e.target.value) })}
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

    <div className="grid gap-4 sm:grid-cols-2">
      <InputField
        label="Fecha"
        type="date"
        value={form.date}
        onChange={(e) => onChange({ ...form, date: e.target.value })}
      />
      <InputField
        label="Hora de inicio"
        type="time"
        value={form.time}
        onChange={(e) => onChange({ ...form, time: e.target.value })}
      />
    </div>

    <InputField
      label="Cupo máximo"
      type="number"
      min={1}
      value={form.maxCapacity}
      onChange={(e) => onChange({ ...form, maxCapacity: e.target.value })}
    />
    <p className="text-[11px] text-text-muted">
      Cada turno dura una hora. Los lugares disponibles arrancan en el cupo
      máximo y bajan con cada inscripción.
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

export default ClassSessionForm;
