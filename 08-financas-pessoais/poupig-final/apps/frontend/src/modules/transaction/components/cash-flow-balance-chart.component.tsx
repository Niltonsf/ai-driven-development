'use client';

import { TrendingUp } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { ComposedBarLineChart } from '@/shared/components/ui/composed-bar-line-chart';
import { formatCurrency } from '@/shared/components/ui/money-input';
import { cn } from '@/shared/lib/class-name.util';
import type { CashFlowPoint } from '../data/cash-flow-series';
import { CASH_FLOW_COLORS } from '../data/cash-flow-window';
import { DASHBOARD_CARD_CLASSES } from './dashboard-card.styles';

export type CashFlowBalanceChartProps = {
  points: CashFlowPoint[];
  /** No month of the window has movement: the chart shows its empty state. */
  isEmpty: boolean;
};

const CHART_HEIGHT = 320;

const EMPTY_POINTS: CashFlowPoint[] = [];

/**
 * Balance of every month as bars and the running sum of those balances as a line.
 * The cumulative starts from zero at the first month of the window and is not the
 * balance of any account. Read only.
 */
export function CashFlowBalanceChartComponent({ points, isEmpty }: CashFlowBalanceChartProps) {
  return (
    <Card className={cn(DASHBOARD_CARD_CLASSES, 'flex h-full flex-col')}>
      <CardHeader className="flex flex-row items-start justify-between gap-4 space-y-0">
        <div className="space-y-1">
          <CardTitle className="text-base font-semibold text-zinc-100">Saldo e acumulado</CardTitle>
          <p className="text-xs text-zinc-400">Saldo de cada mês e a soma dos saldos desde o início do período</p>
        </div>
        <span className="rounded-xl border border-white/10 bg-white/5 p-2.5 text-zinc-400 [&_svg]:size-5">
          <TrendingUp />
        </span>
      </CardHeader>

      <CardContent className="flex flex-1 flex-col justify-end">
        <ComposedBarLineChart
          data={isEmpty ? EMPTY_POINTS : points}
          xKey="label"
          barKey="balance"
          lineKey="cumulative"
          barLabel="Saldo do mês"
          lineLabel="Acumulado no período"
          barColor={CASH_FLOW_COLORS.balance}
          lineColor={CASH_FLOW_COLORS.cumulative}
          height={CHART_HEIGHT}
          valueFormatter={(value) => formatCurrency(value)}
          emptyState={
            <div className="flex h-full items-center justify-center rounded-xl border border-dashed border-white/10 bg-white/2 px-4 text-sm text-zinc-500">
              Nenhum saldo para mostrar no período
            </div>
          }
        />
      </CardContent>
    </Card>
  );
}
