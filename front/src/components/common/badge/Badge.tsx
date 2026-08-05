import type { ReactNode } from "react";

// accent(green) default  | neutral(chips Rating)
type BadgeVariant = "accent" | "neutral";

interface BadgeProps {
  children: ReactNode;
  variant?: BadgeVariant;
  className?: string;
}

const variantStyle: Record<BadgeVariant, string> = {
  accent:" font-display bg-badge-green-bg border border-badge-green-border text-badge-green-text hover:bg-primary/20 transition-colors duration-200 ",
  neutral: "font-display bg-white/5 border border-white/10 text-text-muted hover:bg-white/10 hover:text-text transition-colors duration-200"
,
};

const Badge = ({
  children,
  variant = "accent",
  className = "",
}: BadgeProps) => {
  return (
    <span
      className={`inline-block rounded-full border border-primary/20 px-4 py-1.5 text-sm ${variantStyle[variant]} ${className}`}
    >
      {children}
    </span>
  );
};

export default Badge;
