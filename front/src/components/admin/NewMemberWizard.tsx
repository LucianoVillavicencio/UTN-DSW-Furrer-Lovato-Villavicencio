import { useState } from 'react';
import Button from '../common/Button';
import FormAlert from '../common/FormAlert';
import Modal from './Modal';
import WizardStepper from './WizardStepper';
import MemberDataStep from './MemberDataStep';
import MemberClassStep from './MemberClassStep';
import MemberChargeForm from './MemberChargeForm';
import MemberCredentialsCard from './MemberCredentialsCard';
import WizardSummaryStep from './WizardSummaryStep';
import {
  EMPTY_NEW_MEMBER_FORM,
  findNewMemberFormError,
  nextStepAfterCharge,
  toAdminCreateUserPayload,
  type NewMemberForm,
  type WizardStep,
} from './new-member-wizard';
import type { ChargeSummary } from './plan-charge';
import { adminCreateUser } from '../../services/user.service';
import type { User } from '../../types/user';

interface NewMemberWizardProps {
  onClose: () => void;
  onCreated: (user: User) => void;
}

// Front-desk onboarding: datos, cobro, clase, resumen. Each step writes
// through its own endpoint as the admin advances — there is no transaction
// spanning the four, so a member abandoned halfway keeps whatever was already
// saved and can be finished from the Usuarios tab.
const NewMemberWizard = ({ onClose, onCreated }: NewMemberWizardProps) => {
  const [step, setStep] = useState<WizardStep>('datos');
  const [form, setForm] = useState<NewMemberForm>(EMPTY_NEW_MEMBER_FORM);
  const [createdUser, setCreatedUser] = useState<User | null>(null);
  const [chargeSummary, setChargeSummary] = useState<ChargeSummary | null>(
    null,
  );
  const [generatedPassword, setGeneratedPassword] = useState<
    string | undefined
  >();
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCreate = async () => {
    const formError = findNewMemberFormError(form);
    if (formError) {
      setError(formError);
      return;
    }
    setError(null);
    setIsSaving(true);
    try {
      // Omit<User, 'password'> is assignable to User: password is optional on
      // the type, so no cast is needed here.
      const user = await adminCreateUser(toAdminCreateUserPayload(form));
      setCreatedUser(user);
      setGeneratedPassword(user.generatedPassword);
      onCreated(user);
      setStep('cobro');
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'No se pudo crear el socio.',
      );
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Modal title="Nuevo socio" onClose={onClose}>
      <div className="max-h-[70vh] space-y-4 overflow-y-auto pr-1">
        <WizardStepper current={step} />

        {createdUser && (
          <p className="text-xs text-text-muted">
            Socio creado: {createdUser.name} {createdUser.surname} · DNI{' '}
            {createdUser.dni}
          </p>
        )}
        {generatedPassword && createdUser && step !== 'resumen' && (
          <MemberCredentialsCard
            username={createdUser.email}
            password={generatedPassword}
          />
        )}

        {step === 'datos' && (
          <>
            <MemberDataStep
              form={form}
              onChange={setForm}
              disabled={isSaving}
            />
            <FormAlert type="error" message={error} />
            <div className="flex justify-end gap-2">
              <Button variant="secondary" size="sm" onClick={onClose}>
                Cancelar
              </Button>
              <Button
                size="sm"
                onClick={() => void handleCreate()}
                disabled={isSaving}
              >
                {isSaving ? 'Creando...' : 'Crear socio'}
              </Button>
            </div>
          </>
        )}

        {step === 'cobro' && createdUser && (
          <>
            <MemberChargeForm
              selectedUser={createdUser}
              onCharged={(summary) => {
                setChargeSummary(summary);
                setStep(nextStepAfterCharge);
              }}
            />
            <div className="flex justify-end">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setStep('clase')}
              >
                Omitir cobro
              </Button>
            </div>
          </>
        )}

        {step === 'clase' && createdUser && (
          <>
            <MemberClassStep
              userId={createdUser.id}
              maxClasses={chargeSummary?.plan.maxClasses ?? null}
              onAssigned={() => setStep('resumen')}
            />
            <div className="flex justify-end">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setStep('resumen')}
              >
                Omitir clase
              </Button>
            </div>
          </>
        )}

        {step === 'resumen' && createdUser && (
          <>
            <WizardSummaryStep
              user={createdUser}
              summary={chargeSummary}
              generatedPassword={generatedPassword}
            />
            <div className="flex justify-end">
              <Button size="sm" onClick={onClose}>
                Finalizar
              </Button>
            </div>
          </>
        )}
      </div>
    </Modal>
  );
};

export default NewMemberWizard;
