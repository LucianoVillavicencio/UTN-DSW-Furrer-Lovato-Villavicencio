import { Bike, Dumbbell, Flame } from "lucide-react";
import Container from "../common/Container";
import SectionTitle from "../common/SectionTitle";
import ClassCard from "./ClassCard";
import Button from "../common/Button";

const classes = [
  {
    icon: Dumbbell,
    title: "Entrenamiento de fuerza",
    descripcion:
      "Desarrolla músculo y aumenta tu fuerza con nuestras c integrales de entrenamiento con pesas. ",
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

const ClassesSection = () => {
  return (
    <section className="bg-background py-20">
      <Container>
        <SectionTitle
          badge="Algunas clases"
          title="Elige tu camino fitness"
          subtitle="Desde clases para principiantes hasta pc de formación avanzada, tenemos algo para todos."
        />

        <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {classes.map((classItem) => (
            <ClassCard
              key={classItem.title}
              icon={classItem.icon}
              title={classItem.title}
              descripcion={classItem.descripcion}
            />
          ))}
        </div>

        <div className="mt-12 flex justify-center">
          <Button href="/class" variant="secondary">
            Observar mas
          </Button>
        </div>
      </Container>
    </section>
  );
};

export default ClassesSection;
