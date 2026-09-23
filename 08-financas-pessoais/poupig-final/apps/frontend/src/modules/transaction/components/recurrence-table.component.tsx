'use client';

import { CheckCheck } from 'lucide-react';
import { Button } from '@/shared/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Checkbox } from '@/shared/components/ui/checkbox';
import { formatCurrency } from '@/shared/components/ui/money-input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/shared/components/ui/table';
import { cn } from '@/shared/lib/class-name.util';
import type { RecurrenceGroup, RecurrenceGroupId, RecurrenceRow } from '../data/recurrence-report';
import { DASHBOARD_CARD_CLASSES } from './dashboard-card.styles';

export type RecurrenceTableProps = {
  /** Short labels of the months of the window, ascending. */
  monthLabels: string[];
  /** Always both groups, inflow first. */
  groups: RecurrenceGroup[];
  /** Checked inflows minus checked outflows of each month. */
  resultByMonth: number[];
  /** Result of the window. */
  result: number;
  uncheckedCount: number;
  /** Whether the hidden recurrences are out of the totals (the single switch of the report). */
  excludesHidden: boolean;
  onToggleRecurrence: (seriesId: string) => void;
  onSetGroupChecked: (groupId: RecurrenceGroupId, checked: boolean) => void;
  onCheckAll: () => void;
};

/**
 * The first column stays fixed while the months scroll, so it needs an opaque
 * background: `zinc-900` is the left end of the dashboard card gradient.
 */
const STICKY_CELL_CLASSES =
  'sticky left-0 z-10 w-48 min-w-48 bg-zinc-900 shadow-[1px_0_0_rgba(255,255,255,0.08)] sm:w-64 sm:min-w-64';

/** Tint of the group header rows; the sticky cell repeats it over its opaque background. */
const TINTED_ROW_CLASSES = 'bg-white/3 hover:bg-white/3';
const TINTED_STICKY_CELL_CLASSES = 'bg-linear-to-r from-white/3 to-white/3';

const VALUE_CELL_CLASSES = 'whitespace-nowrap px-3 text-right tabular-nums';

const GROUP_TEXTS: Record<RecurrenceGroupId, { empty: string; subtotal: string; subtotalClassName: string }> = {
  inflow: {
    empty: 'Nenhuma entrada recorrente no período',
    subtotal: 'Total de entradas',
    subtotalClassName: 'text-emerald-400',
  },
  outflow: {
    empty: 'Nenhuma saída recorrente no período',
    subtotal: 'Total de saídas',
    subtotalClassName: 'text-rose-400',
  },
};

/** The sign of a result is shown only by color. */
function signClassName(value: number) {
  return value >= 0 ? 'text-emerald-400' : 'text-rose-400';
}

/** A month without value is a subtle dash, so the months with money stand out. */
function RecurrenceAmount({ value }: { value: number }) {
  if (value === 0) {
    return (
      <span className="text-zinc-600">
        <span aria-hidden="true">—</span>
        <span className="sr-only">sem valor</span>
      </span>
    );
  }

  return <>{formatCurrency(value)}</>;
}

function RecurrenceRowComponent({
  row,
  onToggleRecurrence,
}: {
  row: RecurrenceRow;
  onToggleRecurrence: (seriesId: string) => void;
}) {
  // Dimming the cell contents (and not the row) keeps the sticky cell opaque.
  const dimmedClassName = row.isChecked ? undefined : 'opacity-50';

  return (
    <TableRow className="border-white/5 hover:bg-transparent">
      <TableCell className={cn(STICKY_CELL_CLASSES, 'px-3 py-3')}>
        <div className="flex items-start gap-3">
          <Checkbox
            className="mt-0.5"
            checked={row.isChecked}
            onCheckedChange={() => onToggleRecurrence(row.seriesId)}
            aria-label={row.name}
          />
          <div className={cn('min-w-0 space-y-0.5', dimmedClassName)}>
            <p className="font-medium text-foreground">{row.name}</p>
            <p className="text-xs text-zinc-400">{row.frequencyLabel}</p>
            <p className="text-xs text-zinc-500">{row.detailLabel}</p>
          </div>
        </div>
      </TableCell>
      {row.months.map((item) => (
        <TableCell key={item.month} className={cn(VALUE_CELL_CLASSES, 'text-zinc-200', dimmedClassName)}>
          <RecurrenceAmount value={item.total} />
        </TableCell>
      ))}
      <TableCell className={cn(VALUE_CELL_CLASSES, 'font-medium text-zinc-100', dimmedClassName)}>
        <RecurrenceAmount value={row.total} />
      </TableCell>
    </TableRow>
  );
}

