import Navbar from "../../components/layout/Navbar";
import HeroSection from "../../components/home/HeroSection";
import ClassesSection from "../../components/common/ClassesSection";
import TestimonialsSection from "../../components/home/TestimonialsSection";
import CTASection from "../../components/common/CTASection";
import Footer from "../../components/layout/Footer";

function Home() {
  return (
    <>
      <Navbar />
      <HeroSection />
      <ClassesSection />
      <TestimonialsSection />
      <CTASection
        title="Listo para tu transformacion ?"
        subtitle="Únete a FLG hoy mismo y obtén tu primer mes gratis. Sin contratos ni cargos ocultos."
        primaryButton={{ label: "Empezar ahora", href: "/register" }}
      />
      <Footer />
    </>
  );
}

export default Home;
