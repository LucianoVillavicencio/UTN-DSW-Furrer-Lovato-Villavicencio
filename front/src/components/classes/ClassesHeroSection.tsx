import Container from "../common/Container";

const ClassesHeroSection = () => {
  return (
    <section className="relative overflow-hidden bg-background py-20">
      <Container>
        <div className="text-center">
          <span className="inline-block rounded-full border border-border bg-surface px-4 py-1.5 text-sm text-primary">
            Nuestras clases
          </span>

          <h1 className="mt-6 text-5xl font-bold leading-tight sm:text-6xl lg:text-6xl">
            Encuentra tu clase{" "}
            <span className="text-primary">perfecta</span>
          </h1>

          <p className="mt-6 text-xl mx-auto max-w-2xl font-sans text-text-muted leading-relaxed">
            Contamos con una variedad de clases diseñadas para todos los niveles
            de experiencia. Desde principiantes hasta atletas avanzados, tenemos
            el entrenamiento perfecto para ti.
          </p>
        </div>
      </Container>
    </section>
  );
};

export default ClassesHeroSection;
