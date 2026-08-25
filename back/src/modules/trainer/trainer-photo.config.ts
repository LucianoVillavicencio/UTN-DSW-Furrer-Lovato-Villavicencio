import { BadRequestException } from '@nestjs/common';
import type { MulterOptions } from '@nestjs/platform-express/multer/interfaces/multer-options.interface';
import { memoryStorage } from 'multer';
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

// First bytes of each accepted format. No dependency needed — three
// signatures don't justify a file-type-sniffing library.
const MAGIC_BYTES: Record<string, number[]> = {
  'image/jpeg': [0xff, 0xd8, 0xff],
  'image/png': [0x89, 0x50, 0x4e, 0x47],
  'image/webp': [0x52, 0x49, 0x46, 0x46], // 'RIFF'; the full WEBP check
  // would also read bytes 8-11 for 'WEBP', but the RIFF prefix alone is
  // already enough to reject an HTML/script payload declared as image/webp.
};

export const matchesDeclaredType = (
  buffer: Buffer,
  mimeType: string,
): boolean => {
  const signature = MAGIC_BYTES[mimeType];
  if (!signature) return false;
  return signature.every((byte, index) => buffer[index] === byte);
};

// memoryStorage (not diskStorage): fileFilter fires on Busboy's 'file'
// event, before *any* storage engine (disk or memory) has read the file's
// bytes off the wire, so file.buffer is never populated yet inside
// fileFilter regardless of which storage is configured — the magic-byte
// check can only run once the bytes have actually been read somewhere.
// Switching to memoryStorage still buys the property we need: the upload is
// held in RAM (file.buffer, populated by the time the controller receives
// it via @UploadedFile()) rather than written straight to disk, so the
// controller can run matchesDeclaredType() on it and reject before a single
// byte reaches the filesystem. Holding the whole upload in memory is
// acceptable here because TRAINER_PHOTO_MAX_BYTES already caps it at 2 MiB.
export const trainerPhotoMulterOptions: MulterOptions = {
  storage: memoryStorage(),
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
