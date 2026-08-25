import { LessThan } from 'typeorm';
import { subscriptionService } from './subscription.service';
import { SubscriptionState } from './enum/subscription-state.enum';
import { toDateOnly } from './subscription.rules';

describe('expireLapsedSubscriptions', () => {
  const buildService = () => {
    const repository = {
      update: jest.fn().mockResolvedValue({ affected: 3 }),
    };

    const service = new subscriptionService(
      repository as never,
      {} as never,
      {} as never,
    );

    return { service, repository };
  };

  it('selects only ACTIVE, non-deleted rows that ended before today', async () => {
    const { service, repository } = buildService();

    await service.expireLapsedSubscriptions();

    expect(repository.update).toHaveBeenCalledTimes(1);

    const [criteria, patch] = repository.update.mock.calls[0] as [
      Record<string, unknown>,
      Record<string, unknown>,
    ];

    expect(criteria).toEqual({
      state: SubscriptionState.ACTIVE,
      deleted: false,
      endDate: LessThan(toDateOnly(new Date())),
    });
    expect(patch).toEqual({ state: SubscriptionState.INACTIVE });
  });

  // The sweep is bookkeeping, not the access boundary. A subscription ending
  // today is still current (isCurrentOn is inclusive), so a strictly-less-than
  // comparison is required — GTE here would expire members a day early and
  // silently contradict the read path.
  it('uses a strict comparison so a subscription ending today survives', async () => {
    const { service, repository } = buildService();

    await service.expireLapsedSubscriptions();

    const [criteria] = repository.update.mock.calls[0] as [
      Record<string, unknown>,
      Record<string, unknown>,
    ];
    expect(criteria.endDate).toEqual(LessThan(toDateOnly(new Date())));
  });

  it('returns the update result so the affected count is observable', async () => {
    const { service } = buildService();

    await expect(service.expireLapsedSubscriptions()).resolves.toEqual({
      affected: 3,
    });
  });
});
