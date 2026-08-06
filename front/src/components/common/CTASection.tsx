import Button from "./Button";
import Container from "./Container";

interface CTAbutton {
  label: string;
  href: string;
}

interface CTAsectionProps {
  title: string;
  subtitle: string;
  primaryButton: CTAbutton;
  secondaryButton?: CTAbutton;
}

const CTASection = ({
  title,
  subtitle,
  primaryButton,
  secondaryButton,
}: CTAsectionProps) => {
  return (
    <section className="bg-primary/80 py-20">
      <Container className="text-center">
        <h2 className="text-3xl font-bold  sm:text-5xl">{title}</h2>
        <p className="mx-auto mt-4 max-w-xl font-body text-emerald-950/90 leading-relaxed tracking-wide">
          {subtitle}
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-4  ">
          <Button
            href={primaryButton.href}
            variant="secondary"
            className=" border-white hover:bg-background hover:text-primary"
          >
            {primaryButton.label}
          </Button>
          {secondaryButton && (
            <Button
              href={secondaryButton.href}
              className=" border-white hover:bg-background hover:text-primary"
            >
              {secondaryButton.label}
            </Button>
          )}
        </div>
      </Container>
    </section>
  );
};

export default CTASection;
