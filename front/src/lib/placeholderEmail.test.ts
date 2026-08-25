import { describe, expect, it } from 'vitest';
import { isPlaceholderEmail } from './placeholderEmail';

describe('isPlaceholderEmail', () => {
  it('recognizes an address the backend generated for a walk-in', () => {
    expect(isPlaceholderEmail('40123456@presencial.flg')).toBe(true);
  });

  it('ignores case', () => {
    expect(isPlaceholderEmail('40123456@PRESENCIAL.FLG')).toBe(true);
  });

  it('leaves a real address alone', () => {
    expect(isPlaceholderEmail('rosa@gmail.com')).toBe(false);
  });

  it('treats a missing address as not a placeholder', () => {
    expect(isPlaceholderEmail(null)).toBe(false);
    expect(isPlaceholderEmail(undefined)).toBe(false);
    expect(isPlaceholderEmail('')).toBe(false);
  });
});
