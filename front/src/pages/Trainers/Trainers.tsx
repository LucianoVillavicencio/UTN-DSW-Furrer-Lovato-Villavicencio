import Navbar from "../../components/layout/Navbar";
import Footer from "../../components/layout/Footer";
import PageHeader from "../../components/common/PageHeader";
import CTASection from "../../components/common/CTASection";
import TrainersSection from "../../components/trainers/TrainersSection";
import WhyChooseUsSection from "../../components/trainers/WhyChooseUsSection";
import { UserCheck } from "lucide-react";

function Trainers() {
  return (
    <div className="flex min-h-screen flex-col bg-background text-text">
      <Navbar />

      <main className="flex-1">
        <PageHeader
          badge="Nuestro equipo"
          icon={UserCheck}
          title={
            <>
              Conocé a nuestros{" "}
              <span className="text-primary">entrenadores expertos</span>
            </>
          }
          subtitle="Nuestros profesionales certificados están para guiarte, motivarte y acompañarte en cada paso. Cada entrenador aporta su propia experiencia y pasión para ayudarte a alcanzar tus objetivos."
        />

        <TrainersSection />

        <WhyChooseUsSection />

        <CTASection
          title="¿Listo para entrenar con un profesional?"
          subtitle="Reservá una consulta con uno de nuestros entrenadores expertos y empezá tu transformación hoy."
          primaryButton={{
            label: "Ver planes de entrenamiento",
            href: "/plans",
          }}
        />
      </main>

      <Footer />
    </div>
  );
}

export default Trainers;
