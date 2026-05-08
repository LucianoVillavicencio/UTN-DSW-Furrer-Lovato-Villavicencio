import { Link } from 'react-router-dom';
import { ArrowRight, Zap, Target, Users } from 'lucide-react';
import './Home.css';

const Home = () => {
  return (
    <div className="home-container">
      {/* Hero Section */}
      <section className="hero">
        <div className="container hero-content animate-fade-in">
          <h1 className="hero-title text-gradient">
            SUPERA TUS LÍMITES
          </h1>
          <p className="hero-subtitle">
            Entrenamiento integral, clases dinámicas y profesionales de primer nivel.
            Tu transformación comienza hoy en FLG Gym.
          </p>
          <div className="hero-actions gap-2 d-flex flex-column flex-md-row">
            <Link to="/clases" className="btn btn-primary d-flex justify-center">
              Ver Clases disponibles <ArrowRight size={20} style={{ marginLeft: 8 }} />
            </Link>
            <button className="btn btn-outline d-flex justify-center">Únete Ahora</button>
          </div>
        </div>
        <div className="hero-bg-accent"></div>
      </section>

      {/* Features Section */}
      <section className="features container mt-5 mb-5">
        <div className="text-center mb-4">
          <h2 className="section-title">Por qué elegir <span className="text-gradient">FLG Gym</span></h2>
        </div>
        
        <div className="card-grid mt-4">
          <div className="card feature-card text-center d-flex flex-column align-center gap-2">
            <div className="feature-icon"><Zap size={32} color="var(--brand-primary)" /></div>
            <h3>Alta Intensidad</h3>
            <p className="text-secondary">Clases diseñadas para llevarte al extremo de forma segura y eficiente.</p>
          </div>
          
          <div className="card feature-card text-center d-flex flex-column align-center gap-2">
            <div className="feature-icon"><Target size={32} color="var(--brand-primary)" /></div>
            <h3>Seguimiento</h3>
            <p className="text-secondary">Monitoreamos tu progreso para asegurar que cumplas tus metas mes a mes.</p>
          </div>
          
          <div className="card feature-card text-center d-flex flex-column align-center gap-2">
            <div className="feature-icon"><Users size={32} color="var(--brand-primary)" /></div>
            <h3>Comunidad</h3>
            <p className="text-secondary">Entrena junto a personas con tu misma visión y motivación diaria.</p>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
