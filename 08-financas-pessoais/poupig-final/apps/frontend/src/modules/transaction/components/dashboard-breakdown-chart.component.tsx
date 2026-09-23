'use client';

import { useState, type ReactNode } from 'react';
import { Cell, Pie, PieChart, ResponsiveContainer } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { formatCurrency } from '@/shared/components/ui/money-input';
import { cn } from '@/shared/lib/class-name.util';
import type { OutflowSlice } from '../data/dashboard-summary';
import { DASHBOARD_CARD_CLASSES } from './dashboard-card.styles';

/**
 * Categorical slots stepped for the dark surface, in fixed order (never cycled):
 * the order is what keeps adjacent slices apart for color-blind readers. Validated
 * as a ring (the last slice touches the first) against the card surface.
 */
const SLICE_COLORS = ['#3987e5', '#d95926', '#199e70', '#c98500', '#d55181'] as const;

/** Neutral for `Outras`: it is "the rest", not one more identity. Low contrast, so the legend always names it. */
const OTHERS_COLOR = '#475569';

const CHART_SIZE = 208;

export type DashboardBreakdownChartProps = {
  title: string;
  description: string;
  slices: OutflowSlice[];
  totalOutflow: number;
  emptyText: string;
  icon?: ReactNode;
};

function sliceColor(slice: OutflowSlice, index: number): string {
  return slice.isOthers ? OTHERS_COLOR : SLICE_COLORS[index % SLICE_COLORS.length];
}

function formatPercent(share: number): string {
  return `${Math.round(share * 100)}%`;
}

/**
 * Donut of the month outflow with a legend that names every slice. Hovering (or
 * focusing) a slice or a legend row highlights it and shows its numbers in the
 * center of the donut; otherwise the center shows the whole outflow.
 */
export function DashboardBreakdownChartComponent({
  title,
  description,
  slices,
  totalOutflow,
  emptyText,
  icon,
}: DashboardBreakdownChartProps) {
  const [activeKey, setActiveKey] = useState<string | null>(null);
  const activeSlice = slices.find((slice) => slice.key === activeKey) ?? null;

  return (
    <Card className={cn(DASHBOARD_CARD_CLASSES, 'flex h-full flex-col')}>
      <CardHeader className="flex flex-row items-start justify-between gap-4 space-y-0">
        <div className="space-y-1">
          <CardTitle className="text-base font-semibold text-zinc-100">{title}</CardTitle>
          <p className="text-xs text-zinc-400">{description}</p>
        </div>
        {icon ? (
          <span className="rounded-xl border border-white/10 bg-white/5 p-2.5 text-zinc-400 [&_svg]:size-5">
            {icon}
          </span>
        ) : null}
      </CardHeader>

      <CardContent className="@container flex flex-1 flex-col">
        {slices.length === 0 ? (
          <div className="flex flex-1 items-center justify-center rounded-xl border border-dashed border-white/10 bg-white/2 px-4 py-12 text-sm text-zinc-500">
            {emptyText}
          </div>
        ) : (
          <div className="flex flex-1 flex-col items-center gap-6 @md:flex-row">
            <div className="relative shrink-0" style={{ width: CHART_SIZE, height: CHART_SIZE }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={slices}
                    dataKey="total"
                    nameKey="label"
                    innerRadius="68%"
                    outerRadius="100%"
                    startAngle={90}
                    endAngle={-270}
                    paddingAngle={slices.length > 1 ? 2 : 0}
                    cornerRadius={4}
                    stroke="none"
                    onMouseEnter={(_, index) => setActiveKey(slices[index]?.key ?? null)}
                    onMouseLeave={() => setActiveKey(null)}
                  >
                    {slices.map((slice, index) => (
                      <Cell
                        key={slice.key}
                        fill={sliceColor(slice, index)}
                        opacity={activeKey === null || activeKey === slice.key ? 1 : 0.35}
                        className="cursor-pointer outline-none transition-opacity"
                      />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>

              <div
                aria-live="polite"
                className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center px-8 text-center"
              >
                <span className="max-w-full truncate text-[11px] font-medium uppercase tracking-wide text-zinc-400">
                  {activeSlice ? activeSlice.label : 'Total'}
                </span>
                <span className="text-lg font-bold text-zinc-100">
                  {formatCurrency(activeSlice ? activeSlice.total : totalOutflow)}
                </span>
                {activeSlice ? (
                  <span className="text-xs text-zinc-400">{formatPercent(activeSlice.share)} das saídas</span>
                ) : null}
              </div>
            </div>

            <ul className="w-full min-w-0 flex-1 space-y-1">
              {slices.map((slice, index) => {
                const isActive = activeKey === slice.key;

                return (
                  <li
                    key={slice.key}
                    tabIndex={0}
                    onMouseEnter={() => setActiveKey(slice.key)}
                    onMouseLeave={() => setActiveKey(null)}
                    onFocus={() => setActiveKey(slice.key)}
                    onBlur={() => setActiveKey(null)}
                    className={cn(
                      'rounded-lg px-2.5 py-2 outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring',
                      isActive ? 'bg-white/6' : 'hover:bg-white/4',
                    )}
                  >
                    <div className="flex items-center gap-2.5 text-sm">
                      <span
                        aria-hidden="true"
                        className="size-2.5 shrink-0 rounded-full"
                        style={{ backgroundColor: sliceColor(slice, index) }}
                      />
                      <span className="min-w-0 flex-1 truncate text-zinc-200">{slice.label}</span>
                      <span className="shrink-0 tabular-nums text-zinc-100">{formatCurrency(slice.total)}</span>
                      <span className="w-10 shrink-0 text-right text-xs tabular-nums text-zinc-400">
                        {formatPercent(slice.share)}
                      </span>
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