function RecurrenceGroupRows({
  group,
  columnCount,
  onToggleRecurrence,
  onSetGroupChecked,
}: {
  group: RecurrenceGroup;
  columnCount: number;
  onToggleRecurrence: (seriesId: string) => void;
  onSetGroupChecked: (groupId: RecurrenceGroupId, checked: boolean) => void;
}) {
  const texts = GROUP_TEXTS[group.id];
  const valueColumnCount = columnCount - 1;

  return (
    <>
      <TableRow className={cn('border-white/5', TINTED_ROW_CLASSES)}>
        <TableCell className={cn(STICKY_CELL_CLASSES, TINTED_STICKY_CELL_CLASSES, 'px-3 py-2.5')}>
          <div className="flex items-center gap-3">
            <Checkbox
              checked={group.checkState}
              // Radix sends `true` from the indeterminate state, so the first click checks the whole group.
              onCheckedChange={(checked) => onSetGroupChecked(group.id, checked === true)}
              aria-label={group.label}
              disabled={group.rows.length === 0}
            />
            <div className="min-w-0">
              <p className="text-sm font-semibold text-zinc-100">{group.label}</p>
              <p className="text-xs text-zinc-500">
                {group.checkedCount} de {group.rows.length} visíveis
              </p>
            </div>
          </div>
        </TableCell>
        <TableCell colSpan={valueColumnCount} />
      </TableRow>

      {group.rows.length === 0 ? (
        <TableRow className="border-white/5 hover:bg-transparent">
          <TableCell className={cn(STICKY_CELL_CLASSES, 'px-3 py-3 text-sm text-zinc-500')}>{texts.empty}</TableCell>
          <TableCell colSpan={valueColumnCount} />
        </TableRow>
      ) : (
        group.rows.map((row) => (
          <RecurrenceRowComponent key={row.seriesId} row={row} onToggleRecurrence={onToggleRecurrence} />
        ))
      )}

      <TableRow className="border-white/10 hover:bg-transparent">
        <TableCell className={cn(STICKY_CELL_CLASSES, 'px-3 py-2.5 text-sm font-semibold', texts.subtotalClassName)}>
          {texts.subtotal}
        </TableCell>
        {group.monthTotals.map((value, index) => (
          <TableCell key={index} className={cn(VALUE_CELL_CLASSES, 'font-semibold', texts.subtotalClassName)}>
            {formatCurrency(value)}
          </TableCell>
        ))}
        <TableCell className={cn(VALUE_CELL_CLASSES, 'font-semibold', texts.subtotalClassName)}>
          {formatCurrency(group.total)}
        </TableCell>
      </TableRow>
    </>
  );
}

/**
 * Month by month table of the recurrences, which is also the control of the
 * report: the check boxes decide what every sum considers. Rows never navigate.
 */
export function RecurrenceTableComponent({
  monthLabels,
  groups,
  resultByMonth,
  result,
  uncheckedCount,
  excludesHidden,
  onToggleRecurrence,
  onSetGroupChecked,
  onCheckAll,
}: RecurrenceTableProps) {
  const columnCount = monthLabels.length + 2;

  return (
    <Card className={cn(DASHBOARD_CARD_CLASSES, 'flex flex-col')}>
      <CardHeader className="flex flex-row flex-wrap items-start justify-between gap-4 space-y-0">
        <div className="space-y-1">
          <CardTitle className="text-base font-semibold text-zinc-100">Recorrências</CardTitle>
          <p className="text-xs text-zinc-400">
            Desmarque uma recorrência para escondê-la do gráfico
            {excludesHidden ? ' e descontá-la dos totais' : ''}
          </p>
        </div>
        {uncheckedCount > 0 ? (
          <Button type="button" variant="outline" size="sm" onClick={onCheckAll}>
            <CheckCheck className="size-4" />
            Mostrar todas ({uncheckedCount})
          </Button>
        ) : null}
      </CardHeader>

      <CardContent>
        <div className="overflow-x-auto">
          <Table className="min-w-max">
            <TableHeader>
              <TableRow className="border-white/10 hover:bg-transparent">
                <TableHead className={cn(STICKY_CELL_CLASSES, 'px-3')}>Recorrência</TableHead>
                {monthLabels.map((label) => (
                  <TableHead key={label} className="whitespace-nowrap px-3 text-right">
                    {label}
                  </TableHead>
                ))}
                <TableHead className="whitespace-nowrap px-3 text-right">Total</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {groups.map((group) => (
                <RecurrenceGroupRows
                  key={group.id}
                  group={group}
                  columnCount={columnCount}
                  onToggleRecurrence={onToggleRecurrence}
                  onSetGroupChecked={onSetGroupChecked}
                />
              ))}

              <TableRow className="border-t border-white/15 hover:bg-transparent">
                <TableCell className={cn(STICKY_CELL_CLASSES, 'px-3 py-3 text-sm font-semibold text-zinc-100')}>
                  Resultado recorrente
                </TableCell>
                {resultByMonth.map((value, index) => (
                  <TableCell key={index} className={cn(VALUE_CELL_CLASSES, 'font-semibold', signClassName(value))}>
                    {formatCurrency(value)}
                  </TableCell>
                ))}
                <TableCell className={cn(VALUE_CELL_CLASSES, 'font-bold', signClassName(result))}>
                  {formatCurrency(result)}
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
