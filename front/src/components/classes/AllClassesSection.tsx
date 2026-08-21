import { Bike, Dumbbell, Flame, Zap, Heart, Wind } from 'lucide-react';
import Container from '../common/Container';
import IconFeatureCard from '../common/IconFeatureCard';

const allClasses = [
  {
    icon: Dumbbell,
    title: 'Entrenamiento de fuerza',
    description:
      'Desarrolla músculo y aumenta tu fuerza con nuestras clases integrales de entrenamiento con pesas.',
  },
  {
    icon: Flame,
    title: 'Entrenamiento HIIT',
    description:
      'Entrenamiento de intervalos de alta intensidad para una máxima quema de calorías y salud cardiovascular.',
  },
  {
    icon: Bike,
    title: 'Clases de spinning',
    description:
      'Maximiza tu potencia y quema calorías al ritmo de la música con entrenamientos de ciclismo indoor.',
  },
  {
    icon: Zap,
    title: 'Entrenamiento funcional',
    description:
      'Ejercicios que mejoran tu fuerza, flexibilidad y equilibrio con movimientos prácticos del día a día.',
  },
  {
    icon: Heart,
    title: 'Yoga y flexibilidad',
    description:
      'Mejora tu flexibilidad, reduce el estrés y encuentra el equilibrio mental con nuestras clases de yoga.',
  },
  {
    icon: Wind,
    title: 'Pilates',
    description:
      'Fortalece tu core y mejora tu postura con ejercicios de pilates diseñados para tonificar y estirar.',
  },
];

const AllClassesSection = () => {
  return (
    <section id="all-classes" className="bg-background py-20">
      <Container>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {allClasses.map((classItem) => (
            <IconFeatureCard
              key={classItem.title}
              icon={classItem.icon}
              title={classItem.title}
              description={classItem.description}
            />
          ))}
        </div>
      </Container>
    </section>
  );
};

export default AllClassesSection;
