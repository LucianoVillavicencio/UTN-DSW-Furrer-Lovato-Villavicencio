import { BadRequestException } from '@nestjs/common';
import type { MulterOptions } from '@nestjs/platform-express/multer/interfaces/multer-options.interface';
import { diskStorage } from 'multer';
import { mkdirSync } from 'node:fs';
import { join } from 'node:path';

export const TRAINER_PHOTO_DIRECTORY = join(
  process.cwd(),
  'uploads',
  'trainers',
);

export const TRAINER_PHOTO_MAX_BYTES = 2 * 1024 * 1024;

const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

const MIME_TO_EXTENSION: Record<string, string> = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
};

// The uploaded name is never reused: it would let a crafted filename decide
// where the file lands, and two trainers could collide on it. The extension
// is derived from the already-validated mimetype (not the client-declared
// original name), so a mismatched filename/content-type pair can't smuggle
// a dangerous extension (e.g. .svg) past the MIME allowlist.
export const trainerPhotoFilename = (dni: number, mimeType: string): string =>
  `${dni}-${Date.now()}${MIME_TO_EXTENSION[mimeType] ?? ''}`;

export const trainerPhotoPublicPath = (filename: string): string =>
  `/uploads/trainers/${filename}`;

export const trainerPhotoMulterOptions: MulterOptions = {
  storage: diskStorage({
    destination: (_request, _file, callback) => {
      // A fresh clone has an empty uploads/, so the subdirectory may not exist.
      mkdirSync(TRAINER_PHOTO_DIRECTORY, { recursive: true });
      callback(null, TRAINER_PHOTO_DIRECTORY);
    },
    filename: (request, file, callback) => {
      const dni = Number((request.params as { dni?: string }).dni);
      callback(null, trainerPhotoFilename(dni, file.mimetype));
    },
  }),
  limits: { fileSize: TRAINER_PHOTO_MAX_BYTES },
  fileFilter: (_request, file, callback) => {
    if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
      callback(
        new BadRequestException('La foto debe ser un JPG, PNG o WEBP.'),
        false,
      );
      return;
    }
    callback(null, true);
  },
};
