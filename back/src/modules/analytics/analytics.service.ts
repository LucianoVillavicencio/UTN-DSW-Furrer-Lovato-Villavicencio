import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { MoreThanOrEqual, Repository } from 'typeorm';
import { Payment } from '../payment/entity/payment.entity';
import { PaymentState } from '../payment/enum/payment-state.enum';
import { Subscription } from '../subscription/entity/subscription.entity';
import { SubscriptionState } from '../subscription/enum/subscription-state.enum';
import { toDateOnly } from '../subscription/subscription.rules';
import { AnalyticsQueryDto } from './dto/analytics-query-dto';
import {
  AnalyticsOverview,
  MethodRevenue,
  PlanRevenue,
  RevenuePoint,
} from './dto/analytics-response-dto';

// mysql2 returns DECIMAL aggregates as strings so they do not lose precision
// to a float. Every total leaving this service is a number — a DTO that says
// `total: number` and carries "41200.00" formats as NaN the first time the
// frontend divides by it.
const toNumber = (value: unknown): number => Number(value ?? 0);

interface RevenueRawRow {
  period: string;
  total: unknown;
  count: unknown;
}

interface PlanRevenueRawRow {
  planId: unknown;
  planName: string;
  total: unknown;
  count: unknown;
}

interface MethodRevenueRawRow {
  payMethod: string;
  total: unknown;
  count: unknown;
}

const monthsAgo = (date: Date, months: number): Date => {
  const result = new Date(date);
  result.setMonth(result.getMonth() - months);
  return result;
};

const tomorrow = (date: Date): Date => {
  const result = new Date(date);
  result.setDate(result.getDate() + 1);
  return result;
};

@Injectable()
export class AnalyticsService {
  constructor(
    @InjectRepository(Payment)
    private readonly paymentRepository: Repository<Payment>,
    @InjectRepository(Subscription)
    private readonly subscriptionRepository: Repository<Subscription>,
  ) {}

  async buildOverview(dto: AnalyticsQueryDto): Promise<AnalyticsOverview> {
    const granularity = dto.granularity ?? 'month';
    const now = new Date();
    const from = dto.from ? new Date(dto.from) : monthsAgo(now, 12);
    const to = dto.to ? new Date(dto.to) : tomorrow(now);

    const [revenueRaw, byPlanRaw, byMethodRaw, active] = await Promise.all([
      this.revenueOverTime(from, to, granularity),
      this.revenueByPlan(from, to),
      this.revenueByMethod(from, to),
      this.findActiveSubscriptions(),
    ]);

    const revenue: RevenuePoint[] = revenueRaw.map((row) => ({
      period: row.period,
      total: toNumber(row.total),
      count: toNumber(row.count),
    }));

    const byPlan: PlanRevenue[] = byPlanRaw.map((row) => ({
      planId: toNumber(row.planId),
      planName: row.planName,
      total: toNumber(row.total),
      count: toNumber(row.count),
    }));

    const byMethod: MethodRevenue[] = byMethodRaw.map((row) => ({
      payMethod: row.payMethod,
      total: toNumber(row.total),
      count: toNumber(row.count),
    }));

    // The price comes from the subscription's own soldPrice snapshot, not a
    // live join of planDuration.price: a PlanDuration's price can be
    // silently rewritten later (retire it, re-add the same month count —
    // the only repricing path the admin UI offers), and that must not
    // retroactively change what an already-sold subscription is recorded as
    // having cost. `months` still comes from the live relation — a
    // duration's month count is effectively immutable in practice, since the
    // edit-in-place PUT route is unreachable from the UI. soldPrice is only
    // null for subscriptions written before this column existed.
    const estimatedMrr = active.reduce((sum, subscription) => {
      // A 12-month term at 600 is 50 a month. A null planDuration means it
      // was sold at the plan's own monthly price.
      const price =
        subscription.soldPrice != null
          ? toNumber(subscription.soldPrice)
          : subscription.planDuration
            ? toNumber(subscription.planDuration.price)
            : toNumber(subscription.plan.price);
      const months = subscription.planDuration?.months ?? 1;
      return sum + price / months;
    }, 0);

    return {
      from: from.toISOString(),
      to: to.toISOString(),
      granularity,
      generatedAt: new Date().toISOString(),
      revenue,
      byPlan,
      byMethod,
      activeSubscriptions: active.length,
      estimatedMrr,
    };
  }

