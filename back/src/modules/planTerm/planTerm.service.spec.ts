import { ConflictException, NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { PlanTermService } from './planTerm.service';
import { PlanTerm } from './entity/planTerm.entity';
import { PlanService } from '../plan/plan.service';

describe('PlanTermService', () => {
  let service: PlanTermService;
  let repository: {
    create: jest.Mock;
    save: jest.Mock;
    findOne: jest.Mock;
    find: jest.Mock;
    update: jest.Mock;
  };
  let plans: { findPlan: jest.Mock };

  beforeEach(async () => {
    repository = {
      create: jest.fn((entity: object) => entity),
      save: jest.fn((entity: object) => Promise.resolve({ id: 1, ...entity })),
      findOne: jest.fn().mockResolvedValue(null),
      find: jest.fn().mockResolvedValue([]),
      update: jest.fn().mockResolvedValue({ affected: 1 }),
    };
    plans = {
      findPlan: jest
        .fn()
        .mockResolvedValue({ id: 1, price: 1000, deleted: false }),
    };

    const moduleRef = await Test.createTestingModule({
      providers: [
        PlanTermService,
        { provide: getRepositoryToken(PlanTerm), useValue: repository },
        { provide: PlanService, useValue: plans },
      ],
    }).compile();

    service = moduleRef.get(PlanTermService);
  });

  describe('createTerm', () => {
    it('refuses a term above 12 months', async () => {
      await expect(
        service.createTerm({ planId: 1, months: 13, price: 10000 }),
      ).rejects.toThrow(
        new ConflictException('El plazo máximo es de 12 meses.'),
      );
      expect(repository.save).not.toHaveBeenCalled();
    });

    it('accepts a term at exactly 12 months', async () => {
      await service.createTerm({ planId: 1, months: 12, price: 10000 });
      expect(repository.save).toHaveBeenCalled();
    });

    it('refuses a term for a plan that does not exist', async () => {
      plans.findPlan.mockResolvedValue(null);

      await expect(
        service.createTerm({ planId: 404, months: 1, price: 1000 }),
      ).rejects.toThrow(NotFoundException);
      expect(repository.save).not.toHaveBeenCalled();
    });
  });

  describe('findForPlan', () => {
    it('queries only non-deleted terms for the plan, ordered by months ascending', async () => {
      await service.findForPlan(1);

      expect(repository.find).toHaveBeenCalledWith({
        where: { planId: 1, deleted: false },
        order: { months: 'ASC' },
      });
    });
  });

  describe('findTerm', () => {
    it('looks up a term by id', async () => {
      repository.findOne.mockResolvedValue({ id: 5, planId: 1, months: 3 });

      const result = await service.findTerm(5);

      expect(repository.findOne).toHaveBeenCalledWith({ where: { id: 5 } });
      expect(result).toEqual({ id: 5, planId: 1, months: 3 });
    });
  });

  describe('updateTerm', () => {
    it('requires an id', async () => {
      await expect(
        service.updateTerm({ planId: 1, months: 3, price: 2700 }),
      ).rejects.toThrow(ConflictException);
    });

    it('rejects an id that does not exist', async () => {
      repository.findOne.mockResolvedValue(null);

      await expect(
        service.updateTerm({ id: 404, planId: 1, months: 3, price: 2700 }),
      ).rejects.toThrow(NotFoundException);
    });

    it('refuses raising a term above 12 months', async () => {
      repository.findOne.mockResolvedValue({
        id: 5,
        planId: 1,
        months: 3,
        price: 2700,
        deleted: false,
      });

      await expect(
        service.updateTerm({ id: 5, planId: 1, months: 13, price: 5000 }),
      ).rejects.toThrow(
        new ConflictException('El plazo máximo es de 12 meses.'),
      );
      expect(repository.save).not.toHaveBeenCalled();
    });
  });

  describe('deleteTerm', () => {
    it('soft-deletes an existing term', async () => {
      repository.findOne.mockResolvedValue({ id: 5, deleted: false });

      await service.deleteTerm(5);

      expect(repository.update).toHaveBeenCalledWith(
        { id: 5 },
        { deleted: true },
      );
    });

    it('rejects an already-deleted term', async () => {
      repository.findOne.mockResolvedValue({ id: 5, deleted: true });

      await expect(service.deleteTerm(5)).rejects.toThrow(ConflictException);
    });

    it('rejects an id that does not exist', async () => {
      repository.findOne.mockResolvedValue(null);

      await expect(service.deleteTerm(404)).rejects.toThrow(NotFoundException);
    });
  });

  describe('restoreTerm', () => {
    it('restores a deleted term', async () => {
      repository.findOne.mockResolvedValue({ id: 5, deleted: true });

      await service.restoreTerm(5);

      expect(repository.update).toHaveBeenCalledWith(
        { id: 5 },
        { deleted: false },
      );
    });

    it('rejects a term that is not deleted', async () => {
      repository.findOne.mockResolvedValue({ id: 5, deleted: false });

      await expect(service.restoreTerm(5)).rejects.toThrow(ConflictException);
    });
  });
});
