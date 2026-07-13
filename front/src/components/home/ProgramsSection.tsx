import { Bike, Dumbbell, Flame } from "lucide-react";
import Container from "../common/Container";
import SectionTitle from "../common/SectionTitle";
import ProgramCard from "./ProgramCard";
import Button from "../common/Button";

const programs = [
  {
    icon: Dumbbell,
    title: "Entrenamiento de fuerza",
    descripcion:
      "Desarrolla músculo y aumenta tu fuerza con nuestros programas integrales de entrenamiento con pesas. ",
  },
  {
    icon: Flame,
    title: "Entrenamiento HIIT",
    descripcion:
      "Entrenamiento de intervalos de alta intensidad para una máxima quema de calorías y salud cardiovascular. ",
  },

  {
    icon: Bike,
    title: "Clases de spinning",
    descripcion:
      "Maximiza tu potencia y quema calorías al ritmo de la música con entrenamientos de ciclismo indoor que desafían tus límites y fortalecen tus piernas. ",
  },
];

const ProgramSection = () => {
  return (
    <section className="bg-background py-20">
      <Container>
        <SectionTitle
          badge="Algunos Programas"
          title="Elige tu camino fitness"
          subtitle="Desde clases para principiantes hasta programas de formación avanzada, tenemos algo para todos."
        />

        <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {programs.map((program) => (
            <ProgramCard
              key={program.title}
              icon={program.icon}
              title={program.title}
              descripcion={program.descripcion}
            />
          ))}
        </div>

        <div className="mt-12 flex justify-center">
          <Button href="/program" variant="secondary">
            Observar mas
          </Button>
        </div>
      </Container>
    </section>
  );
};

export default ProgramSection;
