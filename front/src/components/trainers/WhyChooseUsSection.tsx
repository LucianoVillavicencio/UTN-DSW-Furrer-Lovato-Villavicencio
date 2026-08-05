import { Award, Clock, Star, Users2 } from "lucide-react";
import Container from "../common/Container";
import IconFeatureCard from "../common/IconFeatureCard";
import SectionTitle from "../common/SectionTitle";

const features = [
  {
    icon: Award,
    title: "Expertos certificados",
    description:
      "Todos los entrenadores cuentan con certificaciones reconocidas a nivel nacional y continúan su formación de manera regular.",
  },
  {
    icon: Users2,
    title: "Enfoque personalizado",
    description:
      "Cada entrenador crea programas personalizados basados ​​en tus objetivos específicos y tu nivel de condición física.",
  },
  {
    icon: Star,
    title: "Resultados comprobados",
    description:
      "Nuestros entrenadores han ayudado a miles de clientes a alcanzar sus objetivos de acondicionamiento físico y a transformar sus vidas",
  },
  {
    icon: Clock,
    title: "Apoyo continuo",
    description:
      "Recibe motivación constante, correcciones de técnica y ajustes en el programa a lo largo de tu recorrido.",
  },
];

const WhyChooseUsSection = () => {
  return (
    <section className="bg-background py-20">
      <Container>
        <SectionTitle
          badge="¿Por qué elegirnos?"
          title="Qué hace especiales a nuestros entrenadores"
        />
        <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {features.map((feature) => (
            <IconFeatureCard
              key={feature.title}
              icon={feature.icon}
              title={feature.title}
              description={feature.description}
            />
          ))}
        </div>
      </Container>
    </section>
  );
};

export default WhyChooseUsSection;
