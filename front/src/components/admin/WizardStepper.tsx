import { WIZARD_STEPS, type WizardStep } from './new-member-wizard';

interface WizardStepperProps {
  current: WizardStep;
}

const WizardStepper = ({ current }: WizardStepperProps) => {
  const currentIndex = WIZARD_STEPS.findIndex((s) => s.id === current);

  return (
    <ol className="mb-4 flex items-center gap-2 text-xs">
      {WIZARD_STEPS.map((step, index) => (
        <li key={step.id} className="flex items-center gap-2">
          <span
            aria-current={step.id === current ? 'step' : undefined}
            className={
              index < currentIndex
                ? 'font-semibold text-primary'
                : index === currentIndex
                  ? 'font-semibold text-text'
                  : 'text-text-muted'
            }
          >
            {index < currentIndex ? '✓ ' : ''}
            {step.label}
          </span>
          {index < WIZARD_STEPS.length - 1 && (
            <span className="text-text-muted">—</span>
          )}
        </li>
      ))}
    </ol>
  );
};

export default WizardStepper;
