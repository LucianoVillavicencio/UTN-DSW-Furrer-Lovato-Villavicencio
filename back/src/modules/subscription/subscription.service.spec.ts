import { ConflictException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { subscriptionService } from './subscription.service';
import { Subscription } from './entity/subscription.entity';
import { SubscriptionState } from './enum/subscription-state.enum';
import { PlanService } from '../plan/plan.service';
import { UserService } from '../user/user.service';

// Local date parts, matching the 'YYYY-MM-DD' the service writes. Spelled out
// here rather than imported so the assertions do not check the helper against
// itself.
function localDate(date: Date): string {
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, '0'),
    String(date.getDate()).padStart(2, '0'),
  ].join('-');
}

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
      repository.findOne
        .mockResolvedValueOnce(currentActive) // the current ACTIVE row
        .mockResolvedValueOnce(null); // no PENDING row on the target plan

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
      repository.findOne
        .mockResolvedValueOnce(currentActive) // the current ACTIVE row
        .mockResolvedValueOnce(null); // no PENDING row on the target plan

      await service.changePlan(30111222, 9, true);

      expect(currentActive.state).toBe(SubscriptionState.CANCELLED);
    });

    it('refuses a second change to a plan already pending payment', async () => {
      const pendingSamePlan = {
        id: 4,
        userDni: 30111222,
        planId: 9,
        state: SubscriptionState.PENDING,
      };
      repository.findOne
        .mockResolvedValueOnce(null) // no ACTIVE row
        .mockResolvedValueOnce(pendingSamePlan); // one already pending

      await expect(service.changePlan(30111222, 9, false)).rejects.toThrow(
        ConflictException,
      );
      expect(repository.create).not.toHaveBeenCalled();
      expect(repository.save).not.toHaveBeenCalled();
    });

    it('does not cancel the current plan when the change is refused', async () => {
      const currentActive = {
        id: 1,
        userDni: 30111222,
        planId: 5,
        state: SubscriptionState.ACTIVE,
      };
      repository.findOne
        .mockResolvedValueOnce(currentActive)
        .mockResolvedValueOnce({
          id: 4,
          userDni: 30111222,
          planId: 9,
          state: SubscriptionState.PENDING,
        });

      await expect(service.changePlan(30111222, 9, true)).rejects.toThrow(
        ConflictException,
      );
      expect(currentActive.state).toBe(SubscriptionState.ACTIVE);
      expect(repository.save).not.toHaveBeenCalled();
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

    it("recomputes the period from today, not the row's stale dates", async () => {
      const stale = {
        id: 7,
        userDni: 30111222,
        planId: 1,
        state: SubscriptionState.PENDING,
        startDate: '2025-01-10',
        endDate: '2025-02-09',
        deleted: false,
      };
      repository.findOne
        .mockResolvedValueOnce(stale) // findSubscription(id) inside activate
        .mockResolvedValueOnce(null); // no previously active row

      await service.activate(7);

      const today = new Date();
      const in30Days = new Date(today);
      in30Days.setDate(in30Days.getDate() + 30);

      expect(stale.startDate).toBe(localDate(today));
      expect(stale.endDate).toBe(localDate(in30Days));
      expect(repository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 7,
          state: SubscriptionState.ACTIVE,
          startDate: localDate(today),
          endDate: localDate(in30Days),
        }),
      );
    });
  });
});
