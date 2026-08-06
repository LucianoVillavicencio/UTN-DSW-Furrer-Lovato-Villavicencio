import { useEffect, useState } from "react";
import Button from "../common/Button";
import Container from "../common/Container";
import { Zap } from "lucide-react";

const AboutCTASection = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    setIsLoggedIn(!!storedUser);
  }, []);

  const primaryTargetHref = isLoggedIn ? "/membership" : "/login";

  return (
    <section
      aria-labelledby="cta-heading"
      className="relative overflow-hidden bg-gradient-to-br from-primary via-primary/95 to-primary-hover py-20 lg:py-24 text-background shadow-inner"
    >
      {/* Background Decorative Patterns */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-24 -left-24 h-80 w-80 rounded-full bg-white/10 blur-2xl"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-24 -right-24 h-80 w-80 rounded-full bg-black/10 blur-2xl"
      />

      <Container className="relative z-10 text-center max-w-4xl mx-auto">
        <span className="inline-flex items-center gap-2 rounded-full border border-background/20 bg-background/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-background backdrop-blur-sm">
          <Zap className="h-3.5 w-3.5" />
          <span>Comienza tu transformación</span>
        </span>

        <h2
          id="cta-heading"
          className="mt-6 text-3xl font-extrabold tracking-tight sm:text-4xl lg:text-5xl text-background leading-tight"
        >
          ¿Listo para dar el paso y alcanzar tu mejor versión?
        </h2>

        <p className="mt-4 font-sans text-base sm:text-lg text-background/90 max-w-2xl mx-auto leading-relaxed">
          El primer paso empieza con una decisión. Únete a la comunidad FitCore hoy mismo y accede a instalaciones de primera clase, entrenadores expertos y soporte continuo.
        </p>

        {/* Action Buttons */}
        <div className="mt-10 flex flex-col sm:flex-row justify-center items-center gap-4">
          <Button
            href={primaryTargetHref}
            variant="secondary"
            size="lg"
            className="w-full sm:w-auto bg-surface text-primary border-2 border-surface hover:bg-surface/90 hover:scale-105 shadow-xl font-bold"
          >
            {isLoggedIn ? "Ver planes" : "Obtener membresía"}
          </Button>

          <Button
            href="/class"
            variant="secondary"
            size="lg"
            className="w-full sm:w-auto border-2 border-background text-background hover:bg-background hover:text-primary hover:scale-105 font-semibold"
          >
            Explorar clases
          </Button>

          <Button
            href="/contact"
            variant="secondary"
            size="lg"
            className="w-full sm:w-auto border-2 border-background/40 text-background hover:border-background hover:bg-background/10 font-semibold"
          >
            Contactar equipo
          </Button>
        </div>
      </Container>
    </section>
  );
};

export default AboutCTASection;


