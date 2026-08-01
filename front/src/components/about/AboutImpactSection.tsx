import Container from "../common/Container";

const metrics = [
  { value: "10+", label: "Años de excelencia" },
  { value: "5000+", label: "Miembros transformados" },
  { value: "50+", label: "Entrenadores expertos" },
  { value: "98%", label: "Satisfacción de miembros" },
];

const AboutImpactSection = () => {
  return (
    <section className="bg-background py-20">
      <Container>
        <div className="text-center">
          <span className="inline-block rounded-full border border-border bg-surface px-4 py-1.5 text-sm text-primary">
            Nuestro impacto
          </span>

          <h2 className="mt-6 text-4xl font-bold sm:text-5xl">
            Números que importan
          </h2>

          <p className="mx-auto mt-4 max-w-2xl font-sans text-text-muted leading-relaxed">
            Cada meta alcanzada es una historia de disciplina, compromiso y un equipo que te acompaña.
          </p>
        </div>

        <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {metrics.map((metric) => (
            <div key={metric.label} className="rounded-3xl border border-border bg-surface p-8 text-center">
              <p className="text-4xl font-bold text-text">{metric.value}</p>
              <p className="mt-3 text-sm text-text-muted">{metric.label}</p>
            </div>
          ))}
        </div>
      </Container>
    </section>
  );
};

export default AboutImpactSection;
