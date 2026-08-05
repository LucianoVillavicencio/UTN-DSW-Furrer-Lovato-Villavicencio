import { Star } from "lucide-react";

interface StartRatingProps {
  rating: number;
  maxStars?: number;
}

const StarRating = ({ rating, maxStars = 5 }: StartRatingProps) => {
  return (
    <div className="flex gap-1">
      {/* Genero array de N elementos vacios para poder mapearlos - el (_) es para indicar que el primer parametro de map no tiene importancia  */}
      {Array.from({ length: maxStars }).map((_, index) => (
        <Star
          key={index}
          className={`h-4 w-4 ${index < rating ? "fill-star text-star" : "fill-none text-border"}`} // index < rating compara sus posiciones contra el rating recibido. Si recibe 5 pinta todas o si recibe menos quedan las ultimas vacias y punta solo el borde
        />
      ))}
    </div>
  );
};

export default StarRating;
