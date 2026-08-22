import { BadRequestException } from '@nestjs/common';
import type { MulterOptions } from '@nestjs/platform-express/multer/interfaces/multer-options.interface';
import { diskStorage } from 'multer';
import { mkdirSync } from 'node:fs';
import { extname, join } from 'node:path';

export const TRAINER_PHOTO_DIRECTORY = join(
  process.cwd(),
  'uploads',
  'trainers',
);

export const TRAINER_PHOTO_MAX_BYTES = 2 * 1024 * 1024;

const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

// The uploaded name is never reused: it would let a crafted filename decide
// where the file lands, and two trainers could collide on it.
export const trainerPhotoFilename = (
  dni: number,
  originalName: string,
): string => `${dni}-${Date.now()}${extname(originalName).toLowerCase()}`;

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
      callback(null, trainerPhotoFilename(dni, file.originalname));
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
