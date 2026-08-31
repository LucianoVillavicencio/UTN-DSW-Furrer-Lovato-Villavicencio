import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';

interface SectionHeaderProps {
  title: string;
  icon: LucideIcon;
  description?: string;
  children?: ReactNode;
}

// One header, one rhythm, for every admin section: an icon chip that reuses
// the same lucide icon the nav rail already assigns to this tab (so the icon
// vocabulary agrees between the two), a title, an optional one-line
// description, and a right-aligned actions cluster. The chip's bottom
// accent line is a quieter echo of the accent bar used on the stat tiles and
// the nav rail's active indicator — the panel's one recurring motif, not a
// second one.
const SectionHeader = ({
  title,
  icon: Icon,
  description,
  children,
}: SectionHeaderProps) => (
  <div className="flex flex-wrap items-center justify-between gap-4">
    <div className="flex items-center gap-3">
      <span className="relative flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-primary/20 bg-primary/10">
        <Icon className="h-5 w-5 text-primary" />
        <span
          aria-hidden="true"
          className="absolute inset-x-0 bottom-0 h-0.5 bg-primary/70"
        />
      </span>
      <div>
        <h3 className="font-display text-lg font-semibold text-text">
          {title}
        </h3>
        {description && (
          <p className="mt-0.5 font-body text-sm text-text-muted">
            {description}
          </p>
        )}
      </div>
    </div>
    {children && (
      <div className="flex flex-wrap items-center gap-3">{children}</div>
    )}
  </div>
);

export default SectionHeader;
