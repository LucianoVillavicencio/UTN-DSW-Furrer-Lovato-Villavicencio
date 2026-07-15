import Button from "../common/Button";
import Container from "../common/Container";

const CTASection = () => {
  return (
    <section className="bg-primary py-20">
      <Container className="text-center">
        <div className="">
          <h2 className="text-3xl font-bold  sm:text-5xl">
            Listo para empezar tu transformacion ?
          </h2>

          <p className="mx-auto mt-4 max-w-xl font-body text-emerald-950/80 leading-relaxed tracking-wide">
            El cambio empieza con una decisión. Explorá nuestros planes y
            comenzá hoy mismo
          </p>
        </div>
        <div className="mt-8 flex-wrap justify-center ">
          <Button
            href="/plans"
            variant="secondary"
            className=" border-white hover:bg-background hover:text-primary"
          >
            Ir a planes
          </Button>
        </div>
      </Container>
    </section>
  );
};

export default CTASection;