  // Grouped in SQL, never on the serialised ISO date: `date` is a datetime
  // that reaches the client as UTC, so grouping in JS files every payment
  // taken after 21:00 ART under the following day.
  //
  // DATE_FORMAT is MySQL-specific; the project is MySQL-only and says so at
  // typeorm.config.ts:8. The format string is a literal chosen from two
  // constants and never comes from input.
  private revenueOverTime(
    from: Date,
    to: Date,
    granularity: 'day' | 'month',
  ): Promise<RevenueRawRow[]> {
    const format = granularity === 'day' ? '%Y-%m-%d' : '%Y-%m';
    return this.paymentRepository
      .createQueryBuilder('payment')
      .select(`DATE_FORMAT(payment.date, '${format}')`, 'period')
      .addSelect('SUM(payment.amount)', 'total')
      .addSelect('COUNT(payment.id)', 'count')
      .where('payment.deleted = false')
      .andWhere('payment.state = :state', { state: PaymentState.COMPLETED })
      .andWhere('payment.date >= :from AND payment.date < :to', { from, to })
      .groupBy('period')
      .orderBy('period', 'ASC')
      .getRawMany();
  }

  // innerJoin, not leftJoin: a payment with no subscription cannot exist —
  // Payment.subscriptionId is nullable: false — and an inner join keeps the
  // per-plan totals from acquiring a null bucket if one ever did.
  private revenueByPlan(from: Date, to: Date): Promise<PlanRevenueRawRow[]> {
    return this.paymentRepository
      .createQueryBuilder('payment')
      .innerJoin('payment.subscription', 'subscription')
      .innerJoin('subscription.plan', 'plan')
      .select('plan.id', 'planId')
      .addSelect('plan.name', 'planName')
      .addSelect('SUM(payment.amount)', 'total')
      .addSelect('COUNT(payment.id)', 'count')
      .where('payment.deleted = false')
      .andWhere('payment.state = :state', { state: PaymentState.COMPLETED })
      .andWhere('payment.date >= :from AND payment.date < :to', { from, to })
      .groupBy('plan.id')
      .addGroupBy('plan.name')
      .orderBy('total', 'DESC')
      .getRawMany();
  }

  private revenueByMethod(
    from: Date,
    to: Date,
  ): Promise<MethodRevenueRawRow[]> {
    return this.paymentRepository
      .createQueryBuilder('payment')
      .select('payment.payMethod', 'payMethod')
      .addSelect('SUM(payment.amount)', 'total')
      .addSelect('COUNT(payment.id)', 'count')
      .where('payment.deleted = false')
      .andWhere('payment.state = :state', { state: PaymentState.COMPLETED })
      .andWhere('payment.date >= :from AND payment.date < :to', { from, to })
      .groupBy('payment.payMethod')
      .orderBy('total', 'DESC')
      .getRawMany();
  }

  // The same double condition findActiveForUser applies per request, and for
  // the same reason its comment gives: the nightly sweep is bookkeeping, not
  // the boundary, so a count that trusts `state` alone over-reports every
  // member whose plan lapsed since 3 AM.
  private findActiveSubscriptions(): Promise<Subscription[]> {
    return this.subscriptionRepository.find({
      where: {
        state: SubscriptionState.ACTIVE,
        deleted: false,
        endDate: MoreThanOrEqual(toDateOnly(new Date()) as unknown as Date),
      },
      relations: { plan: true, planDuration: true },
    });
  }
}
