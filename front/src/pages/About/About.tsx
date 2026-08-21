import Navbar from '../../components/layout/Navbar';
import Footer from '../../components/layout/Footer';
import AboutHeroSection from '../../components/about/AboutHeroSection';
import AboutMissionSection from '../../components/about/AboutMissionSection';
import AboutImpactSection from '../../components/about/AboutImpactSection';
import AboutFacilitiesSection from '../../components/about/AboutFacilitiesSection';
import CTASection from '../../components/common/CTASection';

function About() {
  const isLoggedIn = Boolean(localStorage.getItem('user'));

  return (
    <div className="flex min-h-screen flex-col bg-background text-text selection:bg-primary selection:text-background">
      <Navbar />
      <main className="flex-1 overflow-x-hidden">
        <AboutHeroSection />
        <AboutMissionSection />
        <AboutImpactSection />
        <AboutFacilitiesSection />
        <CTASection
          title="¿Listo para dar el paso y alcanzar tu mejor versión?"
          subtitle="El primer paso empieza con una decisión. Únete a la comunidad FitCore hoy mismo y accede a instalaciones de primera clase, entrenadores expertos y soporte continuo."
          primaryButton={{
            label: isLoggedIn ? 'Ver planes' : 'Obtener membresía',
            href: isLoggedIn ? '/membership' : '/login',
          }}
        />
      </main>
      <Footer />
    </div>
  );
}

export default About;
