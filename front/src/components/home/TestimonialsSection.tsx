
import Container from "../common/Container";
import SectionTitle from "../common/SectionTitle";
import TestimonialCard from "./TestimonialCard";
import Button from "../common/Button";

const testimonials = [
  {
    rating: 5,
    quote: "FLG es good",
    avatarSrc:
      "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=100&q=80",
    name: "Jane Doe",
    memberSince: "2023",
  },
  {
    rating: 3,
    quote: "FLG es bueno pero tiene cosas que mejorar",
    avatarSrc:
      "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=100&q=80",
    name: "Mark Nadal",
    memberSince: "2024",
  },
];

const TestimonialsSection = () => {
  return (
    <section className="bg-neutral-900/30 py-20">
      <Container>
        <SectionTitle
          badge="Historias de Exito"
          title="Lo que dicen nuestros miembros"
          subtitle=""
        />
        <div className="mt-12 grid grid-cols-1 gap-6 md:grid-cols-2">
          {testimonials.map((testimonial) => (
            <TestimonialCard
              key={testimonial.name}
              rating={testimonial.rating}
              quote={testimonial.quote}
              avatarSrc={testimonial.avatarSrc}
              name={testimonial.name}
              memberSince={testimonial.memberSince}
            />
          ))}
        </div>

        <div className="mt-12 flex justify-center">
          <Button href="/reviews" variant="secondary">
            Mas opiniones
          </Button>
        </div>
      </Container>
    </section>
  );
};

export default TestimonialsSection;
