import type { ReactNode } from 'react';
import { ArrowDownRight, ArrowUpRight, CheckCircle2, Scale } from 'lucide-react';
import { Card } from '@/shared/components/ui/card';
import { formatCurrency } from '@/shared/components/ui/money-input';
import { cn } from '@/shared/lib/class-name.util';
import { shareOf, type MonthSummary } from '../data/dashboard-summary';
import { DASHBOARD_CARD_CLASSES } from './dashboard-card.styles';

export type DashboardSummaryProps = {
  summary: MonthSummary;
};

type Tone = 'inflow' | 'outflow' | 'neutral';

const TONE_CLASSES: Record<Tone, { glow: string; icon: string; meter: string }> = {
  inflow: {
    glow: 'bg-[radial-gradient(circle_at_100%_0%,rgba(16,185,129,0.16),transparent_55%)]',
    icon: 'border-emerald-500/25 bg-emerald-500/10 text-emerald-400',
    meter: 'bg-emerald-500',
  },
  outflow: {
    glow: 'bg-[radial-gradient(circle_at_100%_0%,rgba(244,63,94,0.16),transparent_55%)]',
    icon: 'border-rose-500/25 bg-rose-500/10 text-rose-400',
    meter: 'bg-rose-500',
  },
  neutral: {
    glow: 'bg-[radial-gradient(circle_at_100%_0%,rgba(59,130,246,0.18),transparent_55%)]',
    icon: 'border-blue-500/25 bg-blue-500/10 text-blue-400',
    meter: 'bg-blue-500',
  },
};

/** The sign of a result is shown only by color. */
function resultClassName(value: number) {
  return value >= 0 ? 'text-emerald-400' : 'text-rose-400';
}

function formatPercent(share: number): string {
  return `${Math.round(share * 100)}%`;
}

function IndicatorCard({
  title,
  tone,
  icon,
  children,
  className,
}: {
  title: string;
  tone: Tone;
  icon: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  const toneClasses = TONE_CLASSES[tone];

  return (
    <Card className={cn(DASHBOARD_CARD_CLASSES, 'flex flex-col gap-4 p-5', className)}>
      <div aria-hidden="true" className={cn('pointer-events-none absolute inset-0', toneClasses.glow)} />
      <div className="relative flex items-center justify-between gap-3">
        <p className="text-sm font-medium text-zinc-300">{title}</p>
        <span className={cn('rounded-xl border p-2 [&_svg]:size-4', toneClasses.icon)}>{icon}</span>
      </div>
      <div className="relative flex flex-1 flex-col justify-end gap-3">{children}</div>
    </Card>
  );
}

/** Expected amount with how much of it is already settled, as a thin meter on the same hue. */
function FlowIndicator({
  title,
  tone,
  icon,
  expected,
  settled,
}: {
  title: string;
  tone: Exclude<Tone, 'neutral'>;
  icon: ReactNode;
  expected: number;
  settled: number;
}) {
  const settledShare = shareOf(settled, expected);

  return (
    <IndicatorCard title={title} tone={tone} icon={icon}>
      <div>
        <p className="text-2xl font-bold tracking-tight text-zinc-50 md:text-3xl">{formatCurrency(expected)}</p>
        <p className="text-xs text-zinc-500">previsto no mês</p>
      </div>
      <div className="space-y-1.5">
        <div
          role="meter"
          aria-label={`${title} efetivadas`}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={Math.round(settledShare * 100)}
          className="h-1.5 w-full overflow-hidden rounded-full bg-white/8"
        >
          <div
            className={cn('h-full rounded-full transition-[width] duration-500', TONE_CLASSES[tone].meter)}
            style={{ width: `${settledShare * 100}%` }}
          />
        </div>
        <p className="flex justify-between gap-2 text-xs text-zinc-400">
          <span>
            Efetivado <span className="font-medium text-zinc-200">{formatCurrency(settled)}</span>
          </span>
          <span className="tabular-nums">{formatPercent(settledShare)}</span>
        </p>
      </div>
    </IndicatorCard>
  );
}

const RING_RADIUS = 34;
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;

/** Settlement progress as a single-value ring (a meter, not a two-slice pie). */
function SettlementRing({ settledCount, activeCount }: { settledCount: number; activeCount: number }) {
  const share = shareOf(settledCount, activeCount);

  return (
    <div
      role="progressbar"
      aria-label="Progresso de efetivação"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(share * 100)}
      className="relative size-24 shrink-0"
    >
      <svg viewBox="0 0 80 80" className="size-full -rotate-90" aria-hidden="true">
        <circle cx="40" cy="40" r={RING_RADIUS} fill="none" strokeWidth="8" className="stroke-white/8" />
        <circle
          cx="40"
          cy="40"
          r={RING_RADIUS}
          fill="none"
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={RING_CIRCUMFERENCE}
          strokeDashoffset={RING_CIRCUMFERENCE * (1 - share)}
          className={cn('stroke-blue-500 transition-[stroke-dashoffset] duration-500', share === 0 && 'opacity-0')}
        />
      </svg>
      <span className="absolute inset-0 flex items-center justify-center text-lg font-bold tabular-nums text-zinc-50">
        {formatPercent(share)}
      </span>
    </div>
  );
}

/** Month indicators (expected × settled) and the settlement progress. It only renders the given summary. */
export function DashboardSummaryComponent({ summary }: DashboardSummaryProps) {
  return (
    <section aria-label="Indicadores do mês" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <IndicatorCard title="Resultado previsto" tone="neutral" icon={<Scale />}>
        <div>
          <p className={cn('text-2xl font-bold tracking-tight md:text-3xl', resultClassName(summary.expectedResult))}>
            {formatCurrency(summary.expectedResult)}
          </p>
          <p className="text-xs text-zinc-500">entradas menos saídas, pendentes e efetivadas</p>
        </div>
        <div className="flex items-center justify-between gap-2 rounded-lg border border-white/8 bg-white/3 px-3 py-2 text-xs">
          <span className="text-zinc-400">Resultado efetivado</span>
          <span className={cn('font-semibold tabular-nums', resultClassName(summary.settledResult))}>
            {formatCurrency(summary.settledResult)}
          </span>
        </div>
      </IndicatorCard>

      <FlowIndicator
        title="Entradas"
        tone="inflow"
        icon={<ArrowUpRight />}
        expected={summary.inflow}
        settled={summary.settledInflow}
      />

      <FlowIndicator
        title="Saídas"
        tone="outflow"
        icon={<ArrowDownRight />}
        expected={summary.outflow}
        settled={summary.settledOutflow}
      />

      <IndicatorCard title="Efetivação" tone="neutral" icon={<CheckCircle2 />}>
        <div className="flex items-center gap-4">
          <SettlementRing settledCount={summary.settledCount} activeCount={summary.activeCount} />
          <div className="space-y-1">
            <p className="text-sm text-zinc-300">
              <span className="text-xl font-bold tabular-nums text-zinc-50">{summary.settledCount}</span> de{' '}
              <span className="font-semibold tabular-nums text-zinc-100">{summary.activeCount}</span>
            </p>
            <p className="text-xs text-zinc-500">transações efetivadas</p>
          </div>
        </div>
      </IndicatorCard>
    </section>
  );
}
