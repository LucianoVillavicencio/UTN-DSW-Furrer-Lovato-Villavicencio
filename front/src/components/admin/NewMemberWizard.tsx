import { useState } from 'react';
import Button from '../common/Button';
import FormAlert from '../common/FormAlert';
import Modal from './Modal';
import WizardStepper from './WizardStepper';
import MemberDataStep from './MemberDataStep';
import MemberClassStep from './MemberClassStep';
import AssignPlanForm from './AssignPlanForm';
import RegisterPaymentForm from './RegisterPaymentForm';
import {
  EMPTY_NEW_MEMBER_FORM,
  findNewMemberFormError,
  toAdminCreateUserPayload,
  type NewMemberForm,
  type WizardStep,
} from './new-member-wizard';
import { adminCreateUser } from '../../services/user.service';
import { getSubscriptionsByUser } from '../../services/subscription.service';
import type { User } from '../../types/user';

interface NewMemberWizardProps {
  onClose: () => void;
  onCreated: (user: User) => void;
}

// Front-desk onboarding: datos, plan, clase, cobro. Each step writes through
// its own endpoint as the admin advances — there is no transaction spanning
// the four, so a member abandoned halfway keeps whatever was already saved and
// can be finished from the Usuarios tab.
const NewMemberWizard = ({ onClose, onCreated }: NewMemberWizardProps) => {
  const [step, setStep] = useState<WizardStep>('datos');
  const [form, setForm] = useState<NewMemberForm>(EMPTY_NEW_MEMBER_FORM);
  const [createdUser, setCreatedUser] = useState<User | null>(null);
  const [planMaxClasses, setPlanMaxClasses] = useState<number | null>(null);
  const [hasSubscription, setHasSubscription] = useState(false);
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
      onCreated(user);
      setStep('plan');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo crear el socio.');
    } finally {
      setIsSaving(false);
    }
  };

  // The plan's class allowance decides what the Clase step can offer, and
  // AssignPlanForm reports only that it succeeded, so it is read back here.
  const handlePlanAssigned = async () => {
    if (!createdUser) return;
    setHasSubscription(true);
    try {
      const subs = await getSubscriptionsByUser(createdUser.dni);
      const active = subs.find((s) => s.state?.toLowerCase() === 'activa');
      setPlanMaxClasses(active?.plan?.maxClasses ?? null);
    } catch (err) {
      // The subscription is already created; not knowing its class allowance
      // only means the Clase step cannot pre-empt a rejection the backend
      // would issue anyway.
      console.warn('Could not read the assigned plan allowance', err);
    }
    setStep('clase');
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

        {step === 'plan' && createdUser && (
          <>
            <AssignPlanForm
              userDni={createdUser.dni}
              onAssigned={handlePlanAssigned}
            />
            <div className="flex justify-end">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setStep('clase')}
              >
                Omitir plan
              </Button>
            </div>
          </>
        )}

        {step === 'clase' && createdUser && (
          <>
            <MemberClassStep
              userDni={createdUser.dni}
              maxClasses={planMaxClasses}
              onAssigned={() => setStep('cobro')}
            />
            <div className="flex justify-end">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setStep('cobro')}
              >
                Omitir clase
              </Button>
            </div>
          </>
        )}

        {step === 'cobro' && createdUser && (
          <>
            {hasSubscription ? (
              <RegisterPaymentForm presetUser={createdUser} />
            ) : (
              <FormAlert
                type="warning"
                message="Un pago se registra contra una suscripción. Asigná un plan al socio para poder cobrarle."
              />
            )}
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
