import { useState } from 'react';
import Button from '../common/Button';
import FormAlert from '../common/FormAlert';
import ClassHourSelect from './ClassHourSelect';
import { classOptionKey, useClassOptions } from './useClassOptions';
import { changeMemberClass } from '../../services/classRegistration.service';

interface MemberClassStepProps {
  userDni: number;
  // 0 = the plan includes no classes, N = up to N, null/undefined = unlimited
  // or no plan assigned yet.
  maxClasses: number | null | undefined;
  onAssigned: () => void;
}

const MemberClassStep = ({
  userDni,
  maxClasses,
  onAssigned,
}: MemberClassStepProps) => {
  const { options, isLoading, error: optionsError } = useClassOptions();
  const [selectedOption, setSelectedOption] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  if (maxClasses === 0) {
    return (
      <FormAlert
        type="warning"
        message="El plan asignado no incluye clases. Podés omitir este paso."
      />
    );
  }

  const handleAssign = async () => {
    setActionError(null);
    const option = options.find((o) => classOptionKey(o) === selectedOption);
    if (!option) {
      setActionError('Elegí una clase y un horario.');
      return;
    }
    setIsSaving(true);
    try {
      await changeMemberClass(userDni, option.classId, option.startTime);
      onAssigned();
    } catch (err) {
      setActionError(
        err instanceof Error ? err.message : 'No se pudo asignar la clase.',
      );
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return <p className="text-sm text-text-muted">Cargando clases...</p>;
  }

  return (
    <div className="space-y-3">
      <FormAlert type="error" message={optionsError} />
      <ClassHourSelect
        options={options}
        value={selectedOption}
        onChange={setSelectedOption}
      />
      <FormAlert type="error" message={actionError} />
      <Button
        size="sm"
        onClick={() => void handleAssign()}
        disabled={isSaving || !selectedOption}
      >
        {isSaving ? 'Asignando...' : 'Asignar clase'}
      </Button>
    </div>
  );
};

export default MemberClassStep;
