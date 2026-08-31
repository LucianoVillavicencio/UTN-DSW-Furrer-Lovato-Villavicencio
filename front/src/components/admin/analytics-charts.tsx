import { periodLabel, shareOf } from './analytics-format';
import { formatPriceDisplay } from '../../lib/currency';
import type { AnalyticsOverview } from '../../types/analytics';

// Presentational pieces of OwnerAnalyticsPanel, split out to keep that file
// under the repo's ~200-line guideline. Both are pure — no state, no
// fetching — so they carry none of the panel's password-retention concerns.

const CHART_HEIGHT = 140;
const BAR_WIDTH = 22;
const BAR_GAP = 10;
const AXIS_WIDTH = 46;

interface RevenueChartProps {
  points: AnalyticsOverview['revenue'];
}

// Inline SVG bar series — no charting library. The whole chart scrolls
// horizontally so a day-granularity year of data does not squash every bar
// to a sliver; the value axis lives inside the same SVG for simplicity.
export const RevenueChart = ({ points }: RevenueChartProps) => {
  const max = Math.max(1, ...points.map((p) => p.total));
  const width = AXIS_WIDTH + points.length * (BAR_WIDTH + BAR_GAP);

  return (
    <div className="overflow-x-auto">
      <svg width={width} height={CHART_HEIGHT + 36} className="min-w-full">
        {[0, 0.5, 1].map((fraction) => {
          const y = CHART_HEIGHT - fraction * CHART_HEIGHT + 8;
          return (
            <g key={fraction}>
              <line
                x1={AXIS_WIDTH}
                y1={y}
                x2={width}
                y2={y}
                className="stroke-border"
                strokeWidth={1}
              />
              <text x={0} y={y + 3} fontSize={10} className="fill-text-muted">
                {formatPriceDisplay(Math.round(max * fraction))}
              </text>
            </g>
          );
        })}
        {points.map((point, index) => {
          const barHeight = Math.max(1, (point.total / max) * CHART_HEIGHT);
          const x = AXIS_WIDTH + index * (BAR_WIDTH + BAR_GAP);
          const y = CHART_HEIGHT - barHeight + 8;
          return (
            <g key={point.period}>
              <title>{`${periodLabel(point.period)}: $${formatPriceDisplay(point.total)}`}</title>
              <rect
                x={x}
                y={y}
                width={BAR_WIDTH}
                height={barHeight}
                rx={3}
                className="fill-primary"
              />
              <text
                x={x + BAR_WIDTH / 2}
                y={CHART_HEIGHT + 24}
                fontSize={10}
                textAnchor="middle"
                className="fill-text-muted"
              >
                {periodLabel(point.period)}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
};

interface BreakdownRow {
  key: string;
  label: string;
  total: number;
}

// A proportional-bar list: each row's width is its share of the breakdown's
// own total, via shareOf — never a raw, unclamped ratio.
export const BreakdownList = ({
  title,
  rows,
  total,
}: {
  title: string;
  rows: BreakdownRow[];
  total: number;
}) => (
  <div>
    <h4 className="mb-3 font-body text-sm font-semibold text-text">{title}</h4>
    {rows.length === 0 ? (
      <p className="text-sm text-text-muted">Sin datos en este período.</p>
    ) : (
      <ul className="space-y-2.5">
        {rows.map((row) => {
          const pct = shareOf(row.total, total);
          return (
            <li key={row.key}>
              <div className="mb-1 flex justify-between text-xs">
                <span className="text-text">{row.label}</span>
                <span className="text-text-muted">
                  ${formatPriceDisplay(row.total)} · {pct.toFixed(0)}%
                </span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-surface-hover">
                <div
                  className="h-full rounded-full bg-primary"
                  style={{ width: `${pct}%` }}
                />
              </div>
            </li>
          );
        })}
      </ul>
    )}
  </div>
);
