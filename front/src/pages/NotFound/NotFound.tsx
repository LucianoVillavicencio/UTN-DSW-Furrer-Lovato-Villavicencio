import Navbar from "../../components/layout/Navbar";
import Footer from "../../components/layout/Footer";
import Container from "../../components/common/Container";
import Button from "../../components/common/Button";
import { Dumbbell, Home } from "lucide-react";

const NotFound = () => {
  return (
    <div className="flex min-h-screen flex-col bg-background text-text">
      <Navbar />

      <main className="flex flex-1 items-center justify-center py-20 relative overflow-hidden">
        {/* Glow effect matching home page design aesthetic */}
        <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-96 h-96 bg-primary/10 rounded-full blur-3xl pointer-events-none" />

        <Container className="flex flex-col items-center justify-center text-center relative z-10">
          <span className="inline-flex items-center gap-2 rounded-full border border-border bg-surface px-4 py-1.5 text-sm text-primary font-medium">
            <Dumbbell className="h-4 w-4" />
            Error 404
          </span>

          <h1 className="mt-6 text-7xl font-extrabold tracking-tight text-text sm:text-9xl font-display">
            404
          </h1>

          <h2 className="mt-4 text-3xl font-bold text-text sm:text-4xl font-display">
            Pagina no encontrada
          </h2>

          <p className="mt-4 max-w-md text-lg text-text-muted leading-relaxed font-sans">
            Quizas se trate de un error, vuelve a la pagina principal
          </p>

          <div className="mt-8 flex flex-wrap justify-center gap-4">
            <Button href="/" size="md">
              <Home className="mr-2 h-5 w-5" />
              Volver a la página principal
            </Button>
          </div>
        </Container>
      </main>

      <Footer />
    </div>
  );
};

export default NotFound;
