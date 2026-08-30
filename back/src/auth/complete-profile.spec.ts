import { BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';
import { UserService } from '../modules/user/user.service';
import { Users } from '../modules/user/entity/users.entity';

// The write-once rule and the collision rule both live in UserService, so they
// are tested against it directly rather than through the controller.
describe('UserService.completeProfile', () => {
  const incomplete = {
    id: 7,
    dni: null,
    phone: null,
    email: 'nueva@gmail.com',
    name: 'Ana',
    surname: 'Pérez',
  } as unknown as Users;

  const buildService = (overrides: {
    user?: Users | null;
    dniOwner?: Users | null;
  }) => {
    // completeProfile mutates the object findOne returns (user.dni = ...)
    // before saving it, so a shared fixture reused across tests would leak
    // one test's mutation into the next. Each test gets its own copy.
    const defaultUser = { ...incomplete };
    const findOne = jest
      .fn()
      // completeProfile looks the caller up first, then the dni owner.
      // 'user' in overrides distinguishes "not provided" (default to a fresh
      // incomplete user) from an explicit null (the caller does not exist) —
      // `??` would treat both the same and hide the second case entirely.
      .mockResolvedValueOnce('user' in overrides ? overrides.user : defaultUser)
      .mockResolvedValueOnce(overrides.dniOwner ?? null);
    const save = jest.fn((row: Users) => Promise.resolve(row));
    const repository = { findOne, save };
    return {
      service: new UserService(
        repository as unknown as ConstructorParameters<typeof UserService>[0],
      ),
      save,
    };
  };

  it('saves dni and phone on an incomplete account', async () => {
    const { service, save } = buildService({});

    const result = await service.completeProfile(7, {
      dni: 40123456,
      phone: '3411234567',
    });

    expect(save).toHaveBeenCalled();
    expect(result.dni).toBe(40123456);
    expect(result.phone).toBe('3411234567');
  });

  it('requires a dni when the account has none', async () => {
    const { service } = buildService({});

    await expect(
      service.completeProfile(7, { phone: '3411234567' }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('ignores a dni sent by an account that already has one', async () => {
    // A walk-in member created without a phone reaches the same screen. The
    // dni field is sent read-only; refusing the whole request would strand
    // them, so the value is dropped instead.
    const { service, save } = buildService({
      user: { ...incomplete, dni: 40123456 } as Users,
    });

    const result = await service.completeProfile(7, {
      dni: 99999999,
      phone: '3411234567',
    });

    expect(result.dni).toBe(40123456);
    expect(save).toHaveBeenCalled();
  });

  it('refuses a dni another account already holds', async () => {
    const { service } = buildService({
      dniOwner: { id: 12, dni: 40123456 } as Users,
    });

    await expect(
      service.completeProfile(7, { dni: 40123456, phone: '3411234567' }),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('refuses an unknown caller', async () => {
    const { service } = buildService({ user: null });

    await expect(
      service.completeProfile(7, { dni: 40123456, phone: '3411234567' }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });
});
