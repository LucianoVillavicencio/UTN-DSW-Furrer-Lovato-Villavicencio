import Navbar from "../../components/layout/Navbar";
import Footer from "../../components/layout/Footer";
import AboutHeroSection from "../../components/about/AboutHeroSection";
import AboutMissionSection from "../../components/about/AboutMissionSection";
import AboutImpactSection from "../../components/about/AboutImpactSection";
import AboutFacilitiesSection from "../../components/about/AboutFacilitiesSection";
import AboutCTASection from "../../components/about/AboutCTASection";

function About() {
  return (
    <div className="flex min-h-screen flex-col bg-background text-text selection:bg-primary selection:text-background">
      <Navbar />
      <main className="flex-1 overflow-x-hidden">
        <AboutHeroSection />
        <AboutMissionSection />
        <AboutImpactSection />
        <AboutFacilitiesSection />
        <AboutCTASection />
      </main>
      <Footer />
    </div>
  );
}

export default About;
