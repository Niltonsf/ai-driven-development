import type { ReactNode } from 'react';
import { ArrowDownRight, ArrowUpRight, Percent, Scale } from 'lucide-react';
import { Card } from '@/shared/components/ui/card';
import { formatCurrency } from '@/shared/components/ui/money-input';
import { cn } from '@/shared/lib/class-name.util';
import { formatCommitment, type RecurrenceTotals } from '../data/recurrence-report';
import { DASHBOARD_CARD_CLASSES } from './dashboard-card.styles';

export type RecurrenceSummaryProps = {
  totals: RecurrenceTotals;
};

/** Minimum height of each total card; the loading skeleton of the page uses the same `h-36`. */
const CARD_MIN_HEIGHT = 'min-h-36';

type Tone = 'inflow' | 'outflow' | 'neutral';

/** Same glow and icon hues of the cash flow report totals. */
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

function averageCaption(value: number) {
  return `média de ${formatCurrency(value)} por mês`;
}

/**
 * Drawn like the `TotalCard` of the cash flow report, which is internal to that
 * component; this one receives the value already formatted, so the commitment
 * percentage fits the same card.
 */
function SummaryCard({
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
  value: string;
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
        <p className={cn('text-2xl font-bold tracking-tight md:text-3xl', valueClassName)}>{value}</p>
        <p className="text-xs text-zinc-500">{caption}</p>
      </div>
    </Card>
  );
}

/** Totals of the checked recurrences in the window. It only formats the given totals. */
export function RecurrenceSummaryComponent({ totals }: RecurrenceSummaryProps) {
  return (
    <section aria-label="Totais das recorrências" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <SummaryCard
        title="Entradas recorrentes"
        tone="inflow"
        icon={<ArrowUpRight />}
        value={formatCurrency(totals.inflow)}
        caption={averageCaption(totals.inflowMonthlyAverage)}
      />
      <SummaryCard
        title="Saídas recorrentes"
        tone="outflow"
        icon={<ArrowDownRight />}
        value={formatCurrency(totals.outflow)}
        caption={averageCaption(totals.outflowMonthlyAverage)}
      />
      <SummaryCard
        title="Resultado recorrente"
        tone="neutral"
        icon={<Scale />}
        value={formatCurrency(totals.result)}
        caption={averageCaption(totals.resultMonthlyAverage)}
        valueClassName={signClassName(totals.result)}
      />
      <SummaryCard
        title="Comprometimento"
        tone="neutral"
        icon={<Percent />}
        value={formatCommitment(totals.commitment)}
        caption="das entradas recorrentes vai para saídas recorrentes"
      />
    </section>
  );
}
