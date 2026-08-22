import {
  trainerPhotoFilename,
  trainerPhotoPublicPath,
} from './trainer-photo.config';

describe('trainerPhotoFilename', () => {
  it('keeps the dni and the lowercased extension', () => {
    const filename = trainerPhotoFilename(30111222, 'Foto Perfil.JPG');
    expect(filename).toMatch(/^30111222-\d+\.jpg$/);
  });

  it('never keeps the original name, so a crafted name cannot traverse', () => {
    const filename = trainerPhotoFilename(1, '../../etc/passwd.png');
    expect(filename).toMatch(/^1-\d+\.png$/);
  });
});

describe('trainerPhotoPublicPath', () => {
  it('builds a root-relative path under the static prefix', () => {
    expect(trainerPhotoPublicPath('1-2.webp')).toBe(
      '/uploads/trainers/1-2.webp',
    );
  });
});
