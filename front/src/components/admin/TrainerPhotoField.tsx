import { useRef, useState } from 'react';
import { ImageUp, Trash2 } from 'lucide-react';
import { resolveMediaUrl } from '../../lib/mediaUrl';

const MAX_PHOTO_BYTES = 2 * 1024 * 1024;
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

interface TrainerPhotoFieldProps {
  photoUrl?: string | null;
  pendingFile: File | null;
  onPick: (file: File | null) => void;
  onRemove: () => void;
  onError: (message: string) => void;
}

const TrainerPhotoField = ({
  photoUrl,
  pendingFile,
  onPick,
  onRemove,
  onError,
}: TrainerPhotoFieldProps) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);

  const source = preview ?? resolveMediaUrl(photoUrl);

  const pick = (file: File | null) => {
    if (!file) {
      return;
    }
    // Checked here as well as on the server: the admin gets the reason
    // immediately instead of after a 2 MB round trip.
    if (!ALLOWED_TYPES.includes(file.type)) {
      onError('La foto debe ser un JPG, PNG o WEBP.');
      return;
    }
    if (file.size > MAX_PHOTO_BYTES) {
      onError('La foto no puede superar los 2 MB.');
      return;
    }
    setPreview(URL.createObjectURL(file));
    onPick(file);
  };

  return (
    <div className="space-y-2">
      <p className="font-body text-xs font-medium text-text sm:text-sm">Foto</p>

      <div className="flex items-center gap-4">
        {source ? (
          <img
            src={source}
            alt="Vista previa de la foto"
            className="h-20 w-20 rounded-xl object-cover"
          />
        ) : (
          <div className="flex h-20 w-20 items-center justify-center rounded-xl bg-primary/10 text-text-muted">
            <ImageUp className="h-6 w-6" />
          </div>
        )}

        <div className="flex flex-col gap-2">
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="rounded-lg border border-border px-3 py-1.5 text-sm text-text hover:border-primary hover:text-primary"
          >
            {source ? 'Cambiar foto' : 'Subir foto'}
          </button>

          {(source ?? pendingFile) && (
            <button
              type="button"
              onClick={() => {
                setPreview(null);
                onPick(null);
                onRemove();
              }}
              className="flex items-center gap-1.5 text-sm text-text-muted hover:text-red-400"
            >
              <Trash2 className="h-4 w-4" />
              Quitar
            </button>
          )}
        </div>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={(e) => pick(e.target.files?.[0] ?? null)}
      />
    </div>
  );
};

export default TrainerPhotoField;
