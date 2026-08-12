import Navbar from "../../components/layout/Navbar";
import Footer from "../../components/layout/Footer";
import PageHeader from "../../components/common/PageHeader";
import CTASection from "../../components/common/CTASection";
import TrainerCard from "../../components/trainers/TrainerCard";
import WhyChooseUsSection from "../../components/trainers/WhyChooseUsSection";
import Container from "../../components/common/Container";
import { UserCheck } from "lucide-react";

const trainers = [
  {
    photo:
      "https://images.unsplash.com/photo-1594381898411-846e7d193883?auto=format&fit=crop&w=400&q=80",
    rating: 4.9,
    name: "Sarah Mitchell",
    specialty: "Entrenamiento de fuerza y powerlifting",
    experienceYears: 8,
    sessions: 2500,
    description:
      "Sarah ayuda a sus clientes a desarrollar fuerza real y confianza. Ex-powerlifter competitiva, apasionada por enseñar la técnica correcta.",
    certifications: ["NASM-CPT", "CSCS", "Entrenadora de Powerlifting"],
  },
  {
    photo:
      "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?auto=format&fit=crop&w=400&q=80",
    rating: 4.8,
    name: "Marcus Johnson",
    specialty: "HIIT y entrenamiento funcional",
    experienceYears: 6,
    sessions: 1800,
    description:
      "Marcus le pone energía y motivación a cada sesión. Experto en movimientos funcionales que se traducen en fuerza real y rendimiento atlético.",
    certifications: [
      "ACSM-CPT",
      "Certificado TRX",
      "Especialista en Kettlebell",
    ],
  },
  {
    photo:
      "https://images.unsplash.com/photo-1548690312-e3b507d8c110?auto=format&fit=crop&w=400&q=80",
    rating: 5,
    name: "Emily Chen",
    specialty: "Yoga y mindfulness",
    experienceYears: 10,
    sessions: 3200,
    description:
      "Emily combina prácticas tradicionales de yoga con técnicas modernas de bienestar. Se especializa en reducción del estrés y conexión mente-cuerpo.",
    certifications: ["RYT-500", "Instructora de Meditación", "Yoga Prenatal"],
  },
  {
    photo:
      "https://images.unsplash.com/photo-1567013127542-490d757e51fc?auto=format&fit=crop&w=400&q=80",
    rating: 4.9,
    name: "David Rodriguez",
    specialty: "Entrenamiento personal y pérdida de peso",
    experienceYears: 7,
    sessions: 2100,
    description:
      "David ayudó a cientos de clientes a alcanzar sus objetivos de pérdida de peso a través de entrenamiento personalizado y guía nutricional. ",
    certifications: ["NASM-CPT", "Coach de Nutrición", "Ejercicio Correctivo"],
  },
  {
    photo:
      "https://images.unsplash.com/photo-1517836357463-d25dfeac3438?auto=format&fit=crop&w=400&q=80",
    rating: 4.8,
    name: "Jessica Park",
    specialty: "Clases grupales y danza",
    experienceYears: 5,
    sessions: 1500,
    description: "Jessica le da energía y diversión a cada clase grupal. ",
    certifications: [
      "Instructora de Fitness Grupal",
      "Certificada en Zumba",
      "Instructora de Barre",
    ],
  },
  {
    photo:
      "https://images.unsplash.com/photo-1517838277536-f5f99be501cd?auto=format&fit=crop&w=400&q=80",
    rating: 4.9,
    name: "Alex Thompson",
    specialty: "Rendimiento deportivo y recuperación",
    experienceYears: 9,
    sessions: 2800,
    description:
      "Alex trabaja con atletas y personas activas para optimizar su rendimiento y prevenir lesiones. Experto en análisis de movimiento y protocolos de recuperación.",
    certifications: [
      "CSCS",
      "Masajista Deportivo",
      "Especialista en Movimiento",
    ],
  },
];

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

        <section className="bg-background py-20">
          <Container>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {trainers.map((trainer) => (
                <TrainerCard key={trainer.name} {...trainer} />
              ))}
            </div>
          </Container>
        </section>

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
