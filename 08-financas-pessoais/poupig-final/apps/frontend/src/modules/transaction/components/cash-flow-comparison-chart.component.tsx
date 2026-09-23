'use client';

import { ChartColumn } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { GroupedBarChart } from '@/shared/components/ui/grouped-bar-chart';
import { formatCurrency } from '@/shared/components/ui/money-input';
import { cn } from '@/shared/lib/class-name.util';
import type { CashFlowPoint } from '../data/cash-flow-series';
import { CASH_FLOW_COLORS } from '../data/cash-flow-window';
import { DASHBOARD_CARD_CLASSES } from './dashboard-card.styles';

export type CashFlowComparisonChartProps = {
  points: CashFlowPoint[];
  /** No month of the window has movement: the chart shows its empty state. */
  isEmpty: boolean;
};

const CHART_HEIGHT = 320;

const EMPTY_POINTS: CashFlowPoint[] = [];

/** Inflow first, then outflow: the legend and the tooltip name every bar. */
const COMPARISON_SERIES = [
  { key: 'inflow', label: 'Entradas', color: CASH_FLOW_COLORS.inflow },
  { key: 'outflow', label: 'Saídas', color: CASH_FLOW_COLORS.outflow },
] satisfies { key: keyof CashFlowPoint & string; label: string; color: string }[];

/** Inflow and outflow of every month of the window, side by side. Read only. */
export function CashFlowComparisonChartComponent({ points, isEmpty }: CashFlowComparisonChartProps) {
  return (
    <Card className={cn(DASHBOARD_CARD_CLASSES, 'flex h-full flex-col')}>
      <CardHeader className="flex flex-row items-start justify-between gap-4 space-y-0">
        <div className="space-y-1">
          <CardTitle className="text-base font-semibold text-zinc-100">Entradas e saídas por mês</CardTitle>
          <p className="text-xs text-zinc-400">Comparação mês a mês, pendentes e efetivadas</p>
        </div>
        <span className="rounded-xl border border-white/10 bg-white/5 p-2.5 text-zinc-400 [&_svg]:size-5">
          <ChartColumn />
        </span>
      </CardHeader>

      <CardContent className="flex flex-1 flex-col justify-end">
        <GroupedBarChart
          data={isEmpty ? EMPTY_POINTS : points}
          xKey="label"
          series={COMPARISON_SERIES}
          height={CHART_HEIGHT}
          valueFormatter={(value) => formatCurrency(value)}
          emptyState={
            <div className="flex h-full items-center justify-center rounded-xl border border-dashed border-white/10 bg-white/2 px-4 text-sm text-zinc-500">
              Nenhuma entrada ou saída no período
            </div>
          }
        />
      </CardContent>
    </Card>
  );
}
