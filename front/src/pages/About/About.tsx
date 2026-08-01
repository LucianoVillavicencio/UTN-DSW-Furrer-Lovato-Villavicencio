import Navbar from "../../components/layout/Navbar";
import Footer from "../../components/layout/Footer";
import AboutHeroSection from "../../components/about/AboutHeroSection";
import AboutMissionSection from "../../components/about/AboutMissionSection";
import AboutImpactSection from "../../components/about/AboutImpactSection";
import AboutFacilitiesSection from "../../components/about/AboutFacilitiesSection";
import AboutCTASection from "../../components/about/AboutCTASection";

function About() {
  return (
    <>
      <Navbar />
      <AboutHeroSection />
      <AboutMissionSection />
      <AboutImpactSection />
      <AboutFacilitiesSection />
      <AboutCTASection />
      <Footer />
    </>
  );
}

export default About;
