import { useId, type InputHTMLAttributes, type ReactNode } from 'react';

type InputFieldSize = 'sm' | 'md';

// A size prop rather than utility classes through className: the base class
// string already sets py-2.5, and a competing py-3 has equal specificity, so
// which one wins depends on the order Tailwind emits them — not on their order
// in the attribute. The project has neither tailwind-merge nor clsx.
const sizeStyles: Record<InputFieldSize, string> = {
  sm: 'py-2.5 text-sm',
  md: 'py-3 text-base',
};

interface InputFieldProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'size'> {
  label: string;
  icon?: ReactNode;
  rightElement?: ReactNode;
  error?: string | null;
  size?: InputFieldSize;
}

const InputField = ({
  label,
  icon,
  rightElement,
  error,
  id,
  disabled,
  className = '',
  size = 'sm',
  ...props
}: InputFieldProps) => {
  const generatedId = useId();
  const inputId = id || generatedId;

  return (
    <div className="w-full">
      <label
        htmlFor={inputId}
        className="block font-body text-xs sm:text-sm font-medium text-text mb-1.5"
      >
        {label}
      </label>
      <div className="relative flex items-center">
        {icon && (
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-text-muted">
            {icon}
          </div>
        )}
        <input
          id={inputId}
          disabled={disabled}
          {...props}
          className={`w-full rounded-xl border bg-surface ${sizeStyles[size]} ${
            icon ? 'pl-10' : 'pl-4'
          } ${
            rightElement ? 'pr-10' : 'pr-4'
          } text-text placeholder-text-muted/60 font-body transition-all duration-200 ${
            error
              ? 'border-red-500/80 focus:border-red-500 focus:ring-2 focus:ring-red-500/30'
              : 'border-border hover:border-border/80 focus:border-primary focus:ring-2 focus:ring-primary/40'
          } focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-surface/50 ${className}`}
        />
        {rightElement && (
          <div className="absolute inset-y-0 right-0 flex items-center pr-3">
            {rightElement}
          </div>
        )}
      </div>
      {error && (
        <p className="mt-1 text-xs text-red-400 font-body animate-fade-in">
          {error}
        </p>
      )}
    </div>
  );
};

export default InputField;
