import { useState } from 'react';
import Modal from './Modal';
import InputField from '../common/InputField';
import FormAlert from '../common/FormAlert';
import Button from '../common/Button';
import TrainerPhotoField from './TrainerPhotoField';
import TrainerCertificationsField from './TrainerCertificationsField';
import TrainerScheduleField from './TrainerScheduleField';
import { EMPTY_TRAINER_FORM, findTrainerFormError } from './trainer-form';
import {
  deleteTrainerPhoto,
  uploadTrainerPhoto,
} from '../../services/trainer.service';

import type { Trainer } from '../../types/trainer';

interface TrainerFormProps {
  trainer: Trainer | null; // null when creating
  save: (form: Trainer, isCreating: boolean) => Promise<Trainer>;
  reload: () => Promise<void>;
  onClose: () => void;
}

const TrainerForm = ({ trainer, save, reload, onClose }: TrainerFormProps) => {
  const isCreating = trainer === null;
  const [form, setForm] = useState<Trainer>(trainer ?? EMPTY_TRAINER_FORM);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [shouldRemovePhoto, setShouldRemovePhoto] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const handleSubmit = async () => {
    const validationError = findTrainerFormError(form);
    if (validationError) {
      setFormError(validationError);
      return;
    }

    setIsSaving(true);
    try {
      const saved = await save(form, isCreating);

      if (pendingFile) {
        try {
          await uploadTrainerPhoto(saved.dni, pendingFile);
        } catch (err) {
          // The trainer is already stored, so this cannot be swallowed: the
          // admin has to know the photo did not attach.
          setFormError(
            err instanceof Error
              ? `El profesor se guardó, pero la foto no: ${err.message}`
              : 'El profesor se guardó, pero la foto no se pudo subir.',
          );
          await reload();
          return;
        }
      }

      if (shouldRemovePhoto && !isCreating) {
        await deleteTrainerPhoto(form.dni);
      }

      onClose();
      await reload();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'No se pudo guardar.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Modal
      title={isCreating ? 'Agregar entrenador' : 'Editar entrenador'}
      onClose={onClose}
    >
      <div className="space-y-4">
        <FormAlert type="error" message={formError} />
        <InputField
          label="DNI"
          type="number"
          value={form.dni || ''}
          disabled={!isCreating}
          onChange={(e) => setForm({ ...form, dni: Number(e.target.value) })}
        />
        <div className="grid gap-4 sm:grid-cols-2">
          <InputField
            label="Nombre"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />
          <InputField
            label="Apellido"
            value={form.surname}
            onChange={(e) => setForm({ ...form, surname: e.target.value })}
          />
        </div>
        <InputField
          label="Email"
          type="email"
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
        />
        <InputField
          label="Teléfono"
          value={form.phone ?? ''}
          onChange={(e) => setForm({ ...form, phone: e.target.value })}
        />
        <InputField
          label="Especialidad"
          value={form.speciality ?? ''}
          onChange={(e) => setForm({ ...form, speciality: e.target.value })}
        />
        <InputField
          label="Instagram"
          placeholder="@usuario o link del perfil"
          value={form.instagram ?? ''}
          onChange={(e) => setForm({ ...form, instagram: e.target.value })}
        />

        <TrainerPhotoField
          photoUrl={shouldRemovePhoto ? null : form.photoUrl}
          pendingFile={pendingFile}
          onPick={setPendingFile}
          onRemove={() => {
            setShouldRemovePhoto(true);
            setForm({ ...form, photoUrl: null });
          }}
          onError={setFormError}
        />

        <TrainerCertificationsField
          value={form.certifications ?? []}
          onChange={(certifications) => setForm({ ...form, certifications })}
        />

        <TrainerScheduleField
          value={form.workSchedule ?? []}
          onChange={(workSchedule) => setForm({ ...form, workSchedule })}
        />

        <div className="flex gap-3 pt-2">
          <Button
            onClick={handleSubmit}
            disabled={isSaving}
            className="flex-1"
          >
            {isSaving ? 'Guardando...' : 'Guardar'}
          </Button>
          <Button variant="secondary" onClick={onClose} disabled={isSaving}>
            Cancelar
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default TrainerForm;
