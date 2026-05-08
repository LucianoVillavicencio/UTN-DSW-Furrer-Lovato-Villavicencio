import { Link, useLocation } from 'react-router-dom';
import { Dumbbell, Menu, X } from 'lucide-react';
import { useState } from 'react';
import './Header.css';

const Header = () => {
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <header className="navbar">
      <div className="container nav-container">
        <Link to="/" className="logo" onClick={() => setIsMobileMenuOpen(false)}>
          <Dumbbell size={28} color="var(--brand-primary)" />
          FLG <span>Gym</span>
        </Link>
        
        <button 
          className="btn btn-mobile-menu"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        >
          {isMobileMenuOpen ? <X size={24} color="var(--text-primary)" /> : <Menu size={24} color="var(--text-primary)" />}
        </button>

        <nav className={`nav-links ${isMobileMenuOpen ? 'open' : ''}`}>
          <Link to="/" className={`nav-link ${location.pathname === '/' ? 'active' : ''}`} onClick={() => setIsMobileMenuOpen(false)}>Inicio</Link>
          <Link to="/clases" className={`nav-link ${location.pathname === '/clases' ? 'active' : ''}`} onClick={() => setIsMobileMenuOpen(false)}>Clases</Link>
          <button className="btn btn-outline" onClick={() => alert("Abre modal de login")}>Ingresar</button>
        </nav>
      </div>
    </header>
  );
};

export default Header;
