import Navbar from "../../components/layout/Navbar";
import Footer from "../../components/layout/Footer";
import ClassesHeroSection from "../../components/classes/ClassesHeroSection";
import AllClassesSection from "../../components/classes/AllClassesSection";

function Classes() {
  return (
    <>
      <Navbar />
      <ClassesHeroSection />
      <AllClassesSection />
      <Footer />
    </>
  );
}

export default Classes;
