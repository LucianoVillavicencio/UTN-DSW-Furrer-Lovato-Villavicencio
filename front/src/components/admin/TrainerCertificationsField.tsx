import { useState } from 'react';
import { Plus, X } from 'lucide-react';
import InputField from '../common/InputField';

interface TrainerCertificationsFieldProps {
  value: string[];
  onChange: (certifications: string[]) => void;
}

const TrainerCertificationsField = ({
  value,
  onChange,
}: TrainerCertificationsFieldProps) => {
  const [draft, setDraft] = useState('');

  const add = () => {
    const entry = draft.trim();
    if (!entry || value.includes(entry)) {
      return;
    }
    onChange([...value, entry]);
    setDraft('');
  };

  return (
    <div className="space-y-2">
      <div className="flex items-end gap-2">
        <InputField
          label="Certificaciones"
          placeholder="Profesor de Educación Física"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              // The field sits inside a modal, not a form, but Enter should add
              // the chip rather than do nothing.
              e.preventDefault();
              add();
            }
          }}
        />
        <button
          type="button"
          onClick={add}
          aria-label="Agregar certificación"
          className="mb-0.5 rounded-lg border border-border p-2.5 text-text-muted hover:text-primary"
        >
          <Plus className="h-4 w-4" />
        </button>
      </div>

      <div className="flex flex-wrap gap-2">
        {value.map((certification) => (
          <span
            key={certification}
            className="inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs text-primary"
          >
            {certification}
            <button
              type="button"
              onClick={() =>
                onChange(value.filter((entry) => entry !== certification))
              }
              aria-label={`Quitar ${certification}`}
            >
              <X className="h-3 w-3" />
            </button>
          </span>
        ))}
      </div>
    </div>
  );
};

export default TrainerCertificationsField;
