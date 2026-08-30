import { ConflictException, NotFoundException } from '@nestjs/common';
import { PauseService } from './pause.service';
import { SubscriptionState } from './enum/subscription-state.enum';
import * as pauseRules from './pause.rules';

describe('PauseService', () => {
  let subscriptionService: {
    findSubscription: jest.Mock;
    save: jest.Mock;
  };
  let classRegistrationService: {
    cancelFutureForUser: jest.Mock;
  };
  let service: PauseService;

  const buildSubscription = (overrides: Record<string, unknown> = {}) => ({
    id: 7,
    userId: 42,
    state: SubscriptionState.ACTIVE,
    endDate: '2026-09-30',
    pausedAt: null,
    pausedById: null,
    ...overrides,
  });

  beforeEach(() => {
    subscriptionService = {
      findSubscription: jest.fn(),
      // Mirrors the repository.save mocks elsewhere in this codebase: returns
      // whatever was handed to it, augmented, so assertions can inspect the
      // object mutated by the service under test.
      save: jest.fn((subscription: object) =>
        Promise.resolve({ ...subscription }),
      ),
    };
    classRegistrationService = {
      cancelFutureForUser: jest.fn().mockResolvedValue(undefined),
    };
    service = new PauseService(
      subscriptionService as never,
      classRegistrationService as never,
    );
  });

  describe('pause', () => {
    it('sets PAUSED and records who paused it and when', async () => {
      const subscription = buildSubscription();
      subscriptionService.findSubscription.mockResolvedValue(subscription);

      const before = new Date();
      const result = await service.pause(7, 999);
      const after = new Date();

      expect(subscriptionService.save).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 7,
          state: SubscriptionState.PAUSED,
          pausedById: 999,
        }),
      );
      const saved = result as { pausedAt: Date; state: string };
      expect(saved.state).toBe(SubscriptionState.PAUSED);
      expect(saved.pausedAt.getTime()).toBeGreaterThanOrEqual(before.getTime());
      expect(saved.pausedAt.getTime()).toBeLessThanOrEqual(after.getTime());
    });

    it("cancels the member's future class reservations but not past ones", async () => {
      // A frozen membership cannot hold next week's spot while somebody else
      // is turned away from it. cancelFutureForUser is the one method that
      // owns the CONFIRMED/CANCELLED boundary (see its own doc comment for
      // why that, not a date, is what "future" means in this weekly-slots
      // model) — this test only asserts pause() delegates to it for the
      // right member.
      const subscription = buildSubscription();
      subscriptionService.findSubscription.mockResolvedValue(subscription);

      await service.pause(7, 999);

      expect(classRegistrationService.cancelFutureForUser).toHaveBeenCalledWith(
        42,
      );
    });

    it('refuses a subscription that is already paused', async () => {
      const subscription = buildSubscription({
        state: SubscriptionState.PAUSED,
        pausedAt: new Date('2026-08-01'),
      });
      subscriptionService.findSubscription.mockResolvedValue(subscription);

      await expect(service.pause(7, 999)).rejects.toThrow(ConflictException);
      expect(subscriptionService.save).not.toHaveBeenCalled();
      expect(
        classRegistrationService.cancelFutureForUser,
      ).not.toHaveBeenCalled();
    });

    it('refuses a subscription that is not ACTIVE', async () => {
      const subscription = buildSubscription({
        state: SubscriptionState.PENDING,
      });
      subscriptionService.findSubscription.mockResolvedValue(subscription);

      await expect(service.pause(7, 999)).rejects.toThrow(ConflictException);
      expect(subscriptionService.save).not.toHaveBeenCalled();
      expect(
        classRegistrationService.cancelFutureForUser,
      ).not.toHaveBeenCalled();
    });

    it('throws when the subscription does not exist', async () => {
      subscriptionService.findSubscription.mockResolvedValue(null);

      await expect(service.pause(404, 999)).rejects.toThrow(NotFoundException);
      expect(subscriptionService.save).not.toHaveBeenCalled();
    });
  });

  describe('unpause', () => {
    it('extends endDate by exactly the days frozen', async () => {
      // Paused 47 days ago => 47 more days, whatever endDate did in the
      // meantime.
      const pausedAt = new Date();
      pausedAt.setDate(pausedAt.getDate() - 47);
      const subscription = buildSubscription({
        state: SubscriptionState.PAUSED,
        pausedAt,
        endDate: '2026-09-30',
      });
      subscriptionService.findSubscription.mockResolvedValue(subscription);

      await service.unpause(7);

      expect(subscriptionService.save).toHaveBeenCalledWith(
        expect.objectContaining({ id: 7, endDate: '2026-11-16' }),
      );
    });

    it('returns the days even when the pause outran the 90-day cap', async () => {
      // Confiscating time the member paid for would be worse than a stale row.
      const pausedAt = new Date();
      pausedAt.setDate(pausedAt.getDate() - 120);
      const subscription = buildSubscription({
        state: SubscriptionState.PAUSED,
        pausedAt,
        endDate: '2026-09-30',
      });
      subscriptionService.findSubscription.mockResolvedValue(subscription);

      await service.unpause(7);

      expect(subscriptionService.save).toHaveBeenCalledWith(
        expect.objectContaining({ id: 7, endDate: '2027-01-28' }),
      );
    });

    it('sets state back to ACTIVE and clears pausedAt', async () => {
      const subscription = buildSubscription({
        state: SubscriptionState.PAUSED,
        pausedAt: new Date('2026-08-01'),
        endDate: '2026-09-30',
      });
      subscriptionService.findSubscription.mockResolvedValue(subscription);

      await service.unpause(7);

      expect(subscriptionService.save).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 7,
          state: SubscriptionState.ACTIVE,
          pausedAt: null,
        }),
      );
    });

    it('refuses a subscription that is not paused, without doing date math', async () => {
      const spy = jest.spyOn(pauseRules, 'daysOwedBack');
      const subscription = buildSubscription({
        state: SubscriptionState.ACTIVE,
        pausedAt: null,
      });
      subscriptionService.findSubscription.mockResolvedValue(subscription);

      await expect(service.unpause(7)).rejects.toThrow(ConflictException);

      expect(spy).not.toHaveBeenCalled();
      expect(subscriptionService.save).not.toHaveBeenCalled();
      spy.mockRestore();
    });

    it('throws when the subscription does not exist', async () => {
      subscriptionService.findSubscription.mockResolvedValue(null);

      await expect(service.unpause(404)).rejects.toThrow(NotFoundException);
      expect(subscriptionService.save).not.toHaveBeenCalled();
    });
  });
});
