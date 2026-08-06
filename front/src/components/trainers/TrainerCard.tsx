import { Clock, Users } from "lucide-react";
import Card from "../common/Card";
import Badge from "../common/badge/Badge";
import RatingBadge from "../common/badge/RatingBadge";
import Button from "../common/Button";

interface TrainerCardProps {
  photo: string;
  rating: number;
  name: string;
  specialty: string;
  experienceYears: number;
  sessions: number;
  description: string;
  certifications: string[];
}

const TrainerCard = ({
  photo,
  rating,
  name,
  specialty,
  experienceYears,
  sessions,
  description,
  certifications,
}: TrainerCardProps) => {
  const isUserLoggedIn = Boolean(localStorage.getItem("user"));
  const bookingHref = isUserLoggedIn ? "/class" : "/login";

  return (
    <Card className="flex h-full flex-col overflow-hidden p-0">
      <div className="relative h-72 w-full shrink-0 overflow-hidden rounded-lg">
        <img
          src={photo}
          alt={`Foto de ${name}`}
          className="h-full w-full object-cover object-center"
        />

        <RatingBadge rating={rating} className="absolute right-3 top-3" />
      </div>

      <div className="flex flex-1 flex-col p-6">
        <h3 className="text-lg font-semibold text-text">{name}</h3>

        <p className="text-sm font-medium text-primary">{specialty}</p>

        <div className="mt-3 flex items-center gap-4 text-xs text-text-muted">
          <span className="flex items-center gap-1">
            <Clock className="h-3.5 w-3.5" />
            {experienceYears} años de experiencia
          </span>

          <span className="flex items-center gap-1">
            <Users className="h-3.5 w-3.5" />
            {sessions} sesiones
          </span>
        </div>

        <div className="flex-1">
          <p className="mt-4 min-h-96px text-sm text-text-muted">
            {description}
          </p>

          <div className="mt-4 min-h-88px">
            <p className="text-xs font-semibold text-text">Certificaciones:</p>

            <div className="mt-2 flex flex-wrap gap-2">
              {certifications.map((cert) => (
                <Badge key={cert} variant="neutral" className="text-xs">
                  {cert}
                </Badge>
              ))}
            </div>
          </div>
        </div>

        <Button href={bookingHref} size="sm" className="mt-6 w-full">
          Reservar sesión
        </Button>
      </div>
    </Card>
  );
};

export default TrainerCard;

