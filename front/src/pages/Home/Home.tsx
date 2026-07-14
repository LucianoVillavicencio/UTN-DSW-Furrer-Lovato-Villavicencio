import Navbar from "../../components/layout/Navbar";
import Hero from "../../components/home/HeroSection";
import ProgramSection from "../../components/home/ProgramsSection";
import TestimonialSection from "../../components/home/TestimonialSection";

function Home() {
  return (
    <>
      <Navbar />
      <Hero />
      <ProgramSection />
      <TestimonialSection />
    </>
  );
}

export default Home;
