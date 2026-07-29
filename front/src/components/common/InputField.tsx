import type { InputHTMLAttributes, ReactNode } from "react";

interface InputFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  icon?: ReactNode;
  rightElement?: ReactNode;
}

const InputField = ({
  label,
  icon,
  rightElement,
  className = "",
  ...props
}: InputFieldProps) => {
  return (
    <div>
      <label className="block font-body text-sm font-medium text-text mb-1">
        {label}
      </label>
      <div className="relative">
        {icon && (
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-text-muted">
            {icon}
          </div>
        )}
        <input
          {...props}
          className={`w-full rounded-xl border border-border bg-surface py-2.5 ${
            icon ? "pl-10" : "pl-4"
          } ${
            rightElement ? "pr-10" : "pr-4"
          } text-sm text-text placeholder-text-muted font-body transition-all duration-200 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary ${className}`}
        />
        {rightElement && (
          <div className="absolute inset-y-0 right-0 flex items-center pr-3">
            {rightElement}
          </div>
        )}
      </div>
    </div>
  );
};

export default InputField;
