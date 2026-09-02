import { useState } from 'react';
import Button from '../common/Button';
import FormAlert from '../common/FormAlert';
import Modal from './Modal';
import WizardStepper from './WizardStepper';
import WizardContextRail from './WizardContextRail';
import MemberDataStep from './MemberDataStep';
import MemberClassStep from './MemberClassStep';
import MemberChargeForm from './MemberChargeForm';
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
    <Modal title="Nuevo socio" onClose={onClose} size="xl">
      <div className="grid gap-6 lg:grid-cols-[1fr_20rem]">
        <div className="min-w-0">
          <WizardStepper current={step} />

          <div className="max-h-[75vh] space-y-4 overflow-y-auto pr-1 lg:max-h-[80vh]">
            {step === 'datos' && (
              <>
                <p className="text-sm text-text-muted">
                  Solo el DNI, el nombre y el apellido son obligatorios.
                </p>
                <form
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      void handleCreate();
                    }
                  }}
                >
                  <MemberDataStep
                    form={form}
                    onChange={setForm}
                    disabled={isSaving}
                  />
                </form>
                <FormAlert type="error" message={error} />
              </>
            )}

            {step === 'cobro' && createdUser && (
              <>
                <p className="text-sm text-text-muted">
                  Elegí el plan y la duración. La suscripción se crea con el
                  pago.
                </p>
                <MemberChargeForm
                  selectedUser={createdUser}
                  onCharged={(summary) => {
                    setChargeSummary(summary);
                    setStep(nextStepAfterCharge);
                  }}
                />
              </>
            )}

            {step === 'clase' && createdUser && (
              <>
                <p className="text-sm text-text-muted">
                  Opcional. Podés asignarla más tarde desde Usuarios.
                </p>
                <MemberClassStep
                  userId={createdUser.id}
                  maxClasses={chargeSummary?.plan.maxClasses ?? null}
                  onAssigned={() => setStep('resumen')}
                />
              </>
            )}

            {step === 'resumen' && createdUser && (
              <>
                <p className="text-sm text-text-muted">
                  Anotá los datos de acceso antes de cerrar.
                </p>
                <WizardSummaryStep user={createdUser} summary={chargeSummary} />
              </>
            )}
          </div>

          {step === 'datos' && (
            <div className="mt-4 flex justify-end gap-2">
              <Button variant="secondary" size="sm" onClick={onClose}>
                Cancelar
              </Button>
              <Button
                size="md"
                onClick={() => void handleCreate()}
                disabled={isSaving}
              >
                {isSaving ? 'Creando...' : 'Crear socio'}
              </Button>
            </div>
          )}

          {step === 'cobro' && createdUser && (
            <div className="mt-4 flex justify-end gap-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setStep('clase')}
              >
                Omitir cobro
              </Button>
            </div>
          )}

          {step === 'clase' && createdUser && (
            <div className="mt-4 flex justify-end gap-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setStep('resumen')}
              >
                Omitir clase
              </Button>
            </div>
          )}

          {step === 'resumen' && createdUser && (
            <div className="mt-4 flex justify-end gap-2">
              <Button size="md" onClick={onClose}>
                Finalizar
              </Button>
            </div>
          )}
        </div>

        <WizardContextRail
          user={createdUser}
          summary={chargeSummary}
          generatedPassword={generatedPassword}
        />
      </div>
    </Modal>
  );
};

export default NewMemberWizard;
