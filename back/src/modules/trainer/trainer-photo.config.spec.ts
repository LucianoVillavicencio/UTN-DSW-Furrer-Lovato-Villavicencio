import {
  trainerPhotoFilename,
  trainerPhotoPublicPath,
} from './trainer-photo.config';

describe('trainerPhotoFilename', () => {
  it('derives the extension from the validated mime type', () => {
    const filename = trainerPhotoFilename(30111222, 'image/jpeg');
    expect(filename).toMatch(/^30111222-\d+\.jpg$/);
  });

  it('falls back to no extension for an unrecognized mime type', () => {
    // fileFilter already rejects anything outside ALLOWED_MIME_TYPES before
    // this function runs in production; this just proves it can't be
    // tricked into producing a dangerous or wrong extension.
    const filename = trainerPhotoFilename(1, 'image/gif');
    expect(filename).toMatch(/^1-\d+$/);
  });
});

describe('trainerPhotoPublicPath', () => {
  it('builds a root-relative path under the static prefix', () => {
    expect(trainerPhotoPublicPath('1-2.webp')).toBe(
      '/uploads/trainers/1-2.webp',
    );
  });
});
