import { useEffect } from "react";
import Navbar from "../../components/layout/Navbar";
import Footer from "../../components/layout/Footer";
import ContactSection from "../../components/contact/ContactSection";

function Contact() {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="min-h-screen bg-background flex flex-col justify-between">
      <Navbar />
      <main className="grow">
        <ContactSection />
      </main>
      <Footer />
    </div>
  );
}

export default Contact;
