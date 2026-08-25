import { useState } from 'react';
import { resolveMediaUrl } from '../../lib/mediaUrl';

interface TrainerPhotoProps {
  photoUrl?: string | null;
  name: string;
  surname: string;
}

const getInitials = (name: string, surname: string): string =>
  `${name.charAt(0)}${surname.charAt(0)}`.toUpperCase();

// Initials are the fallback twice over: for a trainer with no photo, and for a
// photoUrl whose file no longer exists on the server's disk.
const TrainerPhoto = ({ photoUrl, name, surname }: TrainerPhotoProps) => {
  const [hasFailed, setHasFailed] = useState(false);
  const source = resolveMediaUrl(photoUrl);

  if (!source || hasFailed) {
    return (
      <div className="flex h-56 w-full items-center justify-center bg-primary/10">
        <span className="font-display text-5xl font-extrabold text-primary">
          {getInitials(name, surname)}
        </span>
      </div>
    );
  }

  return (
    <img
      src={source}
      alt={`Foto de ${name} ${surname}`}
      loading="lazy"
      onError={() => setHasFailed(true)}
      className="h-56 w-full object-cover object-top"
    />
  );
};

export default TrainerPhoto;
