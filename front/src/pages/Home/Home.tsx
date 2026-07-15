import Navbar from "../../components/layout/Navbar";
import HeroSection from "../../components/home/HeroSection";
import ProgramsSection from "../../components/home/ProgramsSection";
import TestimonialsSection from "../../components/home/TestimonialsSection";
import CTASection from "../../components/home/CTASection";
import Footer from "../../components/layout/Footer";

function Home() {
  return (
    <>
      <Navbar />
      <HeroSection />
      <ProgramsSection />
      <TestimonialsSection />
      <CTASection />
      <Footer />
    </>
  );
}

export default Home;
