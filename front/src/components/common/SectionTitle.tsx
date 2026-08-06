import Badge from "./badge/Badge";

interface SectionTitleProps {
  badge: string;
  title: string;
  subtitle?: string;
}

const SectionTitle = ({ badge, title, subtitle }: SectionTitleProps) => {
  return (
    <div className="mx-auto max-w-2xl text-center">
      <Badge variant="accent" >{badge}</Badge>
      <h2 className="mt-4 text-3xl font-bold sm:text-4xl">{title}</h2>
      {subtitle && <p className="mt-4 font-body text-text-muted">{subtitle}</p>}
    </div>
  );
};

export default SectionTitle;
