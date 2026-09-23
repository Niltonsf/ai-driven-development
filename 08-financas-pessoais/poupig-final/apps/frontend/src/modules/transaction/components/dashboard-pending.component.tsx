'use client';

import Link from 'next/link';
import { AlertTriangle, ArrowRight, CalendarClock, ListChecks } from 'lucide-react';
import type { StatementEntryDTO } from '@poupig/transaction';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { TooltipProvider } from '@/shared/components/ui/tooltip';
import { cn } from '@/shared/lib/class-name.util';
import { MONTH_SHORT_LABELS } from '@/shared/util/month.util';
import type { PendingGroup } from '../data/dashboard-summary';
import { formatDateOnly } from '../data/statement-format';
import { DASHBOARD_CARD_CLASSES } from './dashboard-card.styles';
import { RecurrenceSign, TransactionAmount } from './statement-item-parts.component';

const STATEMENT_HREF = '/transactions';

export type DashboardPendingProps = {
  overdue: PendingGroup;
  upcoming: PendingGroup;
};

type GroupTone = 'overdue' | 'upcoming';

const GROUP_TONE_CLASSES: Record<GroupTone, { badge: string; chip: string; icon: string }> = {
  overdue: {
    badge: 'border-rose-500/30 bg-rose-500/10 text-rose-300',
    chip: 'border-rose-500/25 bg-rose-500/10 text-rose-200',
    icon: 'text-rose-400',
  },
  upcoming: {
    badge: 'border-white/10 bg-white/5 text-zinc-300',
    chip: 'border-white/10 bg-white/5 text-zinc-200',
    icon: 'text-blue-400',
  },
};

/** Day and short month read straight from the `YYYY-MM-DD` string, never through the browser time zone. */
function DateChip({ value, tone }: { value: string; tone: GroupTone }) {
  const [, month, day] = value.split('-');
  const monthLabel = MONTH_SHORT_LABELS[Number(month) - 1] ?? '';

  return (
    <span
      title={formatDateOnly(value)}
      className={cn(
        'flex size-11 shrink-0 flex-col items-center justify-center rounded-lg border leading-none',
        GROUP_TONE_CLASSES[tone].chip,
      )}
    >
      <span className="text-base font-bold tabular-nums">{day}</span>
      <span className="mt-0.5 text-[10px] uppercase tracking-wide opacity-70">{monthLabel}</span>
      <span className="sr-only">{formatDateOnly(value)}</span>
    </span>
  );
}

function PendingRow({ entry, tone }: { entry: StatementEntryDTO; tone: GroupTone }) {
  return (
    <li>
      <Link
        href={STATEMENT_HREF}
        className="group flex items-center gap-3 rounded-xl px-2 py-2 transition-colors hover:bg-white/4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <DateChip value={entry.expectedOn} tone={tone} />
        <span className="min-w-0 flex-1">
          <span className="flex items-center gap-1.5 text-sm font-medium text-zinc-100">
            <span className="truncate">{entry.name}</span>
            <RecurrenceSign entry={entry} />
          </span>
          <span className="block truncate text-xs text-zinc-500">{entry.accountName}</span>
        </span>
        <TransactionAmount entry={entry} className="text-sm" />
      </Link>
    </li>
  );
}

function PendingGroupSection({
  title,
  group,
  emptyText,
  tone,
}: {
  title: string;
  group: PendingGroup;
  emptyText: string;
  tone: GroupTone;
}) {
  const count = group.items.length + group.remaining;
  const Icon = tone === 'overdue' ? AlertTriangle : CalendarClock;

  return (
    <section aria-label={title} className="flex flex-col gap-2">
      <h4 className="flex items-center gap-2 px-2 text-sm font-medium text-zinc-300">
        <Icon className={cn('size-4', GROUP_TONE_CLASSES[tone].icon)} aria-hidden="true" />
        {title}
        <span
          className={cn(
            'rounded-full border px-2 py-0.5 text-[11px] font-semibold tabular-nums',
            tone === 'overdue' && count === 0 ? GROUP_TONE_CLASSES.upcoming.badge : GROUP_TONE_CLASSES[tone].badge,
          )}
        >
          {count}
          <span className="sr-only"> {count === 1 ? 'transação' : 'transações'}</span>
        </span>
      </h4>

      {group.items.length === 0 ? (
        <p className="flex flex-1 items-center gap-2 rounded-xl border border-dashed border-white/10 px-3 py-6 text-sm text-zinc-500">
          <ListChecks className="size-4 shrink-0" aria-hidden="true" />
          {emptyText}
        </p>
      ) : (
        <ul className="space-y-0.5">
          {group.items.map((entry) => (
            <PendingRow key={entry.id} entry={entry} tone={tone} />
          ))}
        </ul>
      )}

      {group.remaining > 0 ? <p className="px-2 text-xs text-zinc-500">e mais {group.remaining}</p> : null}
    </section>
  );
}

/** Overdue and upcoming pending entries of the month; every row leads to the statement. */
export function DashboardPendingComponent({ overdue, upcoming }: DashboardPendingProps) {
  return (
    <TooltipProvider>
      <Card className={cn(DASHBOARD_CARD_CLASSES, 'flex h-full flex-col')}>
        <CardHeader className="flex flex-row items-start justify-between gap-4 space-y-0">
          <div className="space-y-1">
            <CardTitle className="text-base font-semibold text-zinc-100">Pendências</CardTitle>
            <p className="text-xs text-zinc-400">O que ainda falta efetivar neste mês</p>
          </div>
          <span className="rounded-xl border border-white/10 bg-white/5 p-2.5 text-zinc-400 [&_svg]:size-5">
            <CalendarClock />
          </span>
        </CardHeader>
        <CardContent className="@container flex-1">
          <div className="grid gap-5 @2xl:grid-cols-2">
            <PendingGroupSection title="Atrasadas" group={overdue} emptyText="Nada atrasado neste mês" tone="overdue" />
            <PendingGroupSection title="Próximas" group={upcoming} emptyText="Nada por vir neste mês" tone="upcoming" />
          </div>
        </CardContent>
        <CardFooter className="border-t border-white/8 pt-4">
          <Link
            href={STATEMENT_HREF}
            className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
          >
            Ver no extrato
            <ArrowRight className="size-4" aria-hidden="true" />
          </Link>
        </CardFooter>
      </Card>
    </TooltipProvider>
  );
}
