import { ConflictException } from '@nestjs/common';
import { ClassRegistrationService } from './classRegistration.service';
import { ClassRegistrationState } from './enum/classRegistration-state.enum';

describe('ClassRegistrationService.enroll', () => {
  let repository: {
    find: jest.Mock;
    save: jest.Mock;
    createQueryBuilder: jest.Mock;
    manager: { transaction: jest.Mock };
  };
  let classSessionService: {
    findSlotsOfClassAtTime: jest.Mock;
    adjustAvailableSpots: jest.Mock;
  };
  let subscriptions: { findActiveForUser: jest.Mock };
  let manager: { getRepository: jest.Mock };
  let registrationRepo: { create: jest.Mock; save: jest.Mock };
  let service: ClassRegistrationService;

  const slot = {
    id: 501,
    classId: 7,
    startTime: '08:00:00',
    weekday: 1,
    availableSpots: 1,
    maxCapacity: 10,
  };

  beforeEach(() => {
    registrationRepo = {
      create: jest.fn((data: object) => data),
      save: jest.fn((entity: object) => Promise.resolve(entity)),
    };
    manager = {
      getRepository: jest.fn().mockReturnValue(registrationRepo),
    };
    const queryBuilder = {
      select: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      getCount: jest.fn().mockResolvedValue(0),
      getRawMany: jest.fn().mockResolvedValue([]),
    };
    repository = {
      find: jest.fn().mockResolvedValue([]),
      save: jest.fn((entity: object) => Promise.resolve(entity)),
      createQueryBuilder: jest.fn().mockReturnValue(queryBuilder),
      manager: {
        transaction: jest.fn((cb: (manager: unknown) => unknown) =>
          cb(manager),
        ),
      },
    };
    classSessionService = {
      findSlotsOfClassAtTime: jest.fn().mockResolvedValue([slot]),
      adjustAvailableSpots: jest.fn().mockResolvedValue(0),
    };
    subscriptions = {
      findActiveForUser: jest
        .fn()
        .mockResolvedValue({ plan: { maxClasses: 1 } }),
    };
    service = new ClassRegistrationService(
      repository as never,
      classSessionService as never,
      subscriptions as never,
    );
  });

  // The failure this closes: two members enrolling in the last spot of a
  // slot at nearly the same time both used to pass a stale `availableSpots`
  // check and both get confirmed, overbooking the class. The `slots`
  // snapshot here still shows a spot, so only the atomic reservation itself
  // — not the cheap pre-check — stands between this enrollment and that race.
  it('rolls back and refuses the enrollment when the atomic reservation loses the capacity race', async () => {
    classSessionService.adjustAvailableSpots.mockResolvedValueOnce(null);

    await expect(
      service.enroll(1, { classId: 7, startTime: '08:00' }),
    ).rejects.toBeInstanceOf(ConflictException);

    expect(registrationRepo.save).not.toHaveBeenCalled();
  });

  it('reserves the spot and creates the registration inside the same transaction', async () => {
    await service.enroll(1, { classId: 7, startTime: '08:00' });

    expect(repository.manager.transaction).toHaveBeenCalled();
    expect(classSessionService.adjustAvailableSpots).toHaveBeenCalledWith(
      slot.id,
      -1,
      manager,
    );
    expect(registrationRepo.save).toHaveBeenCalledWith(
      expect.objectContaining({ userId: 1, classSessionId: slot.id }),
    );
  });
});

describe('ClassRegistrationService.cancelFutureForUser', () => {
  let repository: {
    find: jest.Mock;
    save: jest.Mock;
  };
  let classSessionService: { adjustAvailableSpots: jest.Mock };
  let subscriptions: Record<string, jest.Mock>;
  let service: ClassRegistrationService;

  beforeEach(() => {
    repository = {
      find: jest.fn().mockResolvedValue([]),
      save: jest.fn((entity: object) => Promise.resolve(entity)),
    };
    classSessionService = {
      adjustAvailableSpots: jest.fn().mockResolvedValue(undefined),
    };
    subscriptions = {};
    service = new ClassRegistrationService(
      repository as never,
      classSessionService as never,
      subscriptions as never,
    );
  });

  it('queries only CONFIRMED, non-deleted rows for the user, across every group', async () => {
    await service.cancelFutureForUser(42);

    // Exact object, not objectContaining: proves the query is scoped to
    // exactly these three fields — no enrollmentGroup (unlike
    // cancelEnrollment) and no `date` filter. See cancelFutureForUser's own
    // doc comment for why a date filter would be wrong in this weekly-slots
    // data model (`date` records when a booking was made, not a future
    // class date).
    expect(repository.find).toHaveBeenCalledWith({
      where: {
        userId: 42,
        state: ClassRegistrationState.CONFIRMED,
        deleted: false,
      },
    });
  });

  it('cancels each matching row: sets CANCELLED, deleted, cancelledAt, and frees the spot', async () => {
    const rowA = {
      id: 1,
      userId: 42,
      classSessionId: 501,
      enrollmentGroup: 'group-a',
      date: new Date('2026-06-01'),
      state: ClassRegistrationState.CONFIRMED,
      deleted: false,
    };
    const rowB = {
      id: 2,
      userId: 42,
      classSessionId: 502,
      enrollmentGroup: 'group-b',
      date: new Date('2026-07-10'),
      state: ClassRegistrationState.CONFIRMED,
      deleted: false,
    };
    repository.find.mockResolvedValue([rowA, rowB]);

    await service.cancelFutureForUser(42);

    expect(rowA.state).toBe(ClassRegistrationState.CANCELLED);
    expect((rowA as { deleted: boolean }).deleted).toBe(true);
    expect((rowA as { cancelledAt?: Date }).cancelledAt).toBeInstanceOf(Date);
    expect(rowB.state).toBe(ClassRegistrationState.CANCELLED);

    expect(classSessionService.adjustAvailableSpots).toHaveBeenCalledWith(
      501,
      1,
    );
    expect(classSessionService.adjustAvailableSpots).toHaveBeenCalledWith(
      502,
      1,
    );
    expect(repository.save).toHaveBeenCalledTimes(2);
  });

  it('does nothing and does not throw when the member holds no CONFIRMED reservations', async () => {
    // The repository mock stands in for the `state: CONFIRMED, deleted:
    // false` filter: an already-cancelled row (attendance/change history) is
    // never returned by it, so nothing here can touch it. This is what
    // "future, not past" actually means in this schema.
    repository.find.mockResolvedValue([]);

    await expect(service.cancelFutureForUser(42)).resolves.not.toThrow();
    expect(repository.save).not.toHaveBeenCalled();
    expect(classSessionService.adjustAvailableSpots).not.toHaveBeenCalled();
  });
});
