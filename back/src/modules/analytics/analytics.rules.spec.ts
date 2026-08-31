import { matchesOwnerPassword } from './analytics.rules';

describe('matchesOwnerPassword', () => {
  it('accepts the exact password', () => {
    expect(matchesOwnerPassword('correct horse', 'correct horse')).toBe(true);
  });

  it('rejects a wrong password', () => {
    expect(matchesOwnerPassword('wrong', 'correct horse')).toBe(false);
  });

  it('rejects an empty string', () => {
    expect(matchesOwnerPassword('', 'correct horse')).toBe(false);
  });

  it('rejects a correct prefix', () => {
    expect(matchesOwnerPassword('correct', 'correct horse')).toBe(false);
  });

  it('rejects a longer string that starts with the password', () => {
    expect(matchesOwnerPassword('correct horse!', 'correct horse')).toBe(false);
  });
});
