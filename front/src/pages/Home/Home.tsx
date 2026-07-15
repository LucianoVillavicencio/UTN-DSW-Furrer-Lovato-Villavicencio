import Navbar from "../../components/layout/Navbar";
import HeroSection from "../../components/home/HeroSection";
import ClassesSection from "../../components/home/ClassesSection";
import TestimonialsSection from "../../components/home/TestimonialsSection";
import CTASection from "../../components/home/CTASection";
import Footer from "../../components/layout/Footer";

function Home() {
  return (
    <>
      <Navbar />
      <HeroSection />
      <ClassesSection />
      <TestimonialsSection />
      <CTASection />
      <Footer />
    </>
  );
}

export default Home;
