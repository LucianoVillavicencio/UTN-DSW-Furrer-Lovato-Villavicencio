import { UserService } from './user.service';

describe('UserService', () => {
  it('no longer exposes updateUsers', () => {
    expect(
      (UserService.prototype as Record<string, unknown>).updateUsers,
    ).toBeUndefined();
  });
});
