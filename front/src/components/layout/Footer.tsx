import { Link } from "react-router-dom";
import { Dumbbell } from "lucide-react";
import Container from "../common/Container";

const footerLinks = {
  class: [
    { label: "Entrenamiento Fuerza", href: "/class" },
    { label: "HIIT", href: "/class" },
    { label: "Yoga & Wellness", href: "/class" },
    { label: "Spinning", href: "/class" },
  ],
  company: [
    { label: "Sobre nosotros", href: "/about" },
    { label: "Clases", href: "/class" },
    { label: "Entrenadores", href: "/trainers" },
    { label: "Reseñas", href: "/reviews" },
    { label: "Planes", href: "/plan" },
    { label: "Contacto", href: "/contact" },
  ],
};

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t border-border bg-background">
      <Container className="py-16">
        <div className="grid grid-cols-1 gap-10 sm:grid-cols-3">
          {/* Logo + tagline */}
          <div>
            <Link to="/" className="flex items-center gap-2">
              <Dumbbell className="h-6 w-6 text-primary" strokeWidth={2.5} />
              <span className="font-display text-xl font-bold text-text">
                FLG
              </span>
            </Link>
            <p className="mt-3 text-xs text-text-muted leading-relaxed">
              Zeballos 1341, Rosario, Santa Fe
            </p>
            <p className="mt-1 text-xs text-text-muted">
              Tel: +54 9 341 272-4611
            </p>
          </div>

          {/* Columna class */}
          <div>
            <h4 className="font-display text-sm font-semibold text-text">
              Clases
            </h4>
            <ul className="mt-4 flex flex-col gap-3">
              {footerLinks.class.map((link, idx) => (
                <li key={`${link.label}-${idx}`}>
                  <Link
                    to={link.href}
                    className="font-body text-sm text-text-muted transition-colors duration-200 hover:text-primary"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Columna Company */}
          <div>
            <h4 className="font-display text-sm font-semibold text-text">
              Compañía
            </h4>
            <ul className="mt-4 flex flex-col gap-3">
              {footerLinks.company.map((link) => (
                <li key={link.label}>
                  <Link
                    to={link.href}
                    className="font-body text-sm text-text-muted transition-colors duration-200 hover:text-primary"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Copyright */}
        <div className="mt-12 border-t border-border pt-6 text-center">
          <p className="font-body text-sm text-text-muted">
            © {currentYear} FLG. Todos los derechos reservados.
          </p>
        </div>
      </Container>
    </footer>
  );
};

export default Footer;

