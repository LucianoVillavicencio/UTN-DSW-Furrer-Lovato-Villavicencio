import { UserService } from './user.service';
import { Users } from './entity/users.entity';

describe('UserService', () => {
  it('no longer exposes updateUsers', () => {
    expect(
      (UserService.prototype as Record<string, unknown>).updateUsers,
    ).toBeUndefined();
  });

  // The whole point of this change: a Google account must never be given an
  // invented document number. If this method comes back, so does the bug.
  it('no longer exposes generateUniqueDni', () => {
    expect(
      (UserService.prototype as Record<string, unknown>).generateUniqueDni,
    ).toBeUndefined();
  });
});

describe('findOrCreateGoogleUser', () => {
  const googleProfile = {
    email: 'nueva@gmail.com',
    googleId: 'google-sub-1',
    name: 'Ana',
    surname: 'Pérez',
    picture: null,
  };

  const buildService = () => {
    const create = jest.fn((row: Partial<Users>) => row as Users);
    const save = jest.fn((row: Users) => Promise.resolve({ ...row, id: 7 }));
    const findOne = jest.fn().mockResolvedValue(null);
    const repository = { create, save, findOne };
    const service = new UserService(
      repository as unknown as ConstructorParameters<typeof UserService>[0],
    );
    return { service, create, save };
  };

  it('creates a Google account with no dni and no phone', async () => {
    const { service, create } = buildService();

    await service.findOrCreateGoogleUser(googleProfile);

    expect(create).toHaveBeenCalledWith(
      expect.objectContaining({ dni: null, phone: null, password: null }),
    );
  });

  it('lets the database assign the id', async () => {
    const { service, create } = buildService();

    await service.findOrCreateGoogleUser(googleProfile);

    const [row] = create.mock.calls[0] as [Record<string, unknown>];
    expect(row).not.toHaveProperty('id');
  });
});
