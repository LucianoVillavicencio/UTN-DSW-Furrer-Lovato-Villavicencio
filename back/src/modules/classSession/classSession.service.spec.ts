import { NotFoundException } from '@nestjs/common';
import { ClassSessionService } from './classSession.service';

// Regression coverage for the fix that made adjustAvailableSpots a single
// atomic UPDATE instead of a read-then-write: two concurrent decrements used
// to both read the same stale availableSpots and both "win", overbooking a
// class session. These tests assert the query shape that closes that race —
// a WHERE guard on the decrement, re-checked in the same statement as the
// write — rather than re-deriving the race itself, which needs two
// interleaved calls a mocked query builder cannot express.
describe('ClassSessionService.adjustAvailableSpots', () => {
  let classSessionRepository: { manager: { getRepository: jest.Mock } };
  let repo: { createQueryBuilder: jest.Mock; findOne: jest.Mock };
  let queryBuilder: {
    update: jest.Mock;
    set: jest.Mock;
    where: jest.Mock;
    andWhere: jest.Mock;
    setParameter: jest.Mock;
    execute: jest.Mock;
  };
  let service: ClassSessionService;

  beforeEach(() => {
    queryBuilder = {
      update: jest.fn().mockReturnThis(),
      set: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      setParameter: jest.fn().mockReturnThis(),
      execute: jest.fn().mockResolvedValue({ affected: 1 }),
    };
    repo = {
      createQueryBuilder: jest.fn().mockReturnValue(queryBuilder),
      findOne: jest.fn().mockResolvedValue({ id: 501, availableSpots: 4 }),
    };
    classSessionRepository = {
      manager: { getRepository: jest.fn().mockReturnValue(repo) },
    };
    service = new ClassSessionService(
      classSessionRepository as never,
      {} as never,
    );
  });

  it('guards a decrement with a WHERE clause that re-checks capacity in the same statement as the write', async () => {
    await service.adjustAvailableSpots(501, -1);

    const [setArg] = queryBuilder.set.mock.calls[0] as [
      { availableSpots: unknown },
    ];
    expect(typeof setArg.availableSpots).toBe('function');
    expect(queryBuilder.andWhere).toHaveBeenCalledWith(
      expect.stringContaining('>= 0'),
      { delta: -1 },
    );
  });

  it('returns null instead of throwing when the decrement loses the capacity race', async () => {
    queryBuilder.execute.mockResolvedValue({ affected: 0 });
    repo.findOne.mockResolvedValue({ id: 501, availableSpots: 0 });

    const result = await service.adjustAvailableSpots(501, -1);

    expect(result).toBeNull();
  });

  it('throws NotFoundException when the session does not exist', async () => {
    queryBuilder.execute.mockResolvedValue({ affected: 0 });
    repo.findOne.mockResolvedValue(null);

    await expect(service.adjustAvailableSpots(999, -1)).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('clamps an increment to maxCapacity in SQL rather than guarding it with WHERE', async () => {
    await service.adjustAvailableSpots(501, 1);

    const [setArg] = queryBuilder.set.mock.calls[0] as [
      { availableSpots: unknown },
    ];
    expect(typeof setArg.availableSpots).toBe('function');
    expect(queryBuilder.andWhere).not.toHaveBeenCalled();
  });

  it('runs against a caller-supplied manager instead of its own, so it can join an outer transaction', async () => {
    const otherRepo = {
      createQueryBuilder: jest.fn().mockReturnValue(queryBuilder),
      findOne: jest.fn().mockResolvedValue({ id: 501, availableSpots: 3 }),
    };
    const otherManager = {
      getRepository: jest.fn().mockReturnValue(otherRepo),
    };

    await service.adjustAvailableSpots(501, -1, otherManager as never);

    expect(otherManager.getRepository).toHaveBeenCalled();
    expect(classSessionRepository.manager.getRepository).not.toHaveBeenCalled();
  });
});

// Regression coverage for the fix that made updateClassSession re-derive
// availableSpots from actual occupancy instead of carrying the old value
// over unchanged: a maxCapacity edit used to leave availableSpots either
// stuck too low (after growing capacity) or, worse, too high (after
// shrinking it below how many members already hold the slot) — the latter
// let the class silently accept more members than the new capacity allowed.
describe('ClassSessionService.updateClassSession', () => {
  let repository: { findOne: jest.Mock; save: jest.Mock };
  let service: ClassSessionService;

  const existingSlot = {
    id: 501,
    classId: 7,
    weekday: 1,
    startTime: '08:00:00',
    maxCapacity: 20,
    availableSpots: 15, // 5 members already hold this slot
  };

  beforeEach(() => {
    repository = {
      findOne: jest
        .fn()
        // findClassSession, then findSlot's duplicate check (no duplicate).
        .mockResolvedValueOnce(existingSlot)
        .mockResolvedValueOnce(null),
      save: jest.fn((entity: object) => Promise.resolve(entity)),
    };
    service = new ClassSessionService(repository as never, {} as never);
  });

  it('floors availableSpots at 0 when maxCapacity shrinks below current occupancy', async () => {
    await service.updateClassSession({
      id: 501,
      classId: 7,
      weekday: 1,
      startTime: '08:00',
      maxCapacity: 5,
    });

    expect(repository.save).toHaveBeenCalledWith(
      expect.objectContaining({ availableSpots: 0 }),
    );
  });

  it('frees up the extra room when maxCapacity grows', async () => {
    await service.updateClassSession({
      id: 501,
      classId: 7,
      weekday: 1,
      startTime: '08:00',
      maxCapacity: 25,
    });

    // Still 5 occupied, now out of 25: 20 free, not the stale 15.
    expect(repository.save).toHaveBeenCalledWith(
      expect.objectContaining({ availableSpots: 20 }),
    );
  });

  it('clamps an explicit availableSpots to the new maxCapacity', async () => {
    await service.updateClassSession({
      id: 501,
      classId: 7,
      weekday: 1,
      startTime: '08:00',
      maxCapacity: 5,
      availableSpots: 999,
    });

    expect(repository.save).toHaveBeenCalledWith(
      expect.objectContaining({ availableSpots: 5 }),
    );
  });
});
