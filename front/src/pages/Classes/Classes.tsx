import Navbar from "../../components/layout/Navbar";
import Footer from "../../components/layout/Footer";
import PageHeader from "../../components/common/PageHeader";
import ClassEnrollmentSection from "../../components/classes/ClassEnrollmentSection";
import { LayoutGridIcon } from "lucide-react";


function Classes() {
  return (
    <>
      <Navbar />
      <PageHeader
        badge="Nuestras clases"
        icon={LayoutGridIcon}
        title={
          <>
            Encuentra tu clase <span className="text-primary">perfecta</span>
          </>
        }
        subtitle="Contamos con una variedad de clases diseñadas para todos los niveles de experiencia. Desde principiantes hasta atletas avanzados, tenemos el entrenamiento perfecto para ti."
      />
      <ClassEnrollmentSection />
      <Footer />
    </>
  );
}

export default Classes;


