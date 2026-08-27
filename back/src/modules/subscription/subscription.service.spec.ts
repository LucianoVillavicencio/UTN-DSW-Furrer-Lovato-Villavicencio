import { ConflictException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { In } from 'typeorm';
import { subscriptionService } from './subscription.service';
import { Subscription } from './entity/subscription.entity';
import { SubscriptionState } from './enum/subscription-state.enum';
import { PlanService } from '../plan/plan.service';
import { UserService } from '../user/user.service';
import { PlanTermService } from '../planTerm/planTerm.service';

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
  let repository: {
    create: jest.Mock;
    save: jest.Mock;
    findOne: jest.Mock;
    find: jest.Mock;
  };

  let planTerms: { findTerm: jest.Mock; findForPlan: jest.Mock };

  beforeEach(async () => {
    repository = {
      create: jest.fn((entity: object) => entity),
      save: jest.fn((entity: object) => Promise.resolve({ id: 1, ...entity })),
      findOne: jest.fn().mockResolvedValue(null),
      find: jest.fn().mockResolvedValue([]),
    };

    // Every changePlan test below omits planTermId, so the default 1-month
    // term is what resolvePlanTerm falls back to unless a test overrides
    // findForPlan/findTerm itself.
    planTerms = {
      findTerm: jest.fn().mockResolvedValue(null),
      findForPlan: jest
        .fn()
        .mockResolvedValue([{ id: 100, planId: 1, months: 1, price: 1000 }]),
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
        { provide: PlanTermService, useValue: planTerms },
      ],
    }).compile();

    service = moduleRef.get(subscriptionService);
  });

  describe('changePlan', () => {
    it('opens a self-service plan change as PENDING, not ACTIVE', async () => {
      await service.changePlan(30111222, 1, undefined, false);
      expect(repository.create).toHaveBeenCalledWith(
        expect.objectContaining({ state: SubscriptionState.PENDING }),
      );
    });

    it('still opens an admin-assigned plan as ACTIVE', async () => {
      await service.changePlan(30111222, 1, undefined, true);
      expect(repository.create).toHaveBeenCalledWith(
        expect.objectContaining({ state: SubscriptionState.ACTIVE }),
      );
    });

    it('does not cancel the current plan when a self-service change is requested', async () => {
      const currentActive = {
        id: 1,
        userId: 30111222,
        planId: 5,
        state: SubscriptionState.ACTIVE,
      };
      repository.findOne
        .mockResolvedValueOnce(currentActive) // the current ACTIVE row
        .mockResolvedValueOnce(null); // no PENDING row on the target plan

      await service.changePlan(30111222, 9, undefined, false);

      expect(currentActive.state).toBe(SubscriptionState.ACTIVE);
      expect(repository.save).not.toHaveBeenCalledWith(
        expect.objectContaining({ id: 1, state: SubscriptionState.CANCELLED }),
      );
    });

    it('still cancels the current plan immediately for an admin-assigned change', async () => {
      const currentActive = {
        id: 1,
        userId: 30111222,
        planId: 5,
        state: SubscriptionState.ACTIVE,
      };
      repository.findOne
        .mockResolvedValueOnce(currentActive) // the current ACTIVE row
        .mockResolvedValueOnce(null); // no PENDING row on the target plan

      await service.changePlan(30111222, 9, undefined, true);

      expect(currentActive.state).toBe(SubscriptionState.CANCELLED);
    });

    it('refuses a second change to a plan already pending payment', async () => {
      const pendingSamePlan = {
        id: 4,
        userId: 30111222,
        planId: 9,
        state: SubscriptionState.PENDING,
      };
      repository.findOne
        .mockResolvedValueOnce(null) // no ACTIVE row
        .mockResolvedValueOnce(pendingSamePlan); // one already pending

      await expect(
        service.changePlan(30111222, 9, undefined, false),
      ).rejects.toThrow(ConflictException);
      expect(repository.create).not.toHaveBeenCalled();
      expect(repository.save).not.toHaveBeenCalled();
    });

    it('does not cancel the current plan when the change is refused', async () => {
      const currentActive = {
        id: 1,
        userId: 30111222,
        planId: 5,
        state: SubscriptionState.ACTIVE,
      };
      repository.findOne
        .mockResolvedValueOnce(currentActive)
        .mockResolvedValueOnce({
          id: 4,
          userId: 30111222,
          planId: 9,
          state: SubscriptionState.PENDING,
        });

      await expect(
        service.changePlan(30111222, 9, undefined, true),
      ).rejects.toThrow(ConflictException);
      expect(currentActive.state).toBe(SubscriptionState.ACTIVE);
      expect(repository.save).not.toHaveBeenCalled();
    });

    it("defaults to the plan's 1-month term when no planTermId is given", async () => {
      const before = new Date();
      await service.changePlan(30111222, 1, undefined, false);

      const expectedEnd = new Date(before);
      // plan.numDays is 30 (see the PlanService mock above); a 1-month term
      // must add exactly one plan period (30 days), not a multiple of it.
      expectedEnd.setDate(expectedEnd.getDate() + 1 * 30);

      expect(planTerms.findForPlan).toHaveBeenCalledWith(1);
      expect(planTerms.findTerm).not.toHaveBeenCalled();
      expect(repository.create).toHaveBeenCalledWith(
        expect.objectContaining({ endDate: localDate(expectedEnd) }),
      );
    });

    it('throws a clear NotFoundException when the plan has no 1-month term', async () => {
      planTerms.findForPlan.mockResolvedValue([]);

      await expect(
        service.changePlan(30111222, 1, undefined, false),
      ).rejects.toThrow(
        'El plan con ID: 1 no tiene un plazo de 1 mes configurado.',
      );
      expect(repository.save).not.toHaveBeenCalled();
    });

    it('looks up the chosen term by id and rejects one that belongs to a different plan', async () => {
      planTerms.findTerm.mockResolvedValue({
        id: 55,
        planId: 2, // does not match the plan being changed to (1)
        months: 3,
        price: 2700,
      });

      await expect(service.changePlan(30111222, 1, 55, false)).rejects.toThrow(
        'El plazo con ID: 55 no existe para este plan.',
      );
      expect(repository.save).not.toHaveBeenCalled();
    });

    it('rejects a soft-deleted term even when it belongs to the right plan', async () => {
      // A discontinued promo term must be just as unpurchasable through an
      // explicit id as it already is through the default-term fallback
      // (which filters on `deleted` via findForPlan) — otherwise anyone
      // still holding the old id could buy it at its old price/duration.
      planTerms.findTerm.mockResolvedValue({
        id: 55,
        planId: 1,
        months: 3,
        price: 2700,
        deleted: true,
      });

      await expect(service.changePlan(30111222, 1, 55, false)).rejects.toThrow(
        'El plazo con ID: 55 no existe para este plan.',
      );
      expect(repository.save).not.toHaveBeenCalled();
    });

    it("sizes the subscription's period as months × plan.numDays for a chosen multi-month term", async () => {
      planTerms.findTerm.mockResolvedValue({
        id: 55,
        planId: 1,
        months: 3,
        price: 2700,
      });

      const before = new Date();
      await service.changePlan(30111222, 1, 55, false);

      const expectedEnd = new Date(before);
      // plan.numDays is 30 (see the PlanService mock above): a 3-month term
      // must add 90 days, not 30.
      expectedEnd.setDate(expectedEnd.getDate() + 3 * 30);

      expect(planTerms.findTerm).toHaveBeenCalledWith(55);
      expect(repository.create).toHaveBeenCalledWith(
        expect.objectContaining({ endDate: localDate(expectedEnd) }),
      );
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
        userId: 30111222,
        state: SubscriptionState.PENDING,
      };
      const previousActive = {
        id: 1,
        userId: 30111222,
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
        userId: 30111222,
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

  describe('renew', () => {
    it('extends the endDate from its current value, not from today', async () => {
      repository.findOne.mockResolvedValue({
        id: 3,
        userDni: 30111222,
        endDate: '2026-09-30',
        state: SubscriptionState.ACTIVE,
      });

      await service.renew(3, 30);

      expect(repository.save).toHaveBeenCalledWith(
        expect.objectContaining({ id: 3, endDate: '2026-10-30' }),
      );
    });

    it('sets the state back to ACTIVE, lifting a subscription the nightly sweep marked INACTIVE', async () => {
      repository.findOne.mockResolvedValue({
        id: 3,
        userDni: 30111222,
        endDate: '2026-09-30',
        state: SubscriptionState.INACTIVE,
      });

      await service.renew(3, 30);

      expect(repository.save).toHaveBeenCalledWith(
        expect.objectContaining({ id: 3, state: SubscriptionState.ACTIVE }),
      );
    });

    it('rejects an id that does not exist', async () => {
      await expect(service.renew(404, 30)).rejects.toThrow(
        'La suscripción con ID: 404 no existe.',
      );
      expect(repository.save).not.toHaveBeenCalled();
    });

    it("does not cancel the member's other subscriptions", async () => {
      // Unlike activate, renew never looks up a previously-active row to
      // cancel — the only findOne call is findSubscription's own lookup of
      // the row being renewed.
      repository.findOne.mockResolvedValue({
        id: 3,
        userDni: 30111222,
        endDate: '2026-09-30',
        state: SubscriptionState.ACTIVE,
      });

      await service.renew(3, 30);

      expect(repository.findOne).toHaveBeenCalledTimes(1);
      expect(repository.save).toHaveBeenCalledTimes(1);
    });
  });

  describe('findDueForRenewal', () => {
    it('queries autoRenew, ACTIVE, non-deleted subscriptions ending on one of the given dates', async () => {
      const dueDates = ['2026-09-11', '2026-09-12', '2026-09-13'];

      await service.findDueForRenewal(dueDates);

      expect(repository.find).toHaveBeenCalledWith({
        where: {
          autoRenew: true,
          state: SubscriptionState.ACTIVE,
          deleted: false,
          endDate: In(dueDates),
        },
        relations: { plan: true, user: true },
      });
    });

    it('never selects a PAUSED subscription for charging', async () => {
      await service.findDueForRenewal(['2026-09-11']);

      const call = repository.find.mock.calls[0][0] as {
        where: { state: SubscriptionState };
      };
      expect(call.where.state).toBe(SubscriptionState.ACTIVE);
      expect(call.where.state).not.toBe(SubscriptionState.PAUSED);
    });
  });
});
