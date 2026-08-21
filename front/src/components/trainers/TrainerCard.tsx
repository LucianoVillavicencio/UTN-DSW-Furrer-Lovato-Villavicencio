import { Mail, Phone } from 'lucide-react';
import Card from '../common/Card';
import Badge from '../common/badge/Badge';
import Button from '../common/Button';
import { useAuth } from '../../context/useAuth';
import type { Trainer } from '../../types/trainer';

interface TrainerCardProps {
  trainer: Trainer;
}

// Initials for the avatar: the backend Trainer entity stores no picture.
const getInitials = (name: string, surname: string): string =>
  `${name.charAt(0)}${surname.charAt(0)}`.toUpperCase();

const TrainerCard = ({ trainer }: TrainerCardProps) => {
  const { isAuthenticated } = useAuth();
  const bookingHref = isAuthenticated ? '/class' : '/login';

  const fullName = `${trainer.name} ${trainer.surname}`;

  return (
    <Card className="flex h-full flex-col overflow-hidden">
      <div className="flex items-center gap-4">
        <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xl font-extrabold text-primary">
          {getInitials(trainer.name, trainer.surname)}
        </span>

        <div className="min-w-0">
          <h3 className="truncate text-lg font-semibold text-text">
            Prof. {fullName}
          </h3>
          <p className="text-sm font-medium text-primary">
            {trainer.speciality || 'Entrenamiento general'}
          </p>
        </div>
      </div>

      <div className="mt-5 flex-1 space-y-2.5 border-t border-border/40 pt-4 text-xs text-text-muted">
        <span className="flex items-center gap-2">
          <Mail className="h-3.5 w-3.5 shrink-0 text-primary" />
          <a
            href={`mailto:${trainer.email}`}
            className="truncate transition-colors hover:text-text"
          >
            {trainer.email}
          </a>
        </span>

        {trainer.phone && (
          <span className="flex items-center gap-2">
            <Phone className="h-3.5 w-3.5 shrink-0 text-primary" />
            {trainer.phone}
          </span>
        )}

        {trainer.speciality && (
          <div className="pt-2">
            <p className="text-xs font-semibold text-text">Especialidad:</p>
            <div className="mt-2 flex flex-wrap gap-2">
              <Badge variant="neutral" className="text-xs">
                {trainer.speciality}
              </Badge>
            </div>
          </div>
        )}
      </div>

      <Button href={bookingHref} size="sm" className="mt-6 w-full">
        Reservar sesión
      </Button>
    </Card>
  );
};

export default TrainerCard;
