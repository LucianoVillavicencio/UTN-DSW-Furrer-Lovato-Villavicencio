import type { ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';

// accent(green) default  | neutral(chips Rating)
type BadgeVariant = 'accent' | 'neutral' | 'neutral2' ;

interface BadgeProps {
  children: ReactNode;
  variant?: BadgeVariant;
  icon?: LucideIcon;
  className?: string;
}

const variantStyle: Record<BadgeVariant, string> = {
  accent:
    'font-display border-primary/20 bg-primary/10 text-xs font-semibold uppercase tracking-wider text-primary shadow-sm hover:bg-primary/20 transition-colors duration-300',
  neutral:
    'font-display border-white/10 bg-white/2 text-xs font-medium text-text-muted hover:bg-white/5 hover:text-text transition-colors duration-300',
  neutral2: 'font-display border-white/10 bg-white/2 text-xs font-medium text-text-muted [&>svg]:text-primary hover:border-primary/30 hover:bg-primary/5 hover:text-text transition-colors duration-300',



};

const Badge = ({
  children,
  variant = 'accent',
  icon: Icon,
  className = '',
}: BadgeProps) => {
  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full border px-5 py-2 ${variantStyle[variant]} ${className}`}
    >
      {Icon && <Icon className="h-3.5 w-3.5" />}
      {children}
    </span>
  );
};

export default Badge;
