import Container from "../common/Container";
import Button from "../common/Button";

const AboutHeroSection = () => {
  return (
    <section className="relative overflow-hidden bg-background py-20">
      <Container className="grid grid-cols-1 items-center gap-20 lg:grid-cols-2">
        <div>
          <span className="inline-block rounded-full border border-border bg-surface px-4 py-1.5 text-sm text-primary">
            Acerca de FitCore
          </span>

          <h1 className="mt-6 text-5xl font-bold leading-tight sm:text-6xl lg:text-6xl">
            Tu camino hacia el bienestar
          </h1>

          <p className="mt-6 text-xl max-w-xl font-sans text-text-muted leading-relaxed">
            En FitCore creemos que el fitness es más que ejercicio: es comunidad,
            crecimiento personal y un estilo de vida más saludable.
          </p>

          <div className="mt-8 flex flex-wrap gap-4">
            <Button href="/register" size="md">
              Únete hoy
            </Button>
            <Button href="/class" variant="secondary" size="md">
              Ver clases
            </Button>
          </div>
        </div>

        <div className="relative">
          <div className="aspect-square w-full overflow-hidden rounded-2xl bg-surface shadow-xl shadow-black/10">
            <img
              src="/images/hero-imagen.avif"
              alt="Imagen de entrenamiento FitCore"
              className="h-full w-full object-cover"
            />
          </div>
        </div>
      </Container>
    </section>
  );
};

export default AboutHeroSection;
