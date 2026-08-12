import Container from "./Container";
import Badge from "./badge/Badge";
import { Sparkles, type LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

interface PageHeaderProps {
  badge: string;
  icon?: LucideIcon;
  title: ReactNode;
  subtitle?: string;
}

const PageHeader = ({ badge, icon = Sparkles, title, subtitle }: PageHeaderProps) => {
  return (
    <section
      aria-labelledby="page-header-heading"
      className="relative overflow-hidden bg-bg-secondary py-16 lg:py-24"
    >
      {/* Subtle Background Glow Accent */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-40 -left-40 h-96 w-96 rounded-full bg-primary/10 blur-3xl"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-40 -right-40 h-96 w-96 rounded-full bg-primary/10 blur-3xl"
      />

      <Container className="relative z-10 mx-auto max-w-3xl text-center">
        <Badge variant="accent" icon={icon}>
          {badge}
        </Badge>

        <h1
          id="page-header-heading"
          className="mt-6 text-4xl font-extrabold tracking-tight sm:text-5xl lg:text-6xl text-text leading-[1.15]"
        >
          {title}
        </h1>

        {subtitle && (
          <p className="mt-6 text-lg sm:text-xl font-sans text-text-muted leading-relaxed max-w-2xl mx-auto">
            {subtitle}
          </p>
        )}
      </Container>
    </section>
  );
};

export default PageHeader;
