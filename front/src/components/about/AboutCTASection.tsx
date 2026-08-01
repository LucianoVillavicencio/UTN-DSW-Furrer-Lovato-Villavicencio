import Button from "../common/Button";
import Container from "../common/Container";

const AboutCTASection = () => {
  return (
    <section className="bg-primary py-20 text-background">
      <Container className="text-center">
        <h2 className="text-4xl font-bold sm:text-5xl">
          ¿Listo para comenzar?
        </h2>
        <p className="mx-auto mt-4 max-w-2xl font-body leading-relaxed text-background/90">
          El primer paso hacia tu mejor versión empieza con una decisión. Elige tu
          plan y vive la experiencia FitCore.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-4">
          <Button
            href="/register"
            variant="secondary"
            className="border-white text-white hover:bg-background hover:text-primary"
          >
            Ver membresías
          </Button>
          <Button
            href="/class"
            variant="secondary"
            className="border-white text-white hover:bg-white hover:text-primary"
          >
            Ver clases
          </Button>
        </div>
      </Container>
    </section>
  );
};

export default AboutCTASection;
