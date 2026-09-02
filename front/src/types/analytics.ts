// Mirrors back/src/modules/analytics/dto/analytics-response-dto.ts exactly.
// Every money and count field is a plain number — the backend coerces the
// DECIMAL strings mysql2 returns before this DTO ever leaves the service.

export interface RevenuePoint {
  // 'YYYY-MM-DD' or 'YYYY-MM' depending on the request's granularity.
  period: string;
  total: number;
  count: number;
}

export interface PlanRevenue {
  planId: number;
  planName: string;
  total: number;
  count: number;
}

export interface MethodRevenue {
  payMethod: string;
  total: number;
  count: number;
}

export interface AnalyticsOverview {
  from: string;
  to: string;
  granularity: 'day' | 'month';
  generatedAt: string;
  revenue: RevenuePoint[];
  byPlan: PlanRevenue[];
  byMethod: MethodRevenue[];
  activeSubscriptions: number;
  estimatedMrr: number;
}
