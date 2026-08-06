import Container from "./Container";
import Badge from "./badge/Badge";
import type { ReactNode } from "react";

interface PageHeaderProps {
  badge: string;
  title: ReactNode;
  subtitle?: string;
}

const PageHeader = ({ badge, title, subtitle }: PageHeaderProps) => {
  return (
    <section className="bg-bg-secondary py-16 sm:py-20">
      <Container className="mx-auto  max-w-3xl text-center">
        <Badge variant="accent">{badge}</Badge>
        <h1 className="mt-6 text-4xl font-bold leading-tight sm:text-5xl">
          {title}
        </h1>
        {subtitle && (
          <p className="mt-6 font-body text-text-muted">{subtitle}</p>
        )}
      </Container>
    </section>
  );
};

export default PageHeader;
