import { useState } from 'react';
import { periodLabel, shareOf } from './analytics-format';
import { formatPriceDisplay } from '../../lib/currency';
import type { AnalyticsOverview } from '../../types/analytics';

// Presentational pieces of OwnerAnalyticsPanel, split out to keep that file
// under the repo's ~200-line guideline. RevenueChart owns only hover state
// (which bar the pointer/focus is on) — that's interaction chrome, not the
// data-fetching/password concerns the "no fetching" rule below guards
// against. BreakdownList stays fully pure — no state, no fetching.

const CHART_HEIGHT = 140;
const BAR_WIDTH = 22;
const BAR_GAP = 10;
const AXIS_WIDTH = 46;
const BAR_RADIUS = 4;
const TOOLTIP_WIDTH = 112;
const TOOLTIP_HEIGHT = 36;

// A column's data-end (the top, where it meets the value) gets a 4px round;
// the baseline (the bottom, where it meets the axis) stays square, so bars
// visually plant on the axis line instead of floating. SVG's <rect rx> can't
// round only two corners, hence the hand-built path.
const barPath = (x: number, y: number, width: number, height: number): string => {
  const r = Math.min(BAR_RADIUS, height, width / 2);
  return `M${x},${y + height} L${x},${y + r} Q${x},${y} ${x + r},${y} L${x + width - r},${y} Q${x + width},${y} ${x + width},${y + r} L${x + width},${y + height} Z`;
};

interface RevenueChartProps {
  points: AnalyticsOverview['revenue'];
}

// Inline SVG bar series — no charting library. The whole chart scrolls
// horizontally so a day-granularity year of data does not squash every bar
// to a sliver; the value axis lives inside the same SVG for simplicity.
// A single series ("Ingresos", named by the heading above this component)
// needs no legend — --color-primary is the only hue in play.
export const RevenueChart = ({ points }: RevenueChartProps) => {
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);
  const max = Math.max(1, ...points.map((p) => p.total));
  const width = AXIS_WIDTH + points.length * (BAR_WIDTH + BAR_GAP);
  const hovered = hoverIndex !== null ? points[hoverIndex] : undefined;

  const clearHover = (index: number) =>
    setHoverIndex((current) => (current === index ? null : current));

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
          const isHovered = hoverIndex === index;
          return (
            <g
              key={point.period}
              tabIndex={0}
              role="img"
              aria-label={`${periodLabel(point.period)}: $${formatPriceDisplay(point.total)}`}
              className="cursor-pointer outline-none"
              onMouseEnter={() => setHoverIndex(index)}
              onMouseLeave={() => clearHover(index)}
              onFocus={() => setHoverIndex(index)}
              onBlur={() => clearHover(index)}
            >
              <path
                d={barPath(x, y, BAR_WIDTH, barHeight)}
                className={isHovered ? 'fill-primary-hover' : 'fill-primary'}
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
        {hovered &&
          hoverIndex !== null &&
          (() => {
            const barHeight = Math.max(1, (hovered.total / max) * CHART_HEIGHT);
            const barX = AXIS_WIDTH + hoverIndex * (BAR_WIDTH + BAR_GAP);
            const barY = CHART_HEIGHT - barHeight + 8;
            const rawX = barX + BAR_WIDTH / 2 - TOOLTIP_WIDTH / 2;
            const tooltipX = Math.min(Math.max(rawX, 0), width - TOOLTIP_WIDTH);
            const tooltipY = Math.max(barY - TOOLTIP_HEIGHT - 8, 0);
            return (
              <g pointerEvents="none">
                <rect
                  x={tooltipX}
                  y={tooltipY}
                  width={TOOLTIP_WIDTH}
                  height={TOOLTIP_HEIGHT}
                  rx={8}
                  className="fill-surface stroke-border"
                  strokeWidth={1}
                />
                <text
                  x={tooltipX + TOOLTIP_WIDTH / 2}
                  y={tooltipY + 15}
                  fontSize={10}
                  textAnchor="middle"
                  className="fill-text-muted"
                >
                  {periodLabel(hovered.period)}
                </text>
                <text
                  x={tooltipX + TOOLTIP_WIDTH / 2}
                  y={tooltipY + 28}
                  fontSize={12}
                  fontWeight={700}
                  textAnchor="middle"
                  className="fill-text"
                >
                  ${formatPriceDisplay(hovered.total)}
                </text>
              </g>
            );
          })()}
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
// own total, via shareOf — never a raw, unclamped ratio. Identity lives in
// the label text (Efectivo, Débito, …), never in the bar's color: every row
// shares the one series hue, so a per-row hue would falsely imply two rows
// are different categories when the palette has exactly one accent.
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
              <div className="h-2 overflow-hidden rounded-r-[4px] bg-surface-hover">
                <div
                  className="h-full rounded-r-[4px] bg-primary"
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
