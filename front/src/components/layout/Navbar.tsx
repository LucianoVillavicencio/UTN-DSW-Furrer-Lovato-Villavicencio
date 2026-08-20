import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Dumbbell, Menu, X, LogOut, User as UserIcon, ShieldCheck } from "lucide-react";
import Container from "../common/Container";
import Button from "../common/Button";
import { useAuth } from "../../context/AuthContext";

interface NavLink {
  label: string;
  href: string;
}


// Navbar publico/home
const publicLinks: NavLink[] = [
  { label: "Inicio", href: "/" },
  { label: "Clases", href: "/class" },
  { label: "Entrenadores", href: "/trainers" },
  { label: "Planes", href: "/membership" },
  { label: "Sobre nosotros", href: "/about" },
  { label: "Contacto", href: "/contact" },
];


// Navbar user logeado
const userLinks: NavLink[] = [
  { label: "Inicio", href: "/" },
  { label: "Turnos", href: "/turns" },
  { label: "Clases", href: "/class" },
  { label: "Entrenadores", href: "/trainers" },
  { label: "Mi cuenta", href: "/dashboard" },
  { label: "Planes", href: "/membership" },
  { label: "Sobre nosotros", href: "/about" },
  { label: "Contacto", href: "/contact" },

];


// Navbar admin
const adminLinks: NavLink[] = [
  { label: "Inicio", href: "/" },
  { label: "Turnos", href: "/turns" },
  { label: "Clases", href: "/class" },
  { label: "Entrenadores", href: "/trainers" },
  { label: "Planes", href: "/membership" },
  { label: "Contacto", href: "/contact" },
];

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { user, isAuthenticated, isAdmin, logout } = useAuth();
  const navigate = useNavigate();


  // Defino que array usar dependiendo si es el admin o user
  let navLinks = publicLinks;
  if (isAdmin) {
    navLinks = adminLinks;
  } else if (isAuthenticated) {
    navLinks = userLinks;
  }

  const handleLogout = () => {
    logout(); // Borra accessToken y user
    setIsOpen(false);
    navigate("/");
  };

  return (
    // Define header
    <header className="sticky top-0 z-50 border-b border-border bg-bg-terciary/60 backdrop-blur-sm">
      <Container className="flex h-20 items-center justify-between">
        {/* Logo  */}
        <Link to="/" className="flex items-center gap-2">
          <Dumbbell className="h-6 w-6 text-primary" />
          <span className="font-display text-xl font-bold text-text">FLG</span>
        </Link>

        {/* Links desktop */}

        <nav className="hidden items-center gap-8 lg:flex">
          {navLinks.map((link) => (
            <Link
              key={link.label}
              to={link.href}
              className="font-body text-md text-text-muted transition-colors duration-200 hover:text-primary"
            >
              {link.label}
            </Link>
          ))}


          {/* NAVBAR ADMIN */}
          {isAdmin && (
            <Link
              to="/admin"
              className="flex items-center gap-1.5 font-body text-md text-primary transition-colors duration-200 hover:text-primary-hover"
            >
              <ShieldCheck className="h-4 w-4" />
              Panel Admin
            </Link>
          )}
        </nav>

        {/* CTA desktop */}
        <div className="hidden lg:block">
          {isAuthenticated ? (
            <div className="flex items-center gap-3">
              <Link
                to="/dashboard"
                className="font-body text-sm font-semibold text-text flex items-center gap-1.5 bg-surface px-3 py-1.5 rounded-md border border-border hover:border-primary/50 transition-colors"
              >
                <UserIcon className="h-4 w-4 text-primary" />
                Hola, {user?.name}
              </Link>
              <Button onClick={handleLogout} variant="secondary" size="sm" className="flex items-center gap-1">
                <LogOut className="h-4 w-4" />
                Salir
              </Button>
            </div>
          ) : (
            <Button href="/login" size="sm">
              Ingresar
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth="2"
                stroke="currentColor"
                className="h-4 w-4 ml-1 "
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3"
                />
              </svg>
            </Button>
          )}
        </div>

        {/* Three-line button (mobile) */}
        <button
          onClick={() => setIsOpen((prev) => !prev)} // When you click on the three lines, the state changes from false to true and vice versa.
          className="text-text lg:hidden"
          aria-label={isOpen ? "Cerrar menu" : "Abrir menu"}
        >
          {/* If it's open, display X; otherwise, display the three-line button */}
          {isOpen ? (
            <X className="h-7 w-7 " />
          ) : (
            <Menu className="h-7 w-7" />
          )}{" "}
        </button>
      </Container>

      {/* Menu mobile */}
      {isOpen && ( // && is conditional rendering. If isOpen = true, it displays; if isOpen = false, it displays nothing.
        <div className="border-t border-border bg-background lg:hidden">
          <Container className="flex flex-col gap-4 py-6">
            {navLinks.map((link) => (
              <Link
                key={link.label}
                to={link.href}
                onClick={() => setIsOpen(false)} // Set to false so that it closes when you click on a link
                className="font-body text-base text-text-muted transition-colors duration-200 hover:text-primary"
              >
                {link.label}
              </Link>
            ))}

            {isAdmin && (
              <Link
                to="/admin"
                onClick={() => setIsOpen(false)}
                className="flex items-center gap-2 font-body text-base text-primary transition-colors duration-200 hover:text-primary-hover"
              >
                <ShieldCheck className="h-4 w-4" />
                Panel Admin
              </Link>
            )}

            {isAuthenticated ? (
              <div className="flex flex-col gap-2 pt-2 border-t border-border">
                <Link
                  to="/dashboard"
                  onClick={() => setIsOpen(false)}
                  className="font-body text-sm font-semibold text-text flex items-center gap-2"
                >
                  <UserIcon className="h-4 w-4 text-primary" />
                  Hola, {user?.name}
                </Link>
                <Button onClick={handleLogout} variant="secondary" size="sm" className="w-full">
                  Cerrar sesión
                </Button>
              </div>
            ) : (
              <Button href="/login" size="sm" className="mt-2 w-full">
                Ingresar
              </Button>
            )}
          </Container>
        </div>
      )}
    </header>
  );
};

export default Navbar;