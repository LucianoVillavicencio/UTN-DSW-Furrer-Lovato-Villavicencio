import { describe, expect, it } from 'vitest';
import { mediaOrigin, resolveMediaUrl } from './mediaUrl';

describe('mediaOrigin', () => {
  it('strips the versioned API prefix', () => {
    expect(mediaOrigin('http://localhost:3000/api/v1')).toBe(
      'http://localhost:3000',
    );
  });

  it('strips it with a trailing slash too', () => {
    expect(mediaOrigin('https://api.gym.com/api/v1/')).toBe(
      'https://api.gym.com',
    );
  });

  it('leaves an origin without the prefix alone', () => {
    expect(mediaOrigin('https://api.gym.com')).toBe('https://api.gym.com');
  });
});

describe('resolveMediaUrl', () => {
  it('returns null for a trainer with no photo', () => {
    expect(resolveMediaUrl(null)).toBeNull();
    expect(resolveMediaUrl(undefined)).toBeNull();
    expect(resolveMediaUrl('')).toBeNull();
  });

  it('leaves an absolute URL untouched', () => {
    expect(resolveMediaUrl('https://cdn.gym.com/a.png')).toBe(
      'https://cdn.gym.com/a.png',
    );
  });

  it('prefixes a root-relative path with the media origin', () => {
    expect(resolveMediaUrl('/uploads/trainers/1-2.webp')).toContain(
      '/uploads/trainers/1-2.webp',
    );
    expect(resolveMediaUrl('/uploads/trainers/1-2.webp')).toMatch(/^https?:\/\//);
  });
});
