import { useId } from 'react';
import type { InputHTMLAttributes, ReactNode } from 'react';
import { Check } from 'lucide-react';

interface CheckboxProps extends Omit<
  InputHTMLAttributes<HTMLInputElement>,
  'type'
> {
  /** Text next to the box. Can include links, e.g. terms and conditions. */
  label: ReactNode;
  className?: string;
}

/**
 * Styled checkbox. It is still a real <input type="checkbox">, only visually
 * restyled with appearance-none, so keyboard (Space), screen readers, forms
 * and `checked`/`onChange` all work exactly like a native one.
 */
const Checkbox = ({
  label,
  id,
  disabled,
  className = '',
  ...props
}: CheckboxProps) => {
  // Each checkbox gets a unique id automatically unless one is passed.
  const autoId = useId();
  const inputId = id ?? autoId;

  return (
    <label
      htmlFor={inputId}
      // Font size and line height live on the label so the box wrapper below
      // can measure one line with the `lh` unit.
      className={`group inline-flex items-start gap-2.5 font-body text-sm leading-snug select-none ${
        disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'
      } ${className}`}
    >
      {/* h-[1lh] = exactly one line of the label's text, so the box is
          centered on the first line: aligned with a one-line label, and
          still pinned to the top line when the label wraps. */}
      <span className="flex h-1lh shrink-0 items-center">
        <span className="relative flex size-4.5">
          <input
            id={inputId}
            type="checkbox"
            disabled={disabled}
            className="peer size-full cursor-[inherit] appearance-none rounded-md border border-border bg-surface transition-colors duration-200 group-hover:border-primary/60 checked:border-primary checked:bg-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
            {...props}
          />
          {/* The tick: hidden until the input is checked (peer-checked). */}
          <Check
            aria-hidden="true"
            strokeWidth={3}
            className="pointer-events-none absolute inset-0 m-auto size-3 scale-50 text-background opacity-0 transition-all duration-200 peer-checked:scale-100 peer-checked:opacity-100"
          />
        </span>
      </span>
      <span className="text-text-muted">{label}</span>
    </label>
  );
};

export default Checkbox;