import type { ReactNode } from 'react';
import { ArrowDownRight, ArrowUpRight, CalendarRange, Scale } from 'lucide-react';
import { Card } from '@/shared/components/ui/card';
import { formatCurrency } from '@/shared/components/ui/money-input';
import { cn } from '@/shared/lib/class-name.util';
import type { CashFlowTotals } from '../data/cash-flow-series';
import { DASHBOARD_CARD_CLASSES } from './dashboard-card.styles';

export type CashFlowSummaryProps = {
  totals: CashFlowTotals;
};

/** Minimum height of each total card; the loading skeleton of the page uses the same `h-36`. */
const CARD_MIN_HEIGHT = 'min-h-36';

type Tone = 'inflow' | 'outflow' | 'neutral';

/** Same glow and icon hues of the month dashboard indicators. */
const TONE_CLASSES: Record<Tone, { glow: string; icon: string }> = {
  inflow: {
    glow: 'bg-[radial-gradient(circle_at_100%_0%,rgba(16,185,129,0.16),transparent_55%)]',
    icon: 'border-emerald-500/25 bg-emerald-500/10 text-emerald-400',
  },
  outflow: {
    glow: 'bg-[radial-gradient(circle_at_100%_0%,rgba(244,63,94,0.16),transparent_55%)]',
    icon: 'border-rose-500/25 bg-rose-500/10 text-rose-400',
  },
  neutral: {
    glow: 'bg-[radial-gradient(circle_at_100%_0%,rgba(59,130,246,0.18),transparent_55%)]',
    icon: 'border-blue-500/25 bg-blue-500/10 text-blue-400',
  },
};

/** The sign of a result is shown only by color. */
function signClassName(value: number) {
  return value >= 0 ? 'text-emerald-400' : 'text-rose-400';
}

/** Drawn like the `IndicatorCard` of the month dashboard, which is internal to that component. */
function TotalCard({
  title,
  tone,
  icon,
  value,
  caption,
  valueClassName = 'text-zinc-50',
}: {
  title: string;
  tone: Tone;
  icon: ReactNode;
  value: number;
  caption: string;
  valueClassName?: string;
}) {
  const toneClasses = TONE_CLASSES[tone];

  return (
    <Card className={cn(DASHBOARD_CARD_CLASSES, CARD_MIN_HEIGHT, 'flex flex-col gap-4 p-5')}>
      <div aria-hidden="true" className={cn('pointer-events-none absolute inset-0', toneClasses.glow)} />
      <div className="relative flex items-center justify-between gap-3">
        <p className="text-sm font-medium text-zinc-300">{title}</p>
        <span className={cn('rounded-xl border p-2 [&_svg]:size-4', toneClasses.icon)}>{icon}</span>
      </div>
      <div className="relative flex flex-1 flex-col justify-end">
        <p className={cn('text-2xl font-bold tracking-tight md:text-3xl', valueClassName)}>{formatCurrency(value)}</p>
        <p className="text-xs text-zinc-500">{caption}</p>
      </div>
    </Card>
  );
}

/** Totals of the report window. It only renders the given totals. */
export function CashFlowSummaryComponent({ totals }: CashFlowSummaryProps) {
  return (
    <section aria-label="Totais do período" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <TotalCard
        title="Entradas"
        tone="inflow"
        icon={<ArrowUpRight />}
        value={totals.inflow}
        caption="soma das entradas do período"
      />
      <TotalCard
        title="Saídas"
        tone="outflow"
        icon={<ArrowDownRight />}
        value={totals.outflow}
        caption="soma das saídas do período"
      />
      <TotalCard
        title="Saldo do período"
        tone="neutral"
        icon={<Scale />}
        value={totals.balance}
        caption="entradas menos saídas"
        valueClassName={signClassName(totals.balance)}
      />
      <TotalCard
        title="Média mensal"
        tone="neutral"
        icon={<CalendarRange />}
        value={totals.monthlyAverage}
        caption="saldo do período dividido pelos meses"
        valueClassName={signClassName(totals.monthlyAverage)}
      />
    </section>
  );
}
