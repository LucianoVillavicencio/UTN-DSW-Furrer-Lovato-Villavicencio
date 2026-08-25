import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { subscriptionService } from './subscription.service';
import { Subscription } from './entity/subscription.entity';
import { SubscriptionState } from './enum/subscription-state.enum';
import { PlanService } from '../plan/plan.service';
import { UserService } from '../user/user.service';

describe('subscriptionService', () => {
  let service: subscriptionService;
  let repository: { create: jest.Mock; save: jest.Mock; findOne: jest.Mock };

  beforeEach(async () => {
    repository = {
      create: jest.fn((entity: object) => entity),
      save: jest.fn((entity: object) => Promise.resolve({ id: 1, ...entity })),
      findOne: jest.fn().mockResolvedValue(null),
    };

    const moduleRef = await Test.createTestingModule({
      providers: [
        subscriptionService,
        { provide: getRepositoryToken(Subscription), useValue: repository },
        {
          provide: PlanService,
          useValue: {
            findPlan: jest
              .fn()
              .mockResolvedValue({ id: 1, numDays: 30, deleted: false }),
          },
        },
        { provide: UserService, useValue: {} },
      ],
    }).compile();

    service = moduleRef.get(subscriptionService);
  });

  describe('changePlan', () => {
    it('opens a self-service plan change as PENDING, not ACTIVE', async () => {
      await service.changePlan(30111222, 1, false);
      expect(repository.create).toHaveBeenCalledWith(
        expect.objectContaining({ state: SubscriptionState.PENDING }),
      );
    });

    it('still opens an admin-assigned plan as ACTIVE', async () => {
      await service.changePlan(30111222, 1, true);
      expect(repository.create).toHaveBeenCalledWith(
        expect.objectContaining({ state: SubscriptionState.ACTIVE }),
      );
    });

    it('does not cancel the current plan when a self-service change is requested', async () => {
      const currentActive = {
        id: 1,
        userDni: 30111222,
        planId: 5,
        state: SubscriptionState.ACTIVE,
      };
      repository.findOne.mockResolvedValue(currentActive);

      await service.changePlan(30111222, 9, false);

      expect(currentActive.state).toBe(SubscriptionState.ACTIVE);
      expect(repository.save).not.toHaveBeenCalledWith(
        expect.objectContaining({ id: 1, state: SubscriptionState.CANCELLED }),
      );
    });

    it('still cancels the current plan immediately for an admin-assigned change', async () => {
      const currentActive = {
        id: 1,
        userDni: 30111222,
        planId: 5,
        state: SubscriptionState.ACTIVE,
      };
      repository.findOne.mockResolvedValue(currentActive);

      await service.changePlan(30111222, 9, true);

      expect(currentActive.state).toBe(SubscriptionState.CANCELLED);
    });
  });

  describe('activate', () => {
    it('promotes a PENDING subscription to ACTIVE', async () => {
      repository.findOne.mockResolvedValue({
        id: 7,
        state: SubscriptionState.PENDING,
        deleted: false,
      });

      await service.activate(7);

      expect(repository.save).toHaveBeenCalledWith(
        expect.objectContaining({ id: 7, state: SubscriptionState.ACTIVE }),
      );
    });

    it('rejects an id that does not exist', async () => {
      await expect(service.activate(404)).rejects.toThrow(
        'La suscripción con ID: 404 no existe.',
      );
      expect(repository.save).not.toHaveBeenCalled();
    });

    it('cancels the previously active subscription when activating a new one', async () => {
      const target = {
        id: 2,
        userDni: 30111222,
        state: SubscriptionState.PENDING,
      };
      const previousActive = {
        id: 1,
        userDni: 30111222,
        state: SubscriptionState.ACTIVE,
      };
      repository.findOne
        .mockResolvedValueOnce(target) // findSubscription(id) inside activate
        .mockResolvedValueOnce(previousActive); // the lookup for the old ACTIVE row

      await service.activate(2);

      expect(previousActive.state).toBe(SubscriptionState.CANCELLED);
      expect(target.state).toBe(SubscriptionState.ACTIVE);
    });
  });
});
