import { useEffect } from "react";
import { Mail} from "lucide-react";
import Navbar from "../../components/layout/Navbar";
import Footer from "../../components/layout/Footer";
import PageHeader from "../../components/common/PageHeader";
import ContactSection from "../../components/contact/ContactSection";

function Contact() {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="min-h-screen bg-background flex flex-col justify-between">
      <Navbar />
      <main className="grow">
        <PageHeader
          badge="Atención al cliente"
          icon={Mail}
          title={
            <>
              Ponete en <span className="text-primary">contacto</span> con nosotros
            </>
          }
          subtitle="¿Tenés dudas sobre nuestras clases, planes o entrenadores? Mandanos tu mensaje y te responderemos a la brevedad."
        />
        <ContactSection />
      </main>
      <Footer />
    </div>
  );
}

export default Contact;
