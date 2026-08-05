import { Dumbbell } from "lucide-react";
import Container from "../common/Container";

const footerLinks = {
  class: [
    { label: "Entrenamiento Fuerza", href: "/class/strength" },
    { label: "HIIT", href: "/class/hiit" },
    { label: "Yoga & Wellness", href: "/class/yoga" },
    { label: "Spinning", href: "/class/personal" },
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
    <footer className="border-t border-border bg-black">
      <Container className="py-16">
        <div className="grid grid-cols-1 gap-10 sm:grid-cols-3">
          {/* Logo + tagline */}
          <div>
            <a href="/" className="flex items-center gap-2">
              <Dumbbell className="h-6 w-6 text-primary" strokeWidth={2.5} />
              <span className="font-display text-xl font-bold text-text">
                FLG
              </span>
            </a>
          </div>

          {/* Columna class */}
          <div>
            <h4 className="font-display text-sm font-semibold text-text">
              Clases
            </h4>
            <ul className="mt-4 flex flex-col gap-3">
              {footerLinks.class.map((link) => (
                <li key={link.label}>
                  <a
                    href={link.href}
                    className="font-body text-sm text-text-muted transition-colors duration-200 hover:text-primary"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Columna Company */}
          <div>
            <h4 className="font-display text-sm font-semibold text-text">
              Compañia
            </h4>
            <ul className="mt-4 flex flex-col gap-3">
              {footerLinks.company.map((link) => (
                <li key={link.label}>
                  <a
                    href={link.href}
                    className="font-body text-sm text-text-muted transition-colors duration-200 hover:text-primary"
                  >
                    {link.label}
                  </a>
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
