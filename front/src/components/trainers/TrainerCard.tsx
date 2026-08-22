import { AtSign, Dumbbell, Phone } from 'lucide-react';
import Card from '../common/Card';
import Badge from '../common/badge/Badge';
import Button from '../common/Button';
import TrainerPhoto from './TrainerPhoto';
import TrainerSchedule from './TrainerSchedule';
import { useAuth } from '../../context/useAuth';

import type { Trainer } from '../../types/trainer';

interface TrainerCardProps {
  trainer: Trainer;
}

const TrainerCard = ({ trainer }: TrainerCardProps) => {
  const { isAuthenticated } = useAuth();
  const bookingHref = isAuthenticated ? '/class' : '/login';

  const fullName = `${trainer.name} ${trainer.surname}`;
  const certifications = trainer.certifications ?? [];
  const classes = trainer.classes ?? [];

  return (
    <Card className="flex h-full flex-col overflow-hidden !p-0">
      <div className="relative">
        <TrainerPhoto
          photoUrl={trainer.photoUrl}
          name={trainer.name}
          surname={trainer.surname}
        />
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-4">
          <h3 className="truncate font-display text-lg font-semibold text-white">
            Prof. {fullName}
          </h3>
          <p className="truncate text-sm font-medium text-primary">
            {trainer.speciality ?? 'Entrenamiento general'}
          </p>
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-4 p-6">
        {certifications.length > 0 && (
          <div>
            <p className="mb-2 text-xs font-semibold text-text">
              Certificaciones
            </p>
            <div className="flex flex-wrap gap-2">
              {certifications.map((certification) => (
                <Badge
                  key={certification}
                  variant="accent"
                  className="px-3 py-1 normal-case"
                >
                  {certification}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {classes.length > 0 && (
          <div>
            <p className="mb-2 text-xs font-semibold text-text">Dicta</p>
            <div className="flex flex-wrap gap-2">
              {classes.map((trainerClass) => (
                <Badge
                  key={trainerClass.id}
                  variant="neutral"
                  icon={Dumbbell}
                  className="px-3 py-1"
                >
                  {trainerClass.name}
                </Badge>
              ))}
            </div>
          </div>
        )}

        <TrainerSchedule shifts={trainer.workSchedule} />

        <div className="mt-auto space-y-2 border-t border-border/40 pt-4 text-xs text-text-muted">
          {trainer.instagram && (
            <span className="flex items-center gap-2">
              <AtSign className="h-3.5 w-3.5 shrink-0 text-primary" />
              <a
                href={`https://instagram.com/${trainer.instagram}`}
                target="_blank"
                rel="noopener noreferrer"
                className="truncate transition-colors hover:text-text"
              >
                @{trainer.instagram}
              </a>
            </span>
          )}

          {trainer.phone && (
            <span className="flex items-center gap-2">
              <Phone className="h-3.5 w-3.5 shrink-0 text-primary" />
              {trainer.phone}
            </span>
          )}
        </div>

        <Button href={bookingHref} size="sm" className="w-full">
          Reservar sesión
        </Button>
      </div>
    </Card>
  );
};

export default TrainerCard;
