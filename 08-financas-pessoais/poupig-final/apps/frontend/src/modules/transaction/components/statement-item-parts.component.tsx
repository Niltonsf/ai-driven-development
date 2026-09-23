'use client';

import type { KeyboardEvent, MouseEvent } from 'react';
import { Check, Repeat } from 'lucide-react';
import {
  Direction,
  SeriesKind,
  StatementEntryKind,
  TransactionStatus,
  type StatementEntryDTO,
} from '@poupig/transaction';
import { Badge } from '@/shared/components/ui/badge';
import { Button } from '@/shared/components/ui/button';
import { formatCurrency } from '@/shared/components/ui/money-input';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/shared/components/ui/tooltip';
import { cn } from '@/shared/lib/class-name.util';
import { TRANSACTION_STATUS_LABELS } from '../data/transaction.labels';

const STATUS_BADGE_CLASSES: Record<TransactionStatus, string> = {
  [TransactionStatus.PENDING]: 'border-amber-500/40 bg-amber-500/10 text-amber-600 dark:text-amber-400',
  [TransactionStatus.SETTLED]: 'border-emerald-500/40 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
  [TransactionStatus.CANCELED]: 'border-border bg-muted text-muted-foreground',
};

function stopPropagation(event: MouseEvent<HTMLElement> | KeyboardEvent<HTMLElement>) {
  event.stopPropagation();
}

/** Opens a clickable row/card with `Enter` or `Space` when the row/card itself has focus. */
export function openOnActivationKey(event: KeyboardEvent<HTMLElement>, open: () => void) {
  if (event.target !== event.currentTarget) return;

  if (event.key === 'Enter') {
    open();
  } else if (event.key === ' ') {
    // Space would scroll the page.
    event.preventDefault();
    open();
  }
}

type SettleToggleButtonProps = {
  entry: StatementEntryDTO;
  isToggling: boolean;
  onToggle: (entry: StatementEntryDTO) => void;
};

/**
 * Round check that settles (`SETTLED`) or unsettles (`PENDING`) the entry.
 * It never opens the form: click and key events stop at the button.
 */
export function SettleToggleButton({ entry, isToggling, onToggle }: SettleToggleButtonProps) {
  const isSettled = entry.status === TransactionStatus.SETTLED;
  const isCanceled = entry.status === TransactionStatus.CANCELED;

  const button = (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      className={cn('size-9 shrink-0 rounded-full', isToggling && 'animate-pulse')}
      disabled={isCanceled || isToggling}
      aria-pressed={isSettled}
      aria-label={`Marcar "${entry.name}" como ${isSettled ? 'pendente' : 'efetivada'}`}
      onClick={(event) => {
        event.stopPropagation();
        onToggle(entry);
      }}
      onKeyDown={stopPropagation}
    >
      <span
        aria-hidden="true"
        className={cn(
          'flex size-5 items-center justify-center rounded-full border-2 transition-colors',
          isSettled ? 'border-emerald-500 bg-emerald-500 text-white' : 'border-zinc-500 text-transparent',
        )}
      >
        <Check className="size-3" strokeWidth={3} />
      </span>
    </Button>
  );

  if (!isCanceled) return button;

  // A disabled button fires no pointer events, so the tooltip listens on a focusable wrapper.
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span
          tabIndex={0}
          className="inline-flex shrink-0 rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          onClick={stopPropagation}
          onKeyDown={stopPropagation}
        >
          {button}
        </span>
      </TooltipTrigger>
      <TooltipContent>Transação cancelada: a situação é alterada pelo formulário.</TooltipContent>
    </Tooltip>
  );
}

/** Value with sign and color by direction. */
export function TransactionAmount({ entry, className }: { entry: StatementEntryDTO; className?: string }) {
  const isInflow = entry.direction === Direction.IN;

  return (
    <span
      className={cn(
        'whitespace-nowrap font-medium tabular-nums',
        isInflow ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400',
        className,
      )}
    >
      {isInflow ? '+' : '-'} {formatCurrency(entry.value)}
    </span>
  );
}

export function TransactionStatusBadge({ status, className }: { status: TransactionStatus; className?: string }) {
  return (
    <Badge variant="outline" className={cn(STATUS_BADGE_CLASSES[status], className)}>
      {TRANSACTION_STATUS_LABELS[status]}
    </Badge>
  );
}

/**
 * The only visual sign of an occurrence of a series: a discreet recurrence icon
 * whose tooltip names the series and, in an installment plan, the `N/T` text.
 * A standalone transaction renders nothing.
 */
export function RecurrenceSign({ entry }: { entry: StatementEntryDTO }) {
  if (entry.kind !== StatementEntryKind.SCHEDULED) return null;

  const installmentText =
    entry.seriesKind === SeriesKind.CLOSED && entry.installments !== null && entry.occurrenceIndex !== null
      ? `${entry.occurrenceIndex + 1}/${entry.installments}`
      : null;

  return (
    <span className="inline-flex shrink-0 items-center gap-1 text-xs text-muted-foreground">
      <Tooltip>
        <TooltipTrigger asChild>
          <span className="inline-flex">
            <Repeat className="size-3.5" aria-hidden="true" />
          </span>
        </TooltipTrigger>
        <TooltipContent>{entry.seriesName}</TooltipContent>
      </Tooltip>
      <span className="sr-only">Série {entry.seriesName}</span>
      {installmentText ? <span className="tabular-nums">{installmentText}</span> : null}
    </span>
  );
}

/** Number of transactions in a group header (never a money total). */
export function GroupCount({ count }: { count: number }) {
  return (
    <span className="rounded-full bg-white/8 px-2 py-0.5 text-[11px] tabular-nums text-zinc-300">
      {count}
      <span className="sr-only"> {count === 1 ? 'transação' : 'transações'}</span>
    </span>
  );
}
