import { BadRequestException } from '@nestjs/common';
import { UserService } from './user.service';
import { Users } from './entity/users.entity';
import * as bcrypt from 'bcrypt';

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

describe('searchUsers', () => {
  // The guard is expected to throw before the query builder is ever touched,
  // but the chain is mocked out fully anyway so a regression that removes the
  // guard fails with "resolves instead of rejecting" rather than an unrelated
  // TypeError from an incomplete mock.
  const buildService = () => {
    const queryBuilder = {
      select: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      take: jest.fn().mockReturnThis(),
      getMany: jest.fn().mockResolvedValue([]),
    };
    const createQueryBuilder = jest.fn().mockReturnValue(queryBuilder);
    const repository = { createQueryBuilder };
    const service = new UserService(
      repository as unknown as ConstructorParameters<typeof UserService>[0],
    );
    return { service };
  };

  it('refuses a search with no usable criterion instead of returning everyone', async () => {
    const { service } = buildService();

    await expect(service.searchUsers({})).rejects.toThrow(BadRequestException);
  });

  it('refuses a NaN dni rather than silently dropping the filter', async () => {
    const { service } = buildService();

    await expect(
      service.searchUsers({ dni: Number('40.123.456') }),
    ).rejects.toThrow(BadRequestException);
  });
});

describe('adminUpdateUser', () => {
  const buildService = () => {
    const user: Partial<Users> = {
      id: 1,
      name: 'Test',
      surname: 'User',
      email: 'test@example.com',
      phone: '341 555-1234',
      role: 'member',
      dni: null,
      password: 'hashed',
      googleId: null,
      picture: null,
      deleted: false,
    };
    const findOne = jest.fn().mockResolvedValue(user);
    const save = jest.fn((row: Users) =>
      Promise.resolve({ ...row, password: 'hashed' }),
    );
    const repository = { findOne, save };
    const service = new UserService(
      repository as unknown as ConstructorParameters<typeof UserService>[0],
    );
    return { service, findOne, save, user };
  };

  it('clears a phone when the admin sends an empty string', async () => {
    const { service } = buildService();

    const saved = await service.adminUpdateUser(1, { phone: '' });

    expect(saved.phone).toBeNull();
  });

  it('leaves the phone alone when the field is absent', async () => {
    const { service } = buildService();

    const saved = await service.adminUpdateUser(1, { name: 'Nuevo' });

    expect(saved.phone).toBe('341 555-1234');
  });
});

describe('adminCreateUser', () => {
  const buildService = () => {
    const create = jest.fn((row: Partial<Users>) => row as Users);
    const save = jest.fn((row: Users) => Promise.resolve({ ...row, id: 7 }));
    // findOne answers the duplicate checks (null = no duplicate) and then the
    // closing findUser(saved.id).
    const findOne = jest
      .fn()
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(null)
      .mockResolvedValue({ id: 7, dni: 40123456 });
    const repository = { create, save, findOne };
    const service = new UserService(
      repository as unknown as ConstructorParameters<typeof UserService>[0],
    );
    return { service, create };
  };

  const walkIn = { dni: 40123456, name: 'Rosa', surname: 'Gomez' };

  it('generates a password when none was typed and marks it temporary', async () => {
    const { service, create } = buildService();

    const result = await service.adminCreateUser(walkIn);

    const [row] = create.mock.calls[0] as [Record<string, unknown>];
    expect(row.mustChangePassword).toBe(true);
    expect(row.password).toEqual(expect.any(String));
    expect(result.generatedPassword).toMatch(/^[a-z]{4}\d{4}$/);
  });

  it('never stores the generated password in the clear', async () => {
    const { service, create } = buildService();

    const result = await service.adminCreateUser(walkIn);

    const [row] = create.mock.calls[0] as [Record<string, unknown>];
    expect(row.password).not.toBe(result.generatedPassword);
  });

  it('leaves a typed password alone and does not mark it temporary', async () => {
    const { service, create } = buildService();

    const result = await service.adminCreateUser({
      ...walkIn,
      email: 'rosa@gmail.com',
      password: 'rosa1234',
    });

    const [row] = create.mock.calls[0] as [Record<string, unknown>];
    expect(row.mustChangePassword).toBe(false);
    expect(result).not.toHaveProperty('generatedPassword');
  });
});

describe('updateProfile and the temporary-password flag', () => {
  const buildService = (stored: Partial<Users>) => {
    const save = jest.fn((row: Users) => Promise.resolve(row));
    const findOne = jest.fn().mockResolvedValue(stored);
    const repository = { save, findOne, create: jest.fn() };
    const service = new UserService(
      repository as unknown as ConstructorParameters<typeof UserService>[0],
    );
    return { service, save };
  };

  it('clears the flag when the member sets their own password', async () => {
    const hashed = await bcrypt.hash('krtm4829', 10);
    const { service, save } = buildService({
      id: 7,
      email: '40123456@presencial.flg',
      password: hashed,
      mustChangePassword: true,
    });

    await service.updateProfile(7, {
      currentPassword: 'krtm4829',
      newPassword: 'rosa1234',
    });

    const [row] = save.mock.calls[0] as [Users];
    expect(row.mustChangePassword).toBe(false);
  });

  it('leaves the flag alone when no password is being changed', async () => {
    const { service, save } = buildService({
      id: 7,
      email: '40123456@presencial.flg',
      password: 'irrelevant-hash',
      mustChangePassword: true,
    });

    await service.updateProfile(7, { phone: '341555' });

    const [row] = save.mock.calls[0] as [Users];
    expect(row.mustChangePassword).toBe(true);
  });
});
