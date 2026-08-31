// Response shapes for POST /api/v1/analytics/overview. Every money and count
// field is a plain `number` here — AnalyticsService is where the DECIMAL
// strings mysql2 returns get coerced, never at the edge, so a DTO field never
// silently carries a string past this boundary.

export class RevenuePoint {
  // 'YYYY-MM-DD' or 'YYYY-MM' depending on the request's granularity, formed
  // in SQL by DATE_FORMAT — see AnalyticsService.revenueOverTime.
  period!: string;
  total!: number;
  count!: number;
}

export class PlanRevenue {
  planId!: number;
  planName!: string;
  total!: number;
  count!: number;
}

export class MethodRevenue {
  payMethod!: string;
  total!: number;
  count!: number;
}

export class AnalyticsOverview {
  from!: string;
  to!: string;
  granularity!: 'day' | 'month';
  generatedAt!: string;
  revenue!: RevenuePoint[];
  byPlan!: PlanRevenue[];
  byMethod!: MethodRevenue[];
  activeSubscriptions!: number;
  estimatedMrr!: number;
}
