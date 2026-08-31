import { ConflictException, NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { PlanDurationService } from './plan-duration.service';
import { PlanDuration } from './entity/plan-duration.entity';
import { PlanService } from './plan.service';

describe('PlanDurationService', () => {
  let service: PlanDurationService;
  let repository: {
    create: jest.Mock;
    save: jest.Mock;
    find: jest.Mock;
    findOne: jest.Mock;
  };
  let planService: { findPlan: jest.Mock };

  beforeEach(async () => {
    repository = {
      create: jest.fn((entity: object) => entity),
      save: jest.fn((entity: object) => Promise.resolve({ id: 1, ...entity })),
      find: jest.fn().mockResolvedValue([]),
      findOne: jest.fn().mockResolvedValue(null),
    };
    planService = {
      findPlan: jest.fn().mockResolvedValue({ id: 2, deleted: false }),
    };

    const moduleRef = await Test.createTestingModule({
      providers: [
        PlanDurationService,
        { provide: getRepositoryToken(PlanDuration), useValue: repository },
        { provide: PlanService, useValue: planService },
      ],
    }).compile();

    service = moduleRef.get(PlanDurationService);
  });

  it('refuses a duration on a plan that does not exist', async () => {
    planService.findPlan.mockResolvedValue(null);
    await expect(
      service.create(99, { months: 6, numDays: 180, price: 300 }),
    ).rejects.toThrow(NotFoundException);
  });

  it('refuses a second row for the same plan and month count', async () => {
    repository.findOne.mockResolvedValue({ id: 1, planId: 2, months: 6 });
    await expect(
      service.create(2, { months: 6, numDays: 180, price: 300 }),
    ).rejects.toThrow(ConflictException);
  });

  it('reuses a soft-deleted row rather than colliding with its unique index', async () => {
    repository.findOne.mockResolvedValue({
      id: 5,
      planId: 2,
      months: 6,
      numDays: 90,
      price: 100,
      deleted: true,
    });
    const created = await service.create(2, {
      months: 6,
      numDays: 180,
      price: 300,
    });
    expect(created).toMatchObject({
      id: 5,
      deleted: false,
      numDays: 180,
      price: 300,
    });
  });

  it('lists only non-deleted rows, ordered by months', async () => {
    await service.findByPlan(2);
    expect(repository.find).toHaveBeenCalledWith({
      where: { planId: 2, deleted: false },
      order: { months: 'ASC' },
    });
  });

  it('refuses to update a duration that belongs to another plan', async () => {
    repository.findOne.mockResolvedValue({ id: 5, planId: 3 });
    await expect(
      service.update(2, 5, { months: 6, numDays: 180, price: 300 }),
    ).rejects.toThrow(NotFoundException);
  });
});
