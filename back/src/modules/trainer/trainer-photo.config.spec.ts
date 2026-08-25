import {
  matchesDeclaredType,
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

describe('matchesDeclaredType', () => {
  it('accepts a real JPEG', () => {
    const jpeg = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10]);
    expect(matchesDeclaredType(jpeg, 'image/jpeg')).toBe(true);
  });

  it('accepts a real PNG', () => {
    const png = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
    expect(matchesDeclaredType(png, 'image/png')).toBe(true);
  });

  it('rejects an HTML file declared as image/jpeg', () => {
    const html = Buffer.from('<html><script>alert(1)</script></html>');
    expect(matchesDeclaredType(html, 'image/jpeg')).toBe(false);
  });
});
