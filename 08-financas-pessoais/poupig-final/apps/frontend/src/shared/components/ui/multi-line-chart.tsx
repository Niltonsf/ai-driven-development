'use client';

import type { ReactNode } from 'react';
import { CartesianGrid, Line, LineChart, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { cn } from '@/shared/lib/class-name.util';

type ChartValue = string | number | null | undefined;
type ChartDatum = object;

export type MultiLineChartSeries = {
  /** Property of each datum with the value of this line. */
  key: string;
  /** Name shown in the tooltip. */
  label: string;
  color: string;
  /** Thicker line, for the lines that summarize the others. */
  emphasis?: boolean;
  /** Dashed line, to tell apart a line of another nature (e.g. a result). */
  dashed?: boolean;
};

type MultiLineChartProps<TData extends ChartDatum> = {
  data: TData[];
  xKey: keyof TData & string;
  /** Only the lines to draw: whoever owns the chart decides which lines are on. */
  series: MultiLineChartSeries[];
  height?: number;
  className?: string;
  emptyState?: ReactNode;
  /** A discreet line at zero, because the plotted values may be negative. */
  zeroLine?: boolean;
  /** Line to emphasize; the other lines fade while it is set. */
  highlightedKey?: string | null;
  xAxisTickFormatter?: (value: ChartValue) => string;
  tooltipLabelFormatter?: (value: ChartValue) => string;
  valueFormatter?: (value: number, dataKey: string) => string;
};

const DEFAULT_EMPTY_STATE = (
  <div className="flex h-full items-center justify-center rounded-xl border border-dashed border-white/10 bg-white/[0.03] text-sm text-zinc-500">
    Nenhum dado disponível para exibir no gráfico.
  </div>
);

function toNumber(value: unknown): number {
  const numericValue = typeof value === 'number' ? value : typeof value === 'string' ? Number(value) : 0;
  return Number.isFinite(numericValue) ? numericValue : 0;
}

/**
 * Many lines over the same axes, with the grid, axes and tooltip of
 * `ComposedBarLineChart`. It has no legend of its own: the owner renders a legend
 * that is also the control of which lines are on. Presentation only.
 */
export function MultiLineChart<TData extends ChartDatum>({
  data,
  xKey,
  series,
  height = 320,
  className,
  emptyState = DEFAULT_EMPTY_STATE,
  zeroLine = true,
  highlightedKey = null,
  xAxisTickFormatter,
  tooltipLabelFormatter,
  valueFormatter,
}: MultiLineChartProps<TData>) {
  const formatValue = (value: number, dataKey: string) => {
    if (valueFormatter) {
      return valueFormatter(value, dataKey);
    }

    return new Intl.NumberFormat('pt-BR').format(value);
  };

  if (data.length === 0 || series.length === 0) {
    return (
      <div className={className} style={{ height }}>
        {emptyState}
      </div>
    );
  }

  return (
    <div className={cn('w-full', className)} style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 8, right: 8, left: 4, bottom: 4 }}>
          <CartesianGrid vertical={false} stroke="rgba(255,255,255,0.08)" strokeDasharray="3 3" />
          <XAxis
            axisLine={false}
            dataKey={xKey as string}
            minTickGap={24}
            tickLine={false}
            tickMargin={10}
            tick={{ fill: 'rgba(244,244,245,0.72)', fontSize: 12 }}
            tickFormatter={xAxisTickFormatter ? (value) => xAxisTickFormatter(value as ChartValue) : undefined}
          />
          <YAxis
            axisLine={false}
            tickLine={false}
            tickMargin={10}
            tick={{ fill: 'rgba(244,244,245,0.6)', fontSize: 12 }}
            tickFormatter={(value: number) => formatValue(value, '')}
            width={80}
          />
          <Tooltip
            contentStyle={{
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: '16px',
              backgroundColor: 'rgba(24,24,27,0.96)',
              boxShadow: '0 20px 60px rgba(0, 0, 0, 0.35)',
            }}
            cursor={{ stroke: 'rgba(255,255,255,0.16)' }}
            // With many lines, the largest values first are the ones worth reading.
            itemSorter={(item) => -toNumber(item.value)}
            formatter={(value, name) => [formatValue(toNumber(value), String(name)), String(name)]}
            labelFormatter={(value) =>
              tooltipLabelFormatter ? tooltipLabelFormatter(value as ChartValue) : String(value)
            }
            wrapperStyle={{ outline: 'none' }}
          />
          {zeroLine ? <ReferenceLine y={0} stroke="rgba(255,255,255,0.24)" /> : null}
          {series.map((line) => {
            const isFaded = highlightedKey !== null && highlightedKey !== line.key;
            const isHighlighted = highlightedKey === line.key;
            const baseWidth = line.emphasis ? 3 : 1.75;

            return (
              <Line
                key={line.key}
                dataKey={line.key}
                name={line.label}
                type="monotone"
                stroke={line.color}
                strokeWidth={isHighlighted ? baseWidth + 1.25 : baseWidth}
                strokeOpacity={isFaded ? 0.2 : 1}
                strokeDasharray={line.dashed ? '6 4' : undefined}
                strokeLinecap="round"
                strokeLinejoin="round"
                dot={false}
                activeDot={{ r: 4, fill: line.color, strokeWidth: 0 }}
                isAnimationActive={false}
              />
            );
          })}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
