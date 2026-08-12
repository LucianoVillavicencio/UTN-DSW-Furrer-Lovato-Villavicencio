import { useState } from "react";
import { Dumbbell, HeartPulse, Wind, Sparkles, ShieldCheck, Coffee, CheckCircle2 } from "lucide-react";
import Container from "../common/Container";

interface FacilityItem {
  id: string;
  icon: typeof Dumbbell;
  title: string;
  badge: string;
  image: string;
  description: string;
  features: string[];
}

const facilityList: FacilityItem[] = [
  {
    id: "facility-fuerza",
    icon: Dumbbell,
    title: "Zona de Fuerza & Peso Libre",
    badge: "Equipamiento Olímpico",
    image: "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=800&q=80",
    description:
      "Máncuernas, barras olímpicas, bancas ajustables y racks de potencia de marcas líderes para maximizar tu ganancia de fuerza.",
    features: ["Pesas libres hasta 50kg", "Plataformas de Powerlifting", "Maquinaria Hammer Strength"],
  },
  {
    id: "facility-cardio",
    icon: Wind,
    title: "Zona Cardio Interactiva",
    badge: "Alta Tecnología",
    image: "https://images.unsplash.com/photo-1574680096145-d05b474e2155?auto=format&fit=crop&w=800&q=80",
    description:
      "Cintas de correr, elípticas, remadoras y bicicletas de spinning equipadas con pantallas táctiles y métricas en tiempo real.",
    features: ["Pantallas HD integradas", "Simuladores de ruta", "Monitoreo cardíaco Bluetooth"],
  },
  {
    id: "facility-estudios",
    icon: Sparkles,
    title: "Estudios Colectivos Premium",
    badge: "Audio & Iluminación Pro",
    image: "https://images.unsplash.com/photo-1518611012118-696072aa579a?auto=format&fit=crop&w=800&q=80",
    description:
      "Salas climatizadas con piso de alto impacto y sonido envolvente para clases de Yoga, Pilates, Spinning y CrossTraining.",
    features: ["Pisos amortiguados", "Ambiente climatizado", "Entrenadores en vivo"],
  },
  {
    id: "facility-nutricion",
    icon: Coffee,
    title: "FitBar & Nutrición",
    badge: "Recarga Saludable",
    image: "https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=800&q=80",
    description:
      "Smoothies de proteína personalizados, bebidas hidratantes, cafés de especialidad y suplementación de alta gama.",
    features: ["Batidos proteicos 100% naturales", "Opciones veganas y sin gluten", "Asesoría nutricional"],
  },
  {
    id: "facility-lockers",
    icon: ShieldCheck,
    title: "Vestidores & Lockers VIP",
    badge: "Máximo Confort",
    image: "https://images.unsplash.com/photo-1584735935682-2f2b69dff9d2?auto=format&fit=crop&w=800&q=80",
    description:
      "Espacios amplios y pulcros con regaderas privadas, saunas, casilleros con cerradura digital y amenities de higiene.",
    features: ["Lockers digitales inteligentes", "Duchas de agua caliente", "Servicio de toallas gratuito"],
  },
  {
    id: "facility-recuperacion",
    icon: HeartPulse,
    title: "Área de Recuperación & Relax",
    badge: "Bienestar Integral",
    image: "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?auto=format&fit=crop&w=800&q=80",
    description:
      "Zona equipada con pistolas de percusión, rodillos de espuma, estiramientos guiados y sillones de terapia de masaje.",
    features: ["Botas de presoterapia", "Rodillos y bandas de movilidad", "Sillones ergonómicos masajeadores"],
  },
];

