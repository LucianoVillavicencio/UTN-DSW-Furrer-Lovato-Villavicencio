import type { ButtonHTMLAttributes, ReactNode } from "react";
import { Link } from "react-router-dom";


// Define the button types

type ButtonVariant = "primary" | "secondary";
type ButtonSize = "sm" | "md" | "lg";


// Props that a button can accept

interface BaseButtonProps {
  children: ReactNode;
  variant?: ButtonVariant;
  size?: ButtonSize;
  className?: string;
}

interface ButtonAsButton
  extends BaseButtonProps,
    Omit<ButtonHTMLAttributes<HTMLButtonElement>, "children"> {
  href?: undefined;
}

interface ButtonAsLink extends BaseButtonProps {
  href: string;
  onClick?: never;
}

// Prevents someone from accidentally passing both href and onClick at the same time.
type ButtonProps = ButtonAsButton | ButtonAsLink;  





// Styles by button variant
const variantStyles: Record<ButtonVariant, string> = { // Record ensures it is either primary or secondary—nothing more, nothing less.
  primary:
    "bg-primary text-background hover:bg-primary-hover",
  secondary:
    "bg-transparent text-text border border-border hover:border-primary hover:text-primary",
};

const sizeStyles: Record<ButtonSize, string> = {
  sm: "px-4 py-2 text-sm",
  md: "px-6 py-3 text-base",
  lg: "px-8 py-4 text-lg",
};

const baseStyles =
  "inline-flex items-center justify-center rounded-full font-body font-semibold transition-colors duration-200 cursor-pointer";


// button component

const Button = ({
  children,
  variant = "primary",
  size = "md",
  className = "",
  href,
  ...props
}: ButtonProps) => {
  const combinedStyles = `${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]} ${className}`;

  if (href) {
    return (
      <Link to={href} className={combinedStyles}> 
        {children}
      </Link>
    );
  }

  return (
    <button
      className={combinedStyles}
      {...(props as ButtonHTMLAttributes<HTMLButtonElement>)}
    >
      {children}
    </button>
  );
};

export default Button;