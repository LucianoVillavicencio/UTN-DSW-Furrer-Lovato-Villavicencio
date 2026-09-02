import { Check } from 'lucide-react';
import { WIZARD_STEPS, type WizardStep } from './new-member-wizard';

interface WizardStepperProps {
  current: WizardStep;
}

const WizardStepper = ({ current }: WizardStepperProps) => {
  const currentIndex = WIZARD_STEPS.findIndex((s) => s.id === current);

  return (
    <div className="mb-4">
      <div className="sm:hidden">
        <p className="text-sm font-semibold text-text">
          Paso {currentIndex + 1} de {WIZARD_STEPS.length} ·{' '}
          {WIZARD_STEPS[currentIndex]?.label}
        </p>
        <div className="mt-2 h-1 rounded-full bg-border">
          <div
            className="h-1 rounded-full bg-primary transition-all"
            style={{
              width: `${((currentIndex + 1) / WIZARD_STEPS.length) * 100}%`,
            }}
          />
        </div>
      </div>

      <ol className="hidden items-center sm:flex">
        {WIZARD_STEPS.map((step, index) => (
          <li key={step.id} className="flex flex-1 items-center last:flex-none">
            <div className="flex flex-col items-center gap-1">
              <span
                aria-current={step.id === current ? 'step' : undefined}
                className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${
                  index < currentIndex
                    ? 'bg-primary text-background'
                    : index === currentIndex
                      ? 'bg-primary text-background'
                      : 'border border-border text-text-muted'
                }`}
              >
                {index < currentIndex ? (
                  <Check className="h-4 w-4" />
                ) : (
                  index + 1
                )}
              </span>
              <span
                className={`text-xs ${
                  index <= currentIndex
                    ? 'font-semibold text-text'
                    : 'text-text-muted'
                }`}
              >
                {step.label}
              </span>
            </div>
            {index < WIZARD_STEPS.length - 1 && (
              <span className="mx-2 mb-4 h-px flex-1 bg-border">
                <span
                  className={`block h-px transition-all ${
                    index < currentIndex ? 'bg-primary' : ''
                  }`}
                  style={{ width: index < currentIndex ? '100%' : '0%' }}
                />
              </span>
            )}
          </li>
        ))}
      </ol>
    </div>
  );
};

export default WizardStepper;
