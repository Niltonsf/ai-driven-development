# `_chart-theme.ts` pattern

A single source of truth for chart visual configuration. Every chart component imports from here — never from raw constants or Tailwind values.

## File location

`src/shared/components/charts/_chart-theme.ts`

The leading underscore signals "internal — not part of the public exports". `index.ts` does NOT re-export it.

## Shape

```ts
// src/shared/components/charts/_chart-theme.ts
export const chartTheme = {
  series: ['#5b8def', '#22c55e', '#f59e0b', '#ef4444', '#a855f7', '#06b6d4'],
  semantic: { success: '#22c55e', danger: '#ef4444', warning: '#f59e0b', info: '#3b82f6' },
  grid: '#eef0f4',
  axisLine: '#e5e7eb',
  axisLabel: '#374151',
  tickLabel: '#6b7280',
  tooltip: {
    bg: '#ffffff',
    fg: '#1f2937',
    border: '#e5e7eb',
    radius: 6,
    padding: 12,
    shadow: '0 4px 12px rgba(0, 0, 0, 0.08)',
  },
  legend: {
    position: 'bottom' as const,
    marker: 'circle' as const,
    markerSize: 8,
    fg: '#374151',
    gap: 16,
  },
  typography: {
    fontFamily: 'Inter, ui-sans-serif, system-ui, sans-serif',
    axisLabelSize: 12,
    tickLabelSize: 11,
    tooltipSize: 12,
    legendSize: 12,
  },
  animation: { duration: 1000, easing: 'easeOutCubic' as const },
  bar: { topRadius: 4, columnWidth: '60%' as const, gap: 8 },
  line: { strokeWidth: 2, curve: 'smooth' as const, showMarkers: false, markerSize: 4 },
  area: { fillOpacityStart: 0.6, fillOpacityEnd: 0.0, gradient: true },
  donut: { innerRatio: 0.7 },
} as const;

export type ChartTheme = typeof chartTheme;
```

## Per-library adapter

For each library, also export a small adapter that converts `chartTheme` into the library's native option shape. Keeps the per-chart files thin.

### ApexCharts adapter example

```ts
// inside _chart-theme.ts (Apex variant)
import type { ApexOptions } from 'apexcharts';

export function apexBaseOptions(): ApexOptions {
  return {
    colors: [...chartTheme.series],
    chart: {
      fontFamily: chartTheme.typography.fontFamily,
      animations: {
        enabled: true,
        speed: chartTheme.animation.duration,
        easing: 'easeout',
      },
      toolbar: { show: false },
    },
    grid: {
      borderColor: chartTheme.grid,
      strokeDashArray: 0,
    },
    xaxis: {
      labels: { style: { colors: chartTheme.tickLabel, fontSize: `${chartTheme.typography.tickLabelSize}px` } },
      axisBorder: { color: chartTheme.axisLine },
      axisTicks: { color: chartTheme.axisLine },
    },
    yaxis: {
      labels: { style: { colors: chartTheme.tickLabel, fontSize: `${chartTheme.typography.tickLabelSize}px` } },
    },
    legend: {
      position: chartTheme.legend.position,
      markers: { width: chartTheme.legend.markerSize, height: chartTheme.legend.markerSize, radius: chartTheme.legend.markerSize / 2 },
      labels: { colors: chartTheme.legend.fg },
      fontSize: `${chartTheme.typography.legendSize}px`,
      itemMargin: { horizontal: chartTheme.legend.gap, vertical: 4 },
    },
    tooltip: {
      theme: 'light',
      style: { fontSize: `${chartTheme.typography.tooltipSize}px`, fontFamily: chartTheme.typography.fontFamily },
    },
  };
}
```

### Recharts adapter example

```ts
export const rechartsTheme = {
  axisProps: {
    tick: { fill: chartTheme.tickLabel, fontSize: chartTheme.typography.tickLabelSize, fontFamily: chartTheme.typography.fontFamily },
    stroke: chartTheme.axisLine,
  },
  gridProps: {
    stroke: chartTheme.grid,
    strokeDasharray: '0',
  },
  tooltipContentStyle: {
    background: chartTheme.tooltip.bg,
    border: `1px solid ${chartTheme.tooltip.border}`,
    borderRadius: chartTheme.tooltip.radius,
    padding: chartTheme.tooltip.padding,
    boxShadow: chartTheme.tooltip.shadow,
    fontSize: chartTheme.typography.tooltipSize,
    color: chartTheme.tooltip.fg,
  },
  legendProps: {
    iconType: 'circle' as const,
    iconSize: chartTheme.legend.markerSize,
    wrapperStyle: { fontSize: chartTheme.typography.legendSize, color: chartTheme.legend.fg, paddingTop: chartTheme.legend.gap },
  },
};
```

## Use inside a chart component

```tsx
// bar-chart.component.tsx (Recharts example)
'use client';
import { BarChart as RBarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { chartTheme, rechartsTheme } from './_chart-theme';
import { cn } from '@/shared/utils/cn';

export type BarChartProps<T extends Record<string, unknown>> = {
  data: T[];
  xKey: keyof T & string;
  series: Array<{ key: keyof T & string; label: string; color?: string }>;
  variant?: 'simple' | 'stacked' | 'grouped';
  height?: number;
  showLegend?: boolean;
  showGrid?: boolean;
  className?: string;
};

export function BarChart<T extends Record<string, unknown>>({
  data, xKey, series, variant = 'simple', height = 300, showLegend = true, showGrid = true, className,
}: BarChartProps<T>) {
  return (
    <div className={cn('w-full', className)} role="img" aria-label="Bar chart">
      <ResponsiveContainer width="100%" height={height}>
        <RBarChart data={data}>
          {showGrid && <CartesianGrid {...rechartsTheme.gridProps} vertical={false} />}
          <XAxis dataKey={xKey} {...rechartsTheme.axisProps} />
          <YAxis {...rechartsTheme.axisProps} />
          <Tooltip contentStyle={rechartsTheme.tooltipContentStyle} />
          {showLegend && <Legend {...rechartsTheme.legendProps} />}
          {series.map((s, i) => (
            <Bar
              key={s.key}
              dataKey={s.key}
              name={s.label}
              fill={s.color ?? chartTheme.series[i % chartTheme.series.length]}
              radius={[chartTheme.bar.topRadius, chartTheme.bar.topRadius, 0, 0]}
              stackId={variant === 'stacked' ? 'stack' : undefined}
            />
          ))}
        </RBarChart>
      </ResponsiveContainer>
    </div>
  );
}
```

## Hard rules

- Every chart imports `chartTheme` (and the per-lib adapter) from `_chart-theme.ts`.
- No hex literals inside chart components.
- No magic numbers for stroke widths, font sizes, durations — all from `chartTheme`.
- Per-library adapters live in the same `_chart-theme.ts` so the file is self-contained.
