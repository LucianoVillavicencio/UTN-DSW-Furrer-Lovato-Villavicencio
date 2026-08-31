import { ConflictException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { getDataSourceToken, getRepositoryToken } from '@nestjs/typeorm';
import { subscriptionService } from './subscription.service';
import { Subscription } from './entity/subscription.entity';
import { SubscriptionState } from './enum/subscription-state.enum';
import { PlanService } from '../plan/plan.service';
import { UserService } from '../user/user.service';
import { toDateOnly } from './subscription.rules';

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

// `today`/`tomorrow`/`yesterday` in replaceActiveSubscription's tests are
// computed relative to the real clock so the suite is not tied to a
// hardcoded date. toDateOnly is imported from production rather than
// redefined here (it used to be a UTC-based local helper) so the fixtures
// agree with the local-time logic under test by construction, not by
// coincidence of timezone/time-of-day.
const addDays = (base: Date, days: number) => {
  const d = new Date(base);
  d.setDate(d.getDate() + days);
  return d;
};

// The shape manager.create is invoked with in replaceActiveSubscription,
// spelled out so `.mock.calls[0][1]` reads back as something other than
// `any`.
interface CreatedSubscriptionPayload {
  startDate: string;
  endDate: string;
  planDurationId?: number | null;
  soldPrice?: number | null;
  state?: string;
}

describe('subscriptionService', () => {
  let service: subscriptionService;
  let subscriptionRepository: {
    create: jest.Mock;
    save: jest.Mock;
    findOne: jest.Mock;
  };
  let manager: {
    find: jest.Mock;
    save: jest.Mock;
    create: jest.Mock<
      CreatedSubscriptionPayload,
      [unknown, CreatedSubscriptionPayload]
    >;
  };
  beforeEach(async () => {
    subscriptionRepository = {
      create: jest.fn((entity: object) => entity),
      save: jest.fn((entity: object) => Promise.resolve({ id: 1, ...entity })),
      findOne: jest.fn().mockResolvedValue(null),
    };
    manager = {
      find: jest.fn().mockResolvedValue([]),
      save: jest.fn((entity: object) => Promise.resolve({ id: 1, ...entity })),
      create: jest.fn(
        (_entity: unknown, data: CreatedSubscriptionPayload) => data,
      ),
    };
    const moduleRef = await Test.createTestingModule({
      providers: [
        subscriptionService,
        {
          provide: getRepositoryToken(Subscription),
          useValue: subscriptionRepository,
        },
        {
          provide: PlanService,
          useValue: {
            findPlan: jest
              .fn()
              .mockResolvedValue({ id: 1, numDays: 30, deleted: false }),
          },
        },
        { provide: UserService, useValue: {} },
        {
          provide: getDataSourceToken(),
          useValue: {
            transaction: jest.fn((cb: (manager: unknown) => unknown) =>
              cb(manager),
            ),
          },
        },
      ],
    }).compile();

    service = moduleRef.get(subscriptionService);
  });

  describe('changePlan', () => {
    it('opens a self-service plan change as PENDING, not ACTIVE', async () => {
      await service.changePlan(30111222, 1, false);
      expect(manager.create).toHaveBeenCalledWith(
        Subscription,
        expect.objectContaining({ state: SubscriptionState.PENDING }),
      );
    });

    it('still opens an admin-assigned plan as ACTIVE', async () => {
      await service.changePlan(30111222, 1, true);
      expect(manager.create).toHaveBeenCalledWith(
        Subscription,
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
      subscriptionRepository.findOne
        .mockResolvedValueOnce(currentActive) // the current ACTIVE row
        .mockResolvedValueOnce(null); // no PENDING row on the target plan

      await service.changePlan(30111222, 9, false);

      expect(currentActive.state).toBe(SubscriptionState.ACTIVE);
      expect(subscriptionRepository.save).not.toHaveBeenCalledWith(
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
      subscriptionRepository.findOne
        .mockResolvedValueOnce(currentActive) // the current ACTIVE row
        .mockResolvedValueOnce(null); // no PENDING row on the target plan

      await service.changePlan(30111222, 9, true);

      expect(currentActive.state).toBe(SubscriptionState.CANCELLED);
    });

    it('refuses a second change to a plan already pending payment', async () => {
      const pendingSamePlan = {
        id: 4,
        userId: 30111222,
        planId: 9,
        state: SubscriptionState.PENDING,
      };
      subscriptionRepository.findOne
        .mockResolvedValueOnce(null) // no ACTIVE row
        .mockResolvedValueOnce(pendingSamePlan); // one already pending

      await expect(service.changePlan(30111222, 9, false)).rejects.toThrow(
        ConflictException,
      );
      expect(subscriptionRepository.create).not.toHaveBeenCalled();
      expect(subscriptionRepository.save).not.toHaveBeenCalled();
    });

    it('does not cancel the current plan when the change is refused', async () => {
      const currentActive = {
        id: 1,
        userId: 30111222,
        planId: 5,
        state: SubscriptionState.ACTIVE,
      };
      subscriptionRepository.findOne
        .mockResolvedValueOnce(currentActive)
        .mockResolvedValueOnce({
          id: 4,
          userId: 30111222,
          planId: 9,
          state: SubscriptionState.PENDING,
        });

      await expect(service.changePlan(30111222, 9, true)).rejects.toThrow(
        ConflictException,
      );
      expect(currentActive.state).toBe(SubscriptionState.ACTIVE);
      expect(subscriptionRepository.save).not.toHaveBeenCalled();
    });
  });

  describe('activate', () => {
    it('promotes a PENDING subscription to ACTIVE', async () => {
      subscriptionRepository.findOne.mockResolvedValue({
        id: 7,
        state: SubscriptionState.PENDING,
        deleted: false,
      });

      await service.activate(7);

      expect(subscriptionRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({ id: 7, state: SubscriptionState.ACTIVE }),
      );
    });

    it('rejects an id that does not exist', async () => {
      await expect(service.activate(404)).rejects.toThrow(
        'La suscripción con ID: 404 no existe.',
      );
      expect(subscriptionRepository.save).not.toHaveBeenCalled();
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
      subscriptionRepository.findOne
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
      subscriptionRepository.findOne
        .mockResolvedValueOnce(stale) // findSubscription(id) inside activate
        .mockResolvedValueOnce(null); // no previously active row

      await service.activate(7);

      const today = new Date();
      const in30Days = new Date(today);
      in30Days.setDate(in30Days.getDate() + 30);

      expect(stale.startDate).toBe(localDate(today));
      expect(stale.endDate).toBe(localDate(in30Days));
      expect(subscriptionRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 7,
          state: SubscriptionState.ACTIVE,
          startDate: localDate(today),
          endDate: localDate(in30Days),
        }),
      );
    });
  });

  describe('replaceActiveSubscription', () => {
    const term = { months: 6, numDays: 180, price: 300, planDurationId: 7 };
    const today = new Date();

    it('cancels every live subscription, ACTIVE and PENDING alike', async () => {
      manager.find.mockResolvedValue([
        {
          id: 1,
          userId: 5,
          planId: 2,
          state: 'activa',
          endDate: toDateOnly(today),
        },
        { id: 2, userId: 5, planId: 3, state: 'pendiente' },
      ]);
      await service.replaceActiveSubscription(manager, {
        userId: 5,
        planId: 2,
        term,
      });
      expect(manager.save).toHaveBeenCalledWith(
        expect.objectContaining({ id: 1, state: 'cancelada' }),
      );
      expect(manager.save).toHaveBeenCalledWith(
        expect.objectContaining({ id: 2, state: 'cancelada' }),
      );
    });

    it('allows renewing the same plan, which changePlan refuses', async () => {
      manager.find.mockResolvedValue([
        {
          id: 1,
          userId: 5,
          planId: 2,
          state: 'activa',
          endDate: toDateOnly(today),
        },
      ]);
      await expect(
        service.replaceActiveSubscription(manager, {
          userId: 5,
          planId: 2,
          term,
        }),
      ).resolves.toBeDefined();
    });

    it('takes the period length from the resolved term, not from the plan', async () => {
      manager.find.mockResolvedValue([]);
      await service.replaceActiveSubscription(manager, {
        userId: 5,
        planId: 2,
        term,
      });
      expect(manager.create).toHaveBeenCalledWith(
        Subscription,
        expect.objectContaining({ planDurationId: 7, state: 'activa' }),
      );
      const created = manager.create.mock.calls[0][1];
      const days =
        (new Date(created.endDate).getTime() -
          new Date(created.startDate).getTime()) /
        86_400_000;
      expect(days).toBe(180);
    });

    it('snapshots the resolved term price onto the subscription as soldPrice', async () => {
      manager.find.mockResolvedValue([]);
      await service.replaceActiveSubscription(manager, {
        userId: 5,
        planId: 2,
        term,
      });
      expect(manager.create).toHaveBeenCalledWith(
        Subscription,
        expect.objectContaining({ soldPrice: term.price }),
      );
    });

    it('extends from the day after the current ACTIVE endDate when it has not passed', async () => {
      const endDate = toDateOnly(addDays(today, 3)); // still current
      manager.find.mockResolvedValue([
        { id: 1, userId: 5, planId: 2, state: 'activa', endDate },
      ]);
      await service.replaceActiveSubscription(manager, {
        userId: 5,
        planId: 2,
        term,
      });
      const created = manager.create.mock.calls[0][1];
      // created.startDate is already a 'YYYY-MM-DD' string (subscriptionPeriod's
      // output, cast to Date only for TypeORM's benefit) — compared directly
      // rather than round-tripped through `new Date(created.startDate)`, which
      // parses a date-only string as UTC midnight and would shift it back a
      // day once reformatted with the local-time toDateOnly, the exact trap
      // dayAfter exists to avoid.
      expect(created.startDate).toBe(toDateOnly(addDays(today, 4)));
    });

    it('starts today when the ACTIVE subscription already lapsed', async () => {
      const endDate = toDateOnly(addDays(today, -2)); // already expired
      manager.find.mockResolvedValue([
        { id: 1, userId: 5, planId: 2, state: 'activa', endDate },
      ]);
      await service.replaceActiveSubscription(manager, {
        userId: 5,
        planId: 2,
        term,
      });
      const created = manager.create.mock.calls[0][1];
      // Compared directly as a string — see the comment above.
      expect(created.startDate).toBe(toDateOnly(today));
    });

    it('starts today when there is no ACTIVE subscription to extend from', async () => {
      manager.find.mockResolvedValue([
        { id: 2, userId: 5, planId: 3, state: 'pendiente' },
      ]);
      await service.replaceActiveSubscription(manager, {
        userId: 5,
        planId: 2,
        term,
      });
      const created = manager.create.mock.calls[0][1];
      // Compared directly as a string — see the comment above.
      expect(created.startDate).toBe(toDateOnly(today));
    });

    it('uses the passed manager and never its own repository', async () => {
      manager.find.mockResolvedValue([]);
      await service.replaceActiveSubscription(manager, {
        userId: 5,
        planId: 2,
        term,
      });
      expect(subscriptionRepository.save).not.toHaveBeenCalled();
    });
  });
});
