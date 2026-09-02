import { Repository } from 'typeorm';
import { AnalyticsService } from './analytics.service';
import { AnalyticsQueryDto } from './dto/analytics-query-dto';
import { Payment } from '../payment/entity/payment.entity';
import { Subscription } from '../subscription/entity/subscription.entity';

describe('AnalyticsService', () => {
  let revenueQb: {
    select: jest.Mock;
    addSelect: jest.Mock;
    innerJoin: jest.Mock;
    where: jest.Mock;
    andWhere: jest.Mock;
    groupBy: jest.Mock;
    addGroupBy: jest.Mock;
    orderBy: jest.Mock;
    getRawMany: jest.Mock;
  };
  let activeSubs: jest.Mock;
  let service: AnalyticsService;
  let query: AnalyticsQueryDto;

  beforeEach(() => {
    revenueQb = {
      select: jest.fn().mockReturnThis(),
      addSelect: jest.fn().mockReturnThis(),
      innerJoin: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      groupBy: jest.fn().mockReturnThis(),
      addGroupBy: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      getRawMany: jest.fn().mockResolvedValue([]),
    };

    activeSubs = jest.fn().mockResolvedValue([]);

    const paymentRepository = {
      createQueryBuilder: jest.fn().mockReturnValue(revenueQb),
    } as unknown as Repository<Payment>;

    const subscriptionRepository = {
      find: activeSubs,
    } as unknown as Repository<Subscription>;

    service = new AnalyticsService(paymentRepository, subscriptionRepository);
    query = { ownerPassword: 'secreto' };
  });

  it('coerces the DECIMAL sums mysql2 returns as strings', async () => {
    revenueQb.getRawMany.mockResolvedValue([
      { period: '2026-08', total: '41200.00', count: '12' },
    ]);
    const result = await service.buildOverview(query);
    expect(result.revenue[0]).toEqual({
      period: '2026-08',
      total: 41200,
      count: 12,
    });
  });

  it('counts only completed, non-deleted payments', async () => {
    await service.buildOverview(query);
    expect(revenueQb.andWhere).toHaveBeenCalledWith('payment.state = :state', {
      state: 'completado',
    });
    expect(revenueQb.where).toHaveBeenCalledWith('payment.deleted = false');
  });

  it('groups by day when the granularity says so', async () => {
    await service.buildOverview({ ...query, granularity: 'day' as const });
    expect(revenueQb.select).toHaveBeenCalledWith(
      "DATE_FORMAT(payment.date, '%Y-%m-%d')",
      'period',
    );
  });

  it('divides a twelve-month price by twelve for MRR', async () => {
    activeSubs.mockResolvedValue([
      {
        plan: { price: '600.00' },
        planDuration: { months: 12, price: '600.00' },
      },
    ]);
    const result = await service.buildOverview(query);
    expect(result.estimatedMrr).toBe(50);
  });

  it('uses the plan price directly when there is no duration', async () => {
    activeSubs.mockResolvedValue([
      { plan: { price: '59.00' }, planDuration: null },
    ]);
    const result = await service.buildOverview(query);
    expect(result.estimatedMrr).toBe(59);
  });

  it('prefers soldPrice over a since-repriced planDuration.price', async () => {
    // Simulates a retired-then-revived duration: the same row now prices at
    // 500, but this subscription was actually sold at 300 — soldPrice is
    // the immutable record of that and must win.
    activeSubs.mockResolvedValue([
      {
        plan: { price: '99.00' },
        planDuration: { months: 6, price: '500.00' },
        soldPrice: '300.00',
      },
    ]);
    const result = await service.buildOverview(query);
    expect(result.estimatedMrr).toBe(50);
  });

  it('returns empty arrays and zeros for a range with no payments', async () => {
    revenueQb.getRawMany.mockResolvedValue([]);
    activeSubs.mockResolvedValue([]);
    const result = await service.buildOverview(query);
    expect(result).toMatchObject({
      revenue: [],
      byPlan: [],
      byMethod: [],
      activeSubscriptions: 0,
      estimatedMrr: 0,
    });
  });

  it('amortizes a discounted sale at the price actually charged', async () => {
    activeSubs.mockResolvedValue([
      {
        soldPrice: 14000,
        planDuration: { months: 3, price: 15000 },
        plan: { price: 5000 },
      },
    ]);

    const result = await service.buildOverview(query);

    // 14000 charged over 3 months, not the 15000 list price.
    expect(result.estimatedMrr).toBeCloseTo(14000 / 3);
  });

  it('counts a renewed member once, not once per subscription row', async () => {
    // A renewal leaves the previous row CANCELLED and a fresh ACTIVE one
    // behind; only the active row is counted.
    activeSubs.mockResolvedValue([
      { soldPrice: 14000, planDuration: { months: 3 }, plan: { price: 5000 } },
    ]);

    const result = await service.buildOverview(query);

    expect(result.activeSubscriptions).toBe(1);
  });
});
