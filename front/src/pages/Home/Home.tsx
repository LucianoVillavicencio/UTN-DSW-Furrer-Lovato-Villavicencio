import Navbar from "../../components/layout/Navbar";
import Hero from "../../components/home/HeroSection";
import ProgramSection from "../../components/home/ProgramsSection";
import TestimonialSection from "../../components/home/TestimonialSection";
import CTASection from "../../components/home/CTASection";
import Footer from "../../components/layout/Footer";

function Home() {
  return (
    <>
      <Navbar />
      <Hero />
      <ProgramSection />
      <TestimonialSection />
      <CTASection />
      <Footer />
    </>
  );
}

export default Home;
