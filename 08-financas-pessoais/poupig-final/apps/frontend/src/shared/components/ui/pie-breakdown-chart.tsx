'use client';

import type { ReactNode } from 'react';
import { Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';
import { cn } from '@/shared/lib/class-name.util';

type PieBreakdownChartDatum = {
  /** Stable identity of the slice: key of the `Cell` and the value sent by the slice events. */
  id?: string;
  label: string;
  value: number;
  color?: string;
};

type PieBreakdownChartProps = {
  data: PieBreakdownChartDatum[];
  height?: number;
  className?: string;
  emptyState?: ReactNode;
  valueFormatter?: (value: number) => string;
  showLegend?: boolean;
  showPercentageInTooltip?: boolean;
  /** Called with the `id` of the clicked slice; slices without `id` do not call it. */
  onSliceClick?: (id: string) => void;
  /** Called with the `id` of the hovered slice, and with `null` when the pointer leaves it. */
  onSliceHover?: (id: string | null) => void;
  /** Slice drawn at full opacity while the others fade; ignored when no slice has this `id`. */
  highlightedId?: string | null;
  /** Content drawn over the hole of the donut, without catching the pointer. */
  centerContent?: ReactNode;
};

/** Opacity of the slices other than the highlighted one. */
const FADED_SLICE_OPACITY = 0.35;

const DEFAULT_COLORS = [
  '#4ADE80',
  '#22C55E',
  '#16A34A',
  '#86EFAC',
  '#FB7185',
  '#F97316',
  '#FACC15',
  '#38BDF8',
  '#A78BFA',
  '#F472B6',
];

const DEFAULT_EMPTY_STATE = (
  <div className="flex h-full items-center justify-center rounded-xl border border-dashed border-white/10 bg-white/[0.03] text-sm text-zinc-500">
    Nenhum dado disponível para exibir no gráfico.
  </div>
);

export function PieBreakdownChart({
  data,
  height = 320,
  className,
  emptyState = DEFAULT_EMPTY_STATE,
  valueFormatter,
  showLegend = true,
  showPercentageInTooltip = false,
  onSliceClick,
  onSliceHover,
  highlightedId,
  centerContent,
}: PieBreakdownChartProps) {
  const formatValue = (value: number) => {
    if (valueFormatter) {
      return valueFormatter(value);
    }

    return new Intl.NumberFormat('pt-BR').format(value);
  };

  const totalValue = data.reduce((total, item) => total + item.value, 0);

  // A highlight that matches no slice (for example, a slice just hidden) must not fade them all.
  const hasHighlight = highlightedId != null && data.some((item) => item.id === highlightedId);

  if (data.length === 0) {
    return (
      <div className={className} style={{ height }}>
        {emptyState}
      </div>
    );
  }

  return (
    <div className={cn('relative w-full', className)} style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Tooltip
            contentStyle={{
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: '16px',
              backgroundColor: 'rgba(24,24,27,0.96)',
              boxShadow: '0 20px 60px rgba(0, 0, 0, 0.35)',
            }}
            formatter={(value, name, item) => {
              const numericValue = typeof value === 'number' ? value : typeof value === 'string' ? Number(value) : 0;

              const safeValue = Number.isFinite(numericValue) ? numericValue : 0;
              const percentage = totalValue > 0 ? (safeValue / totalValue) * 100 : 0;

              return [
                showPercentageInTooltip
                  ? `${formatValue(safeValue)} • ${percentage.toFixed(1).replace('.', ',')}%`
                  : formatValue(safeValue),
                String(name ?? item?.name ?? ''),
              ];
            }}
            wrapperStyle={{ outline: 'none' }}
          />
          {showLegend ? (
            <Legend
              verticalAlign="bottom"
              align="center"
              iconType="circle"
              wrapperStyle={{ fontSize: '12px', color: 'rgba(244,244,245,0.72)' }}
            />
          ) : null}
          <Pie
            data={data}
            dataKey="value"
            nameKey="label"
            innerRadius={72}
            outerRadius={108}
            paddingAngle={2}
            cornerRadius={8}
            stroke="rgba(24,24,27,0.65)"
            strokeWidth={1}
            onClick={
              onSliceClick
                ? (_, index) => {
                    const id = data[index]?.id;
                    if (id !== undefined) onSliceClick(id);
                  }
                : undefined
            }
            onMouseEnter={
              onSliceHover
                ? (_, index) => {
                    const id = data[index]?.id;
                    if (id !== undefined) onSliceHover(id);
                  }
                : undefined
            }
            onMouseLeave={onSliceHover ? () => onSliceHover(null) : undefined}
          >
            {data.map((item, index) => (
              <Cell
                key={item.id ?? `${item.label}-${index}`}
                fill={item.color ?? DEFAULT_COLORS[index % DEFAULT_COLORS.length]}
                opacity={hasHighlight && item.id !== highlightedId ? FADED_SLICE_OPACITY : undefined}
                className={cn(
                  highlightedId !== undefined && 'transition-opacity',
                  onSliceClick && item.id !== undefined && 'cursor-pointer outline-none',
                )}
              />
            ))}
          </Pie>
        </PieChart>
      </ResponsiveContainer>

      {centerContent ? (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">{centerContent}</div>
      ) : null}
    </div>
  );
}