// Fallback SVG image data URI generator
const getFallbackImage = (title: string) => {
  const encodedTitle = encodeURIComponent(title);
  return `data:image/svg+xml;charset=UTF-8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='600' height='400' viewBox='0 0 600 400'%3E%3Cdefs%3E%3ClinearGradient id='bg' x1='0%25' y1='0%25' x2='100%25' y2='100%25'%3E%3Cstop offset='0%25' stop-color='%231e293b'/%3E%3Cstop offset='100%25' stop-color='%230f172a'/%3E%3C/linearGradient%3E%3C/defs%3E%3Crect width='600' height='400' fill='url(%23bg)'/%3E%3Crect x='40' y='40' width='520' height='320' rx='20' fill='%236366f1' fill-opacity='0.08' stroke='%236366f1' stroke-opacity='0.2' stroke-width='2'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' fill='%23f8fafc' font-family='sans-serif' font-size='22' font-weight='bold'%3E${encodedTitle}%3C/text%3E%3C/svg%3E`;
};

const AboutFacilitiesSection = () => {
  // Track broken images by facility ID to display SVG fallbacks seamlessly
  const [failedImages, setFailedImages] = useState<Record<string, boolean>>({});

  const handleImageError = (id: string) => {
    setFailedImages((prev) => ({ ...prev, [id]: true }));
  };

  return (
    <section
      aria-labelledby="facilities-heading"
      className="relative bg-background py-20 lg:py-28 border-t border-border/50"
    >
      <Container>
        <div className="text-center max-w-3xl mx-auto">
          <span className="inline-block rounded-full border border-primary/20 bg-primary/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-primary shadow-sm">
            Nuestras Instalaciones
          </span>

          <h2
            id="facilities-heading"
            className="mt-6 text-3xl font-extrabold tracking-tight sm:text-4xl lg:text-5xl text-text"
          >
            Infraestructura y equipamiento de nivel mundial
          </h2>

          <p className="mt-4 font-sans text-base sm:text-lg text-text-muted leading-relaxed">
            Diseñamos un espacio moderno, seguro y motivador para que cada sesión de entrenamiento sea una experiencia extraordinaria.
          </p>
        </div>

        <div className="mt-16 grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          {facilityList.map((facility) => {
            const Icon = facility.icon;
            const isImageFailed = failedImages[facility.id];
            const imageSrc = isImageFailed
              ? getFallbackImage(facility.title)
              : facility.image;

            return (
              <article
                key={facility.id}
                className="group overflow-hidden rounded-3xl border border-border bg-surface shadow-sm transition-all duration-300 hover:-translate-y-1.5 hover:border-primary/40 hover:shadow-xl hover:shadow-primary/5 flex flex-col justify-between"
              >
                <div>
                  {/* Facility Card Thumbnail Header */}
                  <div className="relative aspect-[16/10] w-full overflow-hidden bg-background">
                    <img
                      src={imageSrc}
                      onError={() => handleImageError(facility.id)}
                      alt={`Instalación de FitCore: ${facility.title}`}
                      loading="lazy"
                      width={600}
                      height={400}
                      className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-surface via-surface/20 to-transparent pointer-events-none" />

                    {/* Floating Badge */}
                    <div className="absolute top-4 right-4 rounded-full border border-white/10 bg-background/80 px-3 py-1 text-xs font-semibold text-primary backdrop-blur-md shadow-md">
                      {facility.badge}
                    </div>

                    {/* Icon Badge */}
                    <div className="absolute bottom-4 left-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary text-background shadow-lg transition-transform duration-300 group-hover:scale-110">
                      <Icon className="h-6 w-6" />
                    </div>
                  </div>

                  {/* Card Content Body */}
                  <div className="p-6">
                    <h3 className="text-xl font-bold text-text group-hover:text-primary transition-colors duration-300">
                      {facility.title}
                    </h3>

                    <p className="mt-3 font-sans text-sm text-text-muted leading-relaxed">
                      {facility.description}
                    </p>

                    {/* Feature Highlights List */}
                    <ul className="mt-6 space-y-2 border-t border-border/60 pt-4">
                      {facility.features.map((feat, idx) => (
                        <li key={`${facility.id}-feat-${idx}`} className="flex items-center gap-2 text-xs font-medium text-text-muted">
                          <CheckCircle2 className="h-3.5 w-3.5 text-primary shrink-0" />
                          <span>{feat}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </Container>
    </section>
  );
};

export default AboutFacilitiesSection;

