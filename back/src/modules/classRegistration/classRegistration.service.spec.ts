import { ClassRegistrationService } from './classRegistration.service';
import { ClassRegistrationState } from './enum/classRegistration-state.enum';

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
