import {
  normalizeCertifications,
  normalizeInstagramHandle,
} from './trainer.rules';

describe('normalizeInstagramHandle', () => {
  it('drops a leading at sign', () => {
    expect(normalizeInstagramHandle('@lucho')).toBe('lucho');
  });

  it('drops a full profile URL', () => {
    expect(normalizeInstagramHandle('https://www.instagram.com/lucho/')).toBe(
      'lucho',
    );
  });

  it('drops a bare instagram.com prefix', () => {
    expect(normalizeInstagramHandle('instagram.com/lucho')).toBe('lucho');
  });

  it('drops the tracking query a shared profile link carries', () => {
    expect(
      normalizeInstagramHandle('https://instagram.com/lucho?igsh=abc123'),
    ).toBe('lucho');
  });

  it('leaves a plain handle and surrounding spaces alone', () => {
    expect(normalizeInstagramHandle('  lucho  ')).toBe('lucho');
  });
});

describe('normalizeCertifications', () => {
  it('trims every entry and drops the empty ones', () => {
    expect(
      normalizeCertifications([
        '  Profesor de Educación Física  ',
        '',
        '   ',
        'Personal Trainer',
      ]),
    ).toEqual(['Profesor de Educación Física', 'Personal Trainer']);
  });

  it('drops entries that are not strings', () => {
    expect(normalizeCertifications(['Personal Trainer', 7, null])).toEqual([
      'Personal Trainer',
    ]);
  });

  it('passes a non-array through untouched so class-validator reports it', () => {
    expect(normalizeCertifications('Personal Trainer')).toBe(
      'Personal Trainer',
    );
  });
});
